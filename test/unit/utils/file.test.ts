import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { outputFile } from "../../../src/utils/file.ts";

describe("outputFile", () => {
	let tempDir: string;

	beforeEach(async () => {
		tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "github-archiver-file-"));
	});

	afterEach(async () => {
		await fs.promises.rm(tempDir, { recursive: true, force: true });
	});

	it("writes lines and closes the stream", async () => {
		const file = path.join(tempDir, "data", "checkpoint");

		await outputFile(async (handler) => {
			const descriptor = await handler.create(file, "a");
			await descriptor.line("octocat/Hello-World");
			await descriptor.write("github/docs\n");
		});

		await expect(fs.promises.readFile(file, "utf8")).resolves.toBe("octocat/Hello-World\ngithub/docs\n");
	});
});
