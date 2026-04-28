import { describe, expect, it } from "vitest";
import { parseGitHubRepositoryUrl } from "../../../src/utils/git.js";

describe("parseGitHubRepositoryUrl", () => {
	it("parses a repository URL", () => {
		expect(parseGitHubRepositoryUrl("https://github.com/octocat/Hello-World")).toEqual({
			owner: "octocat",
			repo: "Hello-World",
			url: "https://github.com/octocat/Hello-World",
		});
	});

	it("parses a repository URL with .git suffix", () => {
		expect(parseGitHubRepositoryUrl("https://github.com/octocat/Hello-World.git")).toEqual({
			owner: "octocat",
			repo: "Hello-World",
			url: "https://github.com/octocat/Hello-World.git",
		});
	});

	describe("invalid URLs", () => {
		const expectInvalid = (url: string) => {
			expect(() => parseGitHubRepositoryUrl(url)).toThrow("Invalid GitHub repository URL");
		};

		it("rejects a non-HTTPS GitHub URL", () => {
			expectInvalid("http://github.com/octocat/Hello-World");
		});

		it("rejects a non-GitHub host", () => {
			expectInvalid("https://example.com/octocat/Hello-World");
		});

		it("rejects a URL missing the repository name", () => {
			expectInvalid("https://github.com/octocat");
		});

		it("rejects a repository subpath", () => {
			expectInvalid("https://github.com/octocat/Hello-World/issues");
		});

		it("rejects an owner/repo shorthand", () => {
			expectInvalid("octocat/Hello-World");
		});
	});
});
