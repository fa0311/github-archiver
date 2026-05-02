import { afterEach, describe, expect, it, vi } from "vitest";
import { sleep } from "../../../src/utils/sleep.ts";

describe("sleep", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("resolves after the requested delay", async () => {
		vi.useFakeTimers();
		const promise = sleep(100);

		await vi.advanceTimersByTimeAsync(100);

		await expect(promise).resolves.toBeUndefined();
	});

	it("rejects when aborted while waiting", async () => {
		vi.useFakeTimers();
		const controller = new AbortController();
		const promise = sleep(100, controller.signal);
		const assertion = expect(promise).rejects.toThrow(DOMException);

		controller.abort();
		await vi.advanceTimersByTimeAsync(0);

		await assertion;
	});
});
