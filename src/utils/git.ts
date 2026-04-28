import { spawn } from "node:child_process";
import fs from "node:fs";

export const parseGitHubRepositoryUrl = (url: string) => {
	const github = new URLPattern({
		protocol: "https:",
		hostname: "github.com",
		pathname: "/:owner/:repo{.git}?",
	});
	const match = github.exec(url);
	if (match) {
		const { owner, repo } = match.pathname.groups;
		return { owner, repo, url } as { owner: string; repo: string; url: string };
	}
	throw new Error("Invalid GitHub repository URL");
};

export const createGitSpawn = async (git: string, path: string) => {
	return {
		has: async () => {
			return fs.existsSync(path);
		},
		clone: async (url: string) => {
			return spawn(git, ["clone", "--mirror", url, path], { stdio: "inherit" });
		},
		fetch: async () => {
			return spawn(
				git,
				[
					"-c",
					"gc.auto=0",
					"-C",
					path,
					"fetch",
					"origin",
					"--atomic",
					"--prune",
					"--prune-tags",
					"--show-forced-updates",
					"+refs/heads/*:refs/heads/*",
					"+refs/tags/*:refs/tags/*",
				],
				{ stdio: "inherit" },
			);
		},
	};
};
