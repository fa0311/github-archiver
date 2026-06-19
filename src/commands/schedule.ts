import { Args, Command, Flags } from "@oclif/core";
import { Semaphore } from "async-mutex";
import { CronJob } from "cron";
import "dotenv/config";
import pino from "pino";
import type { RepositoryLocator } from "../utils/api/client.ts";
import { createApi } from "../utils/api/index.ts";
import { parseConfig } from "../utils/config.ts";
import { parseEnv } from "../utils/env.ts";
import { createGitSpawn } from "../utils/git.ts";
import { createCompletion, createHeartbeat } from "../utils/healthcheck.ts";
import { createJq } from "../utils/jq.ts";
import { formatDuration } from "../utils/log.ts";
import { placeholder } from "../utils/placeholder.ts";
import { repositoryName } from "../utils/repository.ts";
import { createSafeCommand } from "../utils/safecommand.ts";

export default class Schedule extends Command {
	static description = "Run scheduled archiving based on configuration file";

	static examples = [
		{
			description: "Run scheduled archiving with default config",
			command: "<%= config.bin %> schedule",
		},
		{
			description: "Run scheduled archiving with custom config",
			command: "<%= config.bin %> schedule schedule.json",
		},
		{
			description: "Run once without scheduling (useful for testing)",
			command: "<%= config.bin %> schedule --runOnce",
		},
	];

	static args = {
		config: Args.file({
			description: "Path to the schedule configuration file",
			default: "schedule.json",
			exists: true,
		}),
	};

	static flags = {
		runOnce: Flags.boolean({
			description: "Run the archive task once immediately without scheduling",
			default: false,
		}),
		help: Flags.help(),
		version: Flags.version(),
	};

	async run() {
		const { args, flags } = await this.parse(Schedule);
		const config = await parseConfig(args.config);
		const env = await parseEnv();
		const logger = pino({
			transport: env.LOG_COLOR ? { target: "pino-pretty" } : undefined,
			level: env.LOG_LEVEL,
			timestamp: pino.stdTimeFunctions.isoTime,
		});

		const git = createGitSpawn(env.GIT_PATH, { env });
		const jq = createJq(env.JQ_PATH, { env });

		const onTick = async () => {
			const duration = await formatDuration(async () => {
				logger.info("Getting repository list from queries");

				const safeCommand = createSafeCommand();
				const semaphore = new Semaphore(5);

				const repositories = await (async () => {
					const result: Record<string, RepositoryLocator> = {};
					for (const query of config.queries) {
						const api = createApi(query.provider, env);
						switch (query.type) {
							case "url": {
								const name = repositoryName(query.url);
								result[name] = {
									name: name,
									path: placeholder(config.output, { name, provider: query.provider }),
									url: query.url,
									description: await safeCommand(() => api.describe(query.url)),
									gitArgs: api.gitArgs,
								};
								break;
							}
							case "api": {
								const pages = await safeCommand(() => api.query(query.path));
								const lines = await safeCommand(async () => {
									const filtered = await Promise.all(pages.map((page) => jq.filter(page, query.jq)));
									return filtered.flat();
								});
								for (const line of lines) {
									const { url, description } = api.parse(line);
									const name = repositoryName(url);
									result[name] = {
										name: name,
										path: placeholder(config.output, { name, provider: query.provider }),
										url,
										description,
										gitArgs: api.gitArgs,
									};
								}
								break;
							}
						}
					}

					return Object.values(result);
				})();

				logger.info(`Found ${repositories.length} repositories to archive`);
				logger.debug(`Archiving repositories: ${JSON.stringify(repositories.map(({ name }) => name))}`);

				const completion = (() => {
					if (env.COMPLETION_STATUS_PATH) {
						return createCompletion(env.COMPLETION_STATUS_PATH, logger.error);
					}
				})();

				const promises = repositories.map(async ({ name, path, url, description, gitArgs }) => {
					await semaphore.runExclusive(async () => {
						try {
							logger.info(`Archiving repository: ${name}`);
							const repository = git.repository(path, gitArgs);
							const exists = await repository.has();

							if (exists) {
								const duration = await formatDuration(() => safeCommand(() => repository.fetch()));
								logger.info(`Fetched ${name} in ${duration}`);
							} else {
								const duration = await formatDuration(() => safeCommand(() => repository.clone(url.toString())));
								logger.info(`Cloned ${name} in ${duration}`);
							}

							await repository.writeWebLastModified();
							await repository.writeDescription(description ?? "");

							logger.debug(`Finished archiving repository: ${name}`);
						} catch (error) {
							completion?.error();
							logger.error(error);
						}
					});
				});
				await Promise.all(promises);
				completion?.finish();
			});
			return logger.info(`Scheduled archive task completed in ${duration}`);
		};

		if (env.HEARTBEAT_PATH) {
			createHeartbeat(env.HEARTBEAT_PATH, logger.error);
		}

		if (flags.runOnce) {
			await onTick();
		} else {
			CronJob.from({
				cronTime: config.cron,
				onTick: onTick,
				start: true,
				timeZone: env.TZ,
				runOnInit: config.runOnInit,
				errorHandler: (error: unknown) => {
					logger.error(error);
				},
				waitForCompletion: true,
			});
		}
	}
}
