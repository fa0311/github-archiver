import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createGhSpawn } from "../../../src/utils/git.js";
import { createIntegration } from "../../utils/integration.js";

const target = {
	owner: "octocat",
	repo: "Hello-World",
	url: "https://github.com/octocat/Hello-World.git",
};

describe("createGhSpawn", () => {
	const integration = createIntegration();

	afterEach(integration.afterEachCall);

	const createGh = async (response: unknown) => {
		const temp = await integration.temp();
		const ghPath = path.join(temp, "gh");
		const script = [
			"#!/usr/bin/env node",
			'const expected = ["api", "/repos/octocat/Hello-World"];',
			"const args = process.argv.slice(2);",
			"if (JSON.stringify(args) !== JSON.stringify(expected)) {",
			"\tprocess.stderr.write('unexpected arguments: ' + JSON.stringify(args));",
			"\tprocess.exit(1);",
			"}",
			`process.stdout.write(${JSON.stringify(JSON.stringify(response))});`,
			"",
		].join("\n");
		await fs.promises.writeFile(ghPath, script, { mode: 0o755 });
		return createGhSpawn(ghPath, {});
	};

	it("loads repository description", async () => {
		const gh = await createGh({ description: "Fixture description" });

		await expect(gh.repository(target)).resolves.toEqual({ ...target, description: "Fixture description" });
	});

	it("uses an empty string for a null repository description", async () => {
		const gh = await createGh({ description: null });

		await expect(gh.repository(target)).resolves.toEqual({ ...target, description: "" });
	});
});
