import { Args, Command, Flags } from "@oclif/core";
import { Semaphore } from "async-mutex";
import { type ArchiveTarget, createSafeCommand, repositoryKey } from "../archive.ts";
import { catchError } from "../utils/catch.ts";
import { parseEnv } from "../utils/env.ts";
import { createGitSpawn, parseGitHubRepositoryUrl } from "../utils/git.ts";
import { formatDuration, info, success, title } from "../utils/log.ts";
import { placeholder } from "../utils/placeholder.ts";
import { progress } from "../utils/progress.ts";

export default class Archive extends Command {
	static description = "Archive GitHub repositories as local mirror clones";

	static examples = [
		{
			description: "Archive a repository",
			command: "<%= config.bin %> archive https://github.com/octocat/Hello-World",
		},
		{
			description: "Archive multiple repositories",
			command: "<%= config.bin %> archive https://github.com/octocat/Hello-World https://github.com/github/docs",
		},
		{
			description: "Archive repositories returned by GitHub CLI",
			command: "<%= config.bin %> archive $(gh api --paginate '/user/repos?per_page=100' --jq '.[].clone_url')",
		},
		{
			description: "Archive with a custom output directory",
			command: "<%= config.bin %> archive https://github.com/octocat/Hello-World --output=backups/{owner}/{repo}.git",
		},
	];

	static args = {
		input: Args.string({
			required: true,
			description: "HTTPS GitHub repository URL to archive",
			multiple: true,
		}),
	};

	static flags = {
		output: Flags.string({
			char: "o",
			description: "Output directory pattern",
			default: "archives/{owner}/{repo}",
		}),
		quiet: Flags.boolean({
			char: "q",
			description: "Suppress progress output",
			default: false,
		}),
		help: Flags.help(),
		version: Flags.version(),
	};

	async run() {
		this.log(title("GitHub Archiver"));
		const { args, flags } = await this.parse(Archive);

		const repositories = await (async () => {
			const result: Record<string, ArchiveTarget> = {};
			for (const input of args.input) {
				result[repositoryKey(parseGitHubRepositoryUrl(input))] = parseGitHubRepositoryUrl(input);
			}
			return Object.values(result);
		})();

		const env = await parseEnv();
		const git = await createGitSpawn(env.GIT_PATH, { env });
		const safeCommand = createSafeCommand();
		const semaphore = new Semaphore(5);

		await progress({ hidden: flags.quiet }, async (multiBar) => {
			await multiBar.create({ total: repositories.length, filename: "Repositories", hidden: repositories.length <= 1 }, async (bar) => {
				const promises = repositories.map(async (target) => {
					await semaphore.runExclusive(async () => {
						const key = repositoryKey(target);

						const archivePath = placeholder(flags.output, { owner: target.owner, repo: target.repo });
						const repository = git.repository(archivePath);
						const exists = await repository.has();

						if (exists) {
							const duration = await formatDuration(() => safeCommand(async () => repository.fetch()));
							multiBar.log(info(`Fetched ${key} in ${duration}`));
						} else {
							const duration = await formatDuration(() => safeCommand(() => repository.clone(target.url)));
							multiBar.log(info(`Cloned ${key} in ${duration}`));
						}

						bar.increment();
					});
				});
				await Promise.all(promises);
			});
		});

		this.log(success("Archive completed successfully"));
	}

	async catch(error: Error) {
		this.log(catchError(error));
	}
}
