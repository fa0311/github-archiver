import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHeartbeat } from "../../../src/utils/healthcheck.ts";

const readFileEventually = async (filename: string) => {
	for (let i = 0; i < 20; i++) {
		try {
			return await fs.promises.readFile(filename, "utf8");
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
				throw error;
			}
			await vi.advanceTimersByTimeAsync(1);
		}
	}

	throw new Error(`Timed out waiting for ${filename}`);
};

describe("createHeartbeat", () => {
	let tempDir: string;

	beforeEach(async () => {
		tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "github-archiver-heartbeat-"));
		vi.useFakeTimers();
	});

	afterEach(async () => {
		vi.clearAllTimers();
		vi.useRealTimers();
		await fs.promises.rm(tempDir, { recursive: true, force: true });
	});

	it("writes the current epoch immediately", async () => {
		const file = path.join(tempDir, "nested", "heartbeat.epoch");
		const errorHandler = vi.fn();
		vi.setSystemTime(new Date("2026-06-17T00:00:00.000Z"));

		createHeartbeat(file, errorHandler);

		await expect(readFileEventually(file)).resolves.toBe("1781654400\n");
		expect(errorHandler).not.toHaveBeenCalled();
	});

	it("updates the epoch every minute", async () => {
		const file = path.join(tempDir, "heartbeat.epoch");
		const errorHandler = vi.fn();
		vi.setSystemTime(new Date("2026-06-17T00:00:00.000Z"));

		createHeartbeat(file, errorHandler);
		await expect(readFileEventually(file)).resolves.toBe("1781654400\n");

		await vi.advanceTimersByTimeAsync(60000);

		await expect(readFileEventually(file)).resolves.toBe("1781654460\n");
		expect(errorHandler).not.toHaveBeenCalled();
	});
});
