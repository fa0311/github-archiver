import fs from "node:fs";
import path from "node:path";
import { Args, Command, Flags } from "@oclif/core";
import { Semaphore } from "async-mutex";
import { CronJob } from "cron";
import "dotenv/config";
import pino from "pino";
import { type ArchiveTarget, createSafeCommand, repositoryKey } from "../archive.ts";
import { loadCheckpoint } from "../utils/checkpoint.ts";
import { parseConfig } from "../utils/config.ts";
import { parseEnv } from "../utils/env.ts";
import { GitHubArchiverAlreadyExistsError } from "../utils/error.ts";
import { outputFile } from "../utils/file.ts";
import { createGhSpawn, createGitSpawn, parseGitHubRepositoryUrl } from "../utils/git.ts";
import { formatDuration } from "../utils/log.ts";
import { exhaustiveMatchAsync } from "../utils/match.ts";
import { placeholder } from "../utils/placeholder.ts";

const outputTimestamp = (filename: string, errorHandler: (error: unknown) => void) => {
	(async () => {
		await fs.promises.mkdir(path.dirname(filename), { recursive: true });
		await fs.promises.writeFile(filename, `${Math.floor(Date.now() / 1000)}\n`, "utf8");
	})().catch(errorHandler);
};

const outputResult = (filename: string, result: boolean, errorHandler: (error: unknown) => void) => {
	(async () => {
		await fs.promises.mkdir(path.dirname(filename), { recursive: true });
		await fs.promises.writeFile(filename, `${result}\n`, "utf8");
	})().catch(errorHandler);
};

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
		runOnce: Flags.boolean(),
		setup: Flags.boolean(),
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

		const git = await createGitSpawn(env.GIT_PATH, { env });
		const gh = await createGhSpawn(env.GH_PATH, { env });
		if (flags.setup) {
			await gh.setup();
			logger.info("Git authentication setup completed");
		}

		const onTick = async () => {
			const duration = await formatDuration(async () => {
				logger.info("Getting repository list from queries");

				const safeCommand = createSafeCommand();
				const checkpointKeys = await loadCheckpoint(config.checkpoint);
				const semaphore = new Semaphore(5);

				const repositories = await (async () => {
					const result: Record<string, ArchiveTarget> = {};
					for (const query of config.queries) {
						switch (query.type) {
							case "url":
								result[repositoryKey(parseGitHubRepositoryUrl(query.url))] = parseGitHubRepositoryUrl(query.url);
								break;
							case "api": {
								const apiRepositories = await safeCommand(() => gh.api(query.path, query.jq));
								for (const repo of apiRepositories) {
									result[repositoryKey(parseGitHubRepositoryUrl(repo))] = parseGitHubRepositoryUrl(repo);
								}
								break;
							}
						}
					}

					return Object.values(result).filter((repo) => !checkpointKeys.includes(repositoryKey(repo)));
				})();

				logger.info(`Found ${repositories.length} repositories to archive`);
				logger.debug(`Archiving repositories: ${JSON.stringify(repositories.map(({ owner, repo }) => `${owner}/${repo}`))}`);

				await outputFile(async (file) => {
					const checkpoint = config.checkpoint ? await file.create(config.checkpoint, "a") : null;
					const promises = repositories.map(async (target) => {
						await semaphore.runExclusive(async () => {
							try {
								const key = repositoryKey(target);
								logger.info(`Archiving repository: ${key}`);
								const archivePath = placeholder(config.output, { owner: target.owner, repo: target.repo });
								const repository = git.repository(archivePath);
								const exists = await repository.has();

								if (exists) {
									const runner = exhaustiveMatchAsync({
										error: async () => {
											throw new GitHubArchiverAlreadyExistsError(`File or directory already exists: ${archivePath}`);
										},
										skip: async () => {
											logger.warn(`Skipping existing file or directory: ${archivePath}`);
										},
										fetch: async () => {
											const duration = await formatDuration(() => safeCommand(() => repository.fetch()));
											logger.info(`Fetched ${key} in ${duration}`);
										},
										overwrite: async () => {
											logger.warn(`Overwriting existing file or directory: ${archivePath}`);
											await repository.remove();
											const duration = await formatDuration(() => safeCommand(() => repository.clone(target.url)));
											logger.info(`Cloned ${key} in ${duration}`);
										},
									});
									await runner(config.ifExists);
								} else {
									const duration = await formatDuration(() => safeCommand(() => repository.clone(target.url)));
									logger.info(`Cloned ${key} in ${duration}`);
								}

								await checkpoint?.line(key);

								if (env.COMPLETION_STATUS_PATH) {
									outputResult(env.COMPLETION_STATUS_PATH, true, logger.error);
								}
								logger.debug(`Finished archiving repository: ${key}`);
							} catch (error) {
								if (env.COMPLETION_STATUS_PATH) {
									outputResult(env.COMPLETION_STATUS_PATH, false, logger.error);
								}
								logger.error(error);
							}
						});
					});
					await Promise.all(promises);
				});
			});
			return logger.info(`Scheduled archive task completed in ${duration}`);
		};

		if (env.HEARTBEAT_PATH) {
			const pathname = env.HEARTBEAT_PATH;
			outputTimestamp(pathname, logger.error);
			setInterval(() => void outputTimestamp(pathname, logger.error), 60000);
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
