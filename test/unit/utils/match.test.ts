import { describe, expect, it } from "vitest";
import { exhaustiveMatch, exhaustiveMatchAsync } from "../../../src/utils/match.ts";

describe("exhaustiveMatch", () => {
	it("runs the matching handler", () => {
		const match = exhaustiveMatch({
			a: () => "A",
			b: () => "B",
		});

		expect(match("b")).toBe("B");
	});
});

describe("exhaustiveMatchAsync", () => {
	it("runs the matching async handler", async () => {
		const match = exhaustiveMatchAsync({
			a: async () => "A",
			b: async () => "B",
		});

		await expect(match("a")).resolves.toBe("A");
	});
});
