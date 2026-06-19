import { Args, Command, Flags } from "@oclif/core";
import { Semaphore } from "async-mutex";
import { createSafeCommand, type RepositoryLocator } from "../archive.ts";
import { createApi } from "../utils/api/index.ts";
import { catchError } from "../utils/catch.ts";
import { type RepositoryProvider, repositoryProviderSchema } from "../utils/config.ts";
import { parseEnv } from "../utils/env.ts";
import { createGitSpawn } from "../utils/git.ts";
import { formatDuration, info, success, title } from "../utils/log.ts";
import { placeholder } from "../utils/placeholder.ts";
import { progress } from "../utils/progress.ts";
import { repositoryName } from "../utils/repository.ts";

export default class Archive extends Command {
	static description = "Archive Git repositories as local mirror clones";

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
			command: "<%= config.bin %> archive https://github.com/octocat/Hello-World --output=backups/{name}.git",
		},
	];

	static args = {
		input: Args.url({
			required: true,
			description: "HTTPS repository URL to archive",
			multiple: true,
		}),
	};

	static flags = {
		output: Flags.string({
			char: "o",
			description: "Output directory pattern",
			default: "archives/{name}",
		}),
		quiet: Flags.boolean({
			char: "q",
			description: "Suppress progress output",
			default: false,
		}),
		provider: Flags.custom<RepositoryProvider>({
			description: "Repository provider",
			options: repositoryProviderSchema.options,
			default: "github",
		})(),
		help: Flags.help(),
		version: Flags.version(),
	};

	async run() {
		this.log(title("GitHub Archiver"));
		const { args, flags } = await this.parse(Archive);

		const env = await parseEnv();
		const git = createGitSpawn(env.GIT_PATH, { env });
		const api = createApi(flags.provider, env);
		const safeCommand = createSafeCommand();

		const repositories = await (async () => {
			const result: Record<string, RepositoryLocator> = {};
			for (const input of args.input) {
				const name = repositoryName(input);
				result[name] = {
					name: name,
					path: placeholder(flags.output, { name, provider: flags.provider }),
					url: new URL(input),
					description: await safeCommand(() => api.describe(new URL(input))),
					gitArgs: api.gitArgs,
				};
			}
			return Object.values(result);
		})();

		const semaphore = new Semaphore(5);

		await progress({ hidden: flags.quiet }, async (multiBar) => {
			await multiBar.create({ total: repositories.length, filename: "Repositories", hidden: repositories.length <= 1 }, async (bar) => {
				const promises = repositories.map(async ({ name, path, url, description, gitArgs }) => {
					await semaphore.runExclusive(async () => {
						const repository = git.repository(path, gitArgs);
						const exists = await repository.has();

						if (exists) {
							const duration = await formatDuration(() => safeCommand(async () => repository.fetch()));
							multiBar.log(info(`Fetched ${name} in ${duration}`));
						} else {
							const duration = await formatDuration(() => safeCommand(() => repository.clone(url.toString())));
							multiBar.log(info(`Cloned ${name} in ${duration}`));
						}

						await repository.writeWebLastModified();
						await repository.writeDescription(description ?? "");

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
