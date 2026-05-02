import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadCheckpoint, pathExists } from "../../../src/utils/checkpoint.ts";

describe("checkpoint", () => {
	let tempDir: string;

	beforeEach(async () => {
		tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "github-archiver-checkpoint-"));
	});

	afterEach(async () => {
		await fs.promises.rm(tempDir, { recursive: true, force: true });
	});

	it("loads owner/repo keys from a checkpoint file", async () => {
		const file = path.join(tempDir, ".checkpoint");
		await fs.promises.writeFile(file, "octocat/Hello-World\n\n github/docs \n", "utf8");

		await expect(loadCheckpoint(file)).resolves.toEqual(["octocat/Hello-World", "github/docs"]);
	});

	it("returns an empty list when no checkpoint is configured", async () => {
		await expect(loadCheckpoint(undefined)).resolves.toEqual([]);
	});

	it("returns an empty list when the checkpoint does not exist", async () => {
		await expect(loadCheckpoint(path.join(tempDir, "missing"))).resolves.toEqual([]);
	});

	it("checks path existence", async () => {
		const file = path.join(tempDir, "file");
		await fs.promises.writeFile(file, "x", "utf8");

		await expect(pathExists(file)).resolves.toBe(true);
		await expect(pathExists(path.join(tempDir, "missing"))).resolves.toBe(false);
	});
});
