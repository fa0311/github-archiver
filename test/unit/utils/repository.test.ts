import { describe, expect, it } from "vitest";
import { repositoryName } from "../../../src/utils/repository.js";

describe("repositoryName", () => {
	it.each([
		["https://github.com/octocat/Hello-World.git", "octocat/Hello-World"],
		["https://github.com/mrdoob/three.js", "mrdoob/three.js"],
		["https://gitlab.com/group/subgroup/project", "group/subgroup/project"],
	])("derives owner/repo from %s", (url, expected) => {
		expect(repositoryName(new URL(url))).toBe(expected);
	});
});
