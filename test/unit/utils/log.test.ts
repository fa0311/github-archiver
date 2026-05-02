import { afterEach, describe, expect, it, vi } from "vitest";
import { fitSymbol, fitText, formatDuration } from "../../../src/utils/log.ts";

afterEach(() => {
	vi.restoreAllMocks();
});

describe("fitText", () => {
	it("pads short text", () => {
		const result = fitText("abc", 10);
		expect(result).toBe("abc       ");
		expect(result.length).toBe(10);
	});

	it("truncates long text to the requested width", () => {
		const result = fitText("this is a very long text", 10);
		expect(result.length).toBe(10);
	});
});

describe("fitSymbol", () => {
	it("pads single-width symbols to two cells", () => {
		expect(fitSymbol("x")).toBe("x ");
	});
});

describe("formatDuration", () => {
	it("measures the callback duration", async () => {
		const callback = vi.fn().mockResolvedValue(undefined);
		vi.spyOn(performance, "now").mockReturnValueOnce(100).mockReturnValueOnce(1600);

		await expect(formatDuration(callback)).resolves.toBe("1.5s");
		expect(callback).toHaveBeenCalledOnce();
	});
});
