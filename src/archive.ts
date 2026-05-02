import { exponentialBackoffFactory, runBackoff } from "./utils/backoff.ts";
import type { GitHubRepository } from "./utils/git.ts";
import { result } from "./utils/result.ts";

export type ArchiveTarget = GitHubRepository;

type SafeCommand = <T>(callback: () => Promise<T>) => Promise<T>;

export const repositoryKey = ({ owner, repo }: ArchiveTarget) => `${owner}/${repo}`;

export const createSafeCommand = (signal?: AbortSignal): SafeCommand => {
	const maxRetries = 3;
	const backoff = runBackoff({
		delayFactory: exponentialBackoffFactory({ baseDelayMs: 500 }),
		chain: [],
		maxRetries,
		signal,
	});

	return async <T>(callback: () => Promise<T>) => {
		return backoff(async () => {
			const response = await result(callback());
			if (response.ok) {
				return { type: "success", value: response.value };
			}
			return { type: "error", error: response.error };
		});
	};
};
