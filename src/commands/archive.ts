import path from "node:path";
import { Args, Command } from "@oclif/core";
import { createGitSpawn, parseGitHubRepositoryUrl } from "../utils/git.js";

export default class Download extends Command {
	static description = "Download galleries by ID or URL";

	static examples = [];

	static args = {
		input: Args.string({
			required: true,
			description: "http(s) URL or gallery ID to download",
		}),
	};

	static flags = {};

	async run() {
		const { args } = await this.parse(Download);
		const { input } = args;
		const { owner, repo, url } = parseGitHubRepositoryUrl(input);
		this.log(`Cloning repository ${owner}/${repo}...`);
		const git = await createGitSpawn("git", path.join("archive", owner, repo));
		if (await git.has()) {
			await git.fetch();
		} else {
			await git.clone(url);
		}

		this.log("Download complete.");
	}
}
