import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseConfig } from "../../../src/utils/config.ts";

describe("parseConfig", () => {
	let tempDir: string;

	beforeEach(async () => {
		tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "github-archiver-config-"));
	});

	afterEach(async () => {
		await fs.promises.rm(tempDir, { recursive: true, force: true });
	});

	it("parses JSONC schedule config and applies defaults", async () => {
		const file = path.join(tempDir, "schedule.jsonc");
		await fs.promises.writeFile(
			file,
			`{
				// scheduler config
				"cron": "0 0 * * *",
				"queries": [
					{ "type": "url", "url": "https://github.com/octocat/Hello-World" }
				]
			}
			`,
			"utf8",
		);

		await expect(parseConfig(file)).resolves.toEqual({
			cron: "0 0 * * *",
			runOnInit: false,
			queries: [{ type: "url", url: "https://github.com/octocat/Hello-World" }],
			output: "archives/{owner}/{repo}",
		});
	});

	it("rejects removed schedule options", async () => {
		const file = path.join(tempDir, "schedule.jsonc");
		await fs.promises.writeFile(
			file,
			JSON.stringify({
				cron: "0 0 * * *",
				queries: [{ type: "url", url: "https://github.com/octocat/Hello-World" }],
				checkpoint: "data/.checkpoint",
			}),
			"utf8",
		);

		await expect(parseConfig(file)).rejects.toThrowError(/Failed to parse config file/);
	});
});
