import { Args, Command, Flags } from "@oclif/core";
import chalk from "chalk";
import { catchError } from "../utils/catch.ts";
import { parseEnv } from "../utils/env.ts";
import { createGitSpawn, parseGitHubRepositoryUrl } from "../utils/git.ts";
import { title } from "../utils/info.ts";
import { placeholder } from "../utils/placeholder.ts";

export default class Download extends Command {
	static description = "Download galleries by ID or URL";

	static examples = [];

	static args = {
		input: Args.string({
			required: true,
			description: "http(s) URL or gallery ID to download",
			multiple: true,
		}),
	};

	static flags = {
		output: Flags.string({
			char: "o",
			description: "Output directory",
			default: "archives/{owner}/{repo}",
		}),
		help: Flags.help(),
		version: Flags.version(),
	};

	async run() {
		this.log(title("GitHub Archiver"));
		const { args, flags } = await this.parse(Download);
		const { input } = args;
		const { output } = flags;

		const parsedInputs = input.map(parseGitHubRepositoryUrl);

		const env = await parseEnv();
		const git = await createGitSpawn(env.GIT_PATH, { env });

		for (const { owner, repo, url } of parsedInputs) {
			const repository = git.repository(placeholder(output, { owner, repo }));

			if (await repository.has()) {
				this.log(`Fetching latest changes for ${owner}/${repo}...`);
				await repository.fetch();
			} else {
				this.log(`Cloning repository ${owner}/${repo}...`);
				await repository.clone(url);
			}
		}
		this.log(chalk.green("Archive completed successfully"));
	}

	async catch(error: Error) {
		this.log(catchError(error));
	}
}
