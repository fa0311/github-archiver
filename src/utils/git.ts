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

export const createGitSpawn = async (git: string, path: string, env: NodeJS.ProcessEnv) => {
	const run = async (args: string[]) => {
		const result = await new Promise<string>((resolve, reject) => {
			const child = spawn(git, args, { stdio: ["inherit", "pipe", "inherit"], env });
			let output = "";

			child.stdout.setEncoding("utf8");
			child.stdout.on("data", (chunk) => {
				output += chunk;
			});
			child.once("error", reject);
			child.once("close", (code, signal) => {
				if (code === 0) {
					resolve(output);
					return;
				}

				reject(new Error(`failed: ${signal ?? code}`));
			});
		});

		const symbolicRef = (name: string) => {
			for (const line of result.split("\n")) {
				const [ref, target] = line.split("\t", 2);
				if (target === name && ref.startsWith("ref: ")) {
					return ref.slice("ref: ".length);
				}
			}
		};
		return { result, symbolicRef };
	};

	return {
		has: async () => {
			return fs.existsSync(path);
		},
		clone: async (url: string) => {
			return run(["clone", "--mirror", url, path]);
		},
		fetch: async () => {
			await run([
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
			]);
			const output = await run(["-C", path, "ls-remote", "--symref", "origin", "HEAD"]);
			const head = output.symbolicRef("HEAD");
			if (head) {
				await run(["-C", path, "symbolic-ref", "HEAD", head]);
			}
		},
	};
};
