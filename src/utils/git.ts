import fs from "node:fs";
import path from "node:path";
import { statIfExists } from "./fs.ts";
import { type RunOptions, run } from "./spawn.ts";

export const createGitSpawn = (git: string, options: RunOptions) => {
	return {
		repository: (repositoryPath: string, args: string[]) => {
			const removeStaleHeadLock = async () => {
				const lockPath = path.join(repositoryPath, "HEAD.lock");
				const stat = await statIfExists(lockPath);
				if (stat) {
					await fs.promises.rm(lockPath, { force: true });
				}
			};

			return {
				has: async () => {
					return (await statIfExists(repositoryPath)) !== undefined;
				},
				remove: async () => {
					await fs.promises.rm(repositoryPath, { recursive: true, force: true });
				},
				clone: async (url: string) => {
					const result = await run([git, ...args, "clone", "--mirror", url, repositoryPath], options);
					await run([git, ...args, "-C", repositoryPath, "lfs", "fetch", "--all", "origin"], options);
					return result;
				},
				fetch: async () => {
					await removeStaleHeadLock();
					await run(
						[
							git,
							...args,
							"-c",
							"gc.auto=0",
							"-C",
							repositoryPath,
							"fetch",
							"origin",
							"--atomic",
							"--prune",
							"--show-forced-updates",
							"+refs/*:refs/*",
						],
						options,
					);
					await removeStaleHeadLock();
					await run([git, ...args, "-C", repositoryPath, "lfs", "fetch", "--all", "origin"], options);
					const output = await run([git, ...args, "-C", repositoryPath, "ls-remote", "--symref", "origin", "HEAD"], options);
					const head = output.symbolicRef("HEAD");
					if (head) {
						await removeStaleHeadLock();
						await run([git, "-C", repositoryPath, "symbolic-ref", "HEAD", head], options);
					}
				},
				writeDescription: async (description: string) => {
					await fs.promises.writeFile(path.join(repositoryPath, "description"), description);
				},
				writeWebLastModified: async () => {
					const { stdout } = await run([git, "-C", repositoryPath, "log", "--all", "-1", "--format=%ct"], options);
					const lastModified = new Date(Number(stdout) * 1000).toUTCString();
					const webInfoPath = path.join(repositoryPath, "info", "web");
					await fs.promises.mkdir(webInfoPath, { recursive: true });
					await fs.promises.writeFile(path.join(webInfoPath, "last-modified"), `${lastModified}\n`);
				},
			};
		},
	};
};
