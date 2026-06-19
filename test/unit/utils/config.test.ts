import fs from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parseConfig } from "../../../src/utils/config.ts";

afterEach(() => {
	vi.restoreAllMocks();
});

const mockConfigFile = (contents: string) => vi.spyOn(fs.promises, "readFile").mockResolvedValue(contents);

describe("parseConfig", () => {
	it("parses JSONC, applies defaults, and normalizes url queries", async () => {
		mockConfigFile(`{
			// scheduler config
			"cron": "0 0 * * *",
			"queries": [{ "type": "url", "url": "https://github.com/octocat/Hello-World" }]
		}`);

		await expect(parseConfig("schedule.jsonc")).resolves.toEqual({
			cron: "0 0 * * *",
			runOnInit: false,
			queries: [{ type: "url", provider: "github", url: new URL("https://github.com/octocat/Hello-World") }],
			output: "archives/{name}",
		});
	});

	it("rejects unknown (removed) options", async () => {
		mockConfigFile(
			JSON.stringify({
				cron: "0 0 * * *",
				queries: [{ type: "url", url: "https://github.com/octocat/Hello-World" }],
				checkpoint: "data/.checkpoint",
			}),
		);

		await expect(parseConfig("schedule.jsonc")).rejects.toThrowError(/Failed to parse config file/);
	});
});
