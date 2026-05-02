import { describe, expect, it } from "vitest";
import { type ArchiveTarget, repositoryKey } from "../../src/archive.ts";

const target = (repo: string): ArchiveTarget => ({
	owner: "octocat",
	repo,
	url: `https://github.com/octocat/${repo}`,
});

describe("repositoryKey", () => {
	it("uses owner/repo", () => {
		expect(repositoryKey(target("Hello-World"))).toBe("octocat/Hello-World");
	});
});
