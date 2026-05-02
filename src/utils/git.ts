import { spawn } from "node:child_process";
import fs from "node:fs";

export type GitHubRepository = {
	owner: string;
	repo: string;
	url: string;
};

export const parseGitHubRepositoryUrl = (url: string) => {
	const github = new URLPattern({
		protocol: "https",
		hostname: "github.com",
		pathname: "/:owner/:repo{.git}?",
	});
	const match = github.exec(url);
	if (match) {
		const { owner, repo } = match.pathname.groups;
		return { owner, repo, url } as GitHubRepository;
	}
	throw new Error("Invalid GitHub repository URL");
};

type RunOptions = {
	env?: NodeJS.ProcessEnv;
	input?: string;
	stdout?: (chunk: string) => void;
	stderr?: (chunk: string) => void;
};

export type RunResult = {
	stdout: string;
	stderr: string;
	symbolicRef: (name: string) => string | undefined;
};

const run = async (commands: string[], options: RunOptions): Promise<RunResult> => {
	const [stdout, stderr] = await new Promise<[string, string]>((resolve, reject) => {
		const child = spawn(commands[0], commands.slice(1), {
			stdio: ["pipe", "pipe", "pipe"],
			env: options.env ?? process.env,
		});
		const output = ["", ""] as [string, string];

		child.stdout.setEncoding("utf8");
		child.stderr.setEncoding("utf8");
		if (options.input) {
			child.stdin.write(options.input);
		}

		child.stdout.on("data", (chunk) => {
			options.stdout?.(chunk);
			output[0] += chunk;
		});
		child.stderr.on("data", (chunk) => {
			options.stderr?.(chunk);
			output[1] += chunk;
		});

		child.once("error", reject);
		child.once("close", (code, signal) => {
			if (code === 0) {
				resolve(output);
				return;
			}

			reject(new Error(`${commands.join(" ")} failed: ${signal ?? code}\n${output[1]}`.trim()));
		});
	});

	const symbolicRef = (name: string) => {
		for (const line of stdout.split("\n")) {
			const [ref, target] = line.split("\t", 2);
			if (target === name && ref.startsWith("ref: ")) {
				return ref.slice("ref: ".length);
			}
		}
	};
	return { stdout, stderr, symbolicRef };
};

export const createGhSpawn = async (gh: string, options: RunOptions) => {
	return {
		setup: async () => {
			await run([gh, "auth", "setup-git"], options);
		},
		api: async (path: string, jq: string) => {
			const { stdout } = await run([gh, "api", "--paginate", path, "--jq", jq], options);
			return stdout.trim().split("\n").filter(Boolean);
		},
	};
};

export const createGitSpawn = async (git: string, options: RunOptions) => {
	return {
		repository: (path: string) => {
			return {
				has: async () => {
					return fs.existsSync(path);
				},
				remove: async () => {
					await fs.promises.rm(path, { recursive: true, force: true });
				},
				clone: async (url: string) => {
					const result = await run([git, "clone", "--mirror", url, path], options);
					await run([git, "-C", path, "lfs", "fetch", "--all", "origin"], options);
					return result;
				},
				fetch: async () => {
					await run(
						[git, "-c", "gc.auto=0", "-C", path, "fetch", "origin", "--atomic", "--prune", "--show-forced-updates", "+refs/*:refs/*"],
						options,
					);
					await run([git, "-C", path, "lfs", "fetch", "--all", "origin"], options);
					const output = await run([git, "-C", path, "ls-remote", "--symref", "origin", "HEAD"], options);
					const head = output.symbolicRef("HEAD");
					if (head) {
						await run([git, "-C", path, "symbolic-ref", "HEAD", head], options);
					}
				},
			};
		},
	};
};
