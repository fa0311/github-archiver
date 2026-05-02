import { describe, expect, it } from "vitest";
import { z } from "zod";
import { GitHubArchiverZodParseError, unreachable } from "../../../src/utils/error.ts";

describe("unreachable", () => {
	it("throws a GitHubArchiverError", () => {
		expect(() => unreachable()).toThrow("Unreachable code");
	});
});

describe("GitHubArchiverZodParseError", () => {
	it("includes the custom message and zod details", () => {
		const result = z.string().safeParse(123);
		expect(result.success).toBe(false);
		if (!result.success) {
			const error = new GitHubArchiverZodParseError("Validation failed", result.error);
			expect(error.message).toContain("Validation failed");
			expect(error.message).toContain("invalid_type");
		}
	});
});
