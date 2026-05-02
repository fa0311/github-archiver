import { describe, expect, it } from "vitest";
import { placeholder } from "../../../src/utils/placeholder.ts";

describe("placeholder", () => {
	it("replaces all occurrences of each placeholder", () => {
		expect(placeholder("{owner}/{repo}/{repo}", { owner: "octocat", repo: "Hello-World" })).toBe("octocat/Hello-World/Hello-World");
	});
});
