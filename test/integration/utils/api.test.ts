import { afterEach, describe, expect, it, vi } from "vitest";
import { createGiteaApi } from "../../../src/utils/api/gitea.js";
import { createGitHubApi } from "../../../src/utils/api/github.js";
import { createGitLabApi } from "../../../src/utils/api/gitlab.js";

const mockFetch = (handler: (url: string, init?: RequestInit) => Response) =>
	vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => handler(String(input), init ?? undefined));

afterEach(() => {
	vi.restoreAllMocks();
});

describe("ApiClient.parse", () => {
	it("normalizes a GitHub item", () => {
		const { url, description } = createGitHubApi("t").parse(JSON.stringify({ clone_url: "https://github.com/o/r.git", description: "d" }));
		expect(url.href).toBe("https://github.com/o/r.git");
		expect(description).toBe("d");
	});

	it("normalizes a GitLab item (http_url_to_repo)", () => {
		const { url, description } = createGitLabApi("t").parse(JSON.stringify({ http_url_to_repo: "https://gitlab.com/g/p.git", description: "d" }));
		expect(url.href).toBe("https://gitlab.com/g/p.git");
		expect(description).toBe("d");
	});

	it("normalizes a Gitea item", () => {
		const { url, description } = createGiteaApi("t").parse(JSON.stringify({ clone_url: "https://gitea.example.com/o/p.git", description: "d" }));
		expect(url.href).toBe("https://gitea.example.com/o/p.git");
		expect(description).toBe("d");
	});

	it("maps a null description to undefined", () => {
		const { description } = createGitHubApi("t").parse(JSON.stringify({ clone_url: "https://github.com/o/r.git", description: null }));
		expect(description).toBeUndefined();
	});
});

describe("ApiClient.describe", () => {
	const expectMetadataRequest = (apiUrl: string, header: string, value: string) =>
		mockFetch((url, init) => {
			expect(url).toBe(apiUrl);
			expect(new Headers(init?.headers).get(header)).toBe(value);
			return new Response(JSON.stringify({ description: "Fixture" }));
		});

	it("builds the GitHub metadata request", async () => {
		expectMetadataRequest("https://api.github.com/repos/octocat/Hello-World", "Authorization", "Bearer t");
		await expect(createGitHubApi("t").describe(new URL("https://github.com/octocat/Hello-World.git"))).resolves.toBe("Fixture");
	});

	it("builds the GitLab metadata request", async () => {
		expectMetadataRequest("https://gitlab.com/api/v4/projects/group%2Fsubgroup%2Fproject", "PRIVATE-TOKEN", "t");
		await expect(createGitLabApi("t").describe(new URL("https://gitlab.com/group/subgroup/project.git"))).resolves.toBe("Fixture");
	});

	it("builds the Gitea metadata request", async () => {
		expectMetadataRequest("https://gitea.example.com/api/v1/repos/org/project", "Authorization", "token t");
		await expect(createGiteaApi("t").describe(new URL("https://gitea.example.com/org/project.git"))).resolves.toBe("Fixture");
	});
});

describe("ApiClient.query", () => {
	it("follows Link pagination and returns each page body", async () => {
		mockFetch((url) =>
			url.endsWith("page=2") ? new Response("page2") : new Response("page1", { headers: { link: '<https://api.github.com/u?page=2>; rel="next"' } }),
		);

		await expect(createGitHubApi("t").query("https://api.github.com/u")).resolves.toEqual(["page1", "page2"]);
	});
});

describe("ApiClient.gitArgs", () => {
	it("emits Basic auth args, or none without a token", () => {
		const basic = Buffer.from("x-access-token:t").toString("base64");
		expect(createGitHubApi("t").gitArgs).toEqual(["-c", `http.extraHeader=Authorization: Basic ${basic}`]);
		expect(createGitHubApi(undefined).gitArgs).toEqual([]);
	});
});
