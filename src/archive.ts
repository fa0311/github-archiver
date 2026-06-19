import { exponentialBackoffFactory, runBackoff } from "./utils/backoff.ts";
import { result } from "./utils/result.ts";

type SafeCommand = <T>(callback: () => Promise<T>) => Promise<T>;

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

export type RepositoryLocator = {
	path: string;
	name: string;
	url: URL;
	description?: string;
	gitArgs: string[];
};
