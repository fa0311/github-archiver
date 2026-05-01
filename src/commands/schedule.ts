import fs from "node:fs";
import { Args, Command, Flags } from "@oclif/core";
import pino from "pino";
import { parseConfig } from "../utils/config.ts";
import { parseEnv } from "../utils/env.ts";
import "dotenv/config";
import path from "node:path";
import { CronJob } from "cron";
import { set } from "zod";
import { createGhSpawn, createGitSpawn, parseGitHubRepositoryUrl } from "../utils/git.ts";
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
			const start = performance.now();
			logger.info("Getting repository list from queries");

			const repositories: ReturnType<typeof parseGitHubRepositoryUrl>[] = [];
			for (const query of config.queries) {
				switch (query.type) {
					case "url":
						repositories.push(parseGitHubRepositoryUrl(query.url));
						break;
					case "api": {
						const apiRepositories = await gh.api(query.path, query.jq);
						repositories.push(...apiRepositories.map(parseGitHubRepositoryUrl));
						break;
					}
				}
			}

			logger.info(`Found ${repositories.length} repositories to archive`);
			logger.debug(`Downloading repositories: ${JSON.stringify(repositories.map(({ owner, repo }) => `${owner}/${repo}`))}`);

			for (const { owner, repo, url } of repositories) {
				try {
					const repository = git.repository(placeholder(config.output, { owner, repo }));
					if (await repository.has()) {
						logger.info(`Fetching latest changes for ${owner}/${repo}...`);
						await repository.fetch();
					} else {
						logger.info(`Cloning repository ${owner}/${repo}...`);
						await repository.clone(url);
					}
					if (env.COMPLETION_STATUS_PATH) {
						outputResult(env.COMPLETION_STATUS_PATH, true, logger.error);
					}
				} catch (_) {
					if (env.COMPLETION_STATUS_PATH) {
						outputResult(env.COMPLETION_STATUS_PATH, false, logger.error);
					}
				}
			}

			const end = performance.now();
			const duration = end - start;
			const seconds = Math.floor((duration / 1000) % 60);
			const minutes = Math.floor((duration / (1000 * 60)) % 60);
			return logger.info(`Scheduled download task completed in ${minutes}m ${seconds}s`);
		};

		if (env.HEARTBEAT_PATH) {
			const pathname = env.HEARTBEAT_PATH;
			outputTimestamp(pathname, logger.error);
			setInterval(() => outputTimestamp(pathname, logger.error), 60000);
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
