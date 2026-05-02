import { describe, expect, it } from "vitest";
import { result } from "../../../src/utils/result.ts";

describe("result", () => {
	it("wraps a resolved promise", async () => {
		await expect(result(Promise.resolve("ok"))).resolves.toEqual({ ok: true, value: "ok" });
	});

	it("wraps a rejected promise", async () => {
		const error = new Error("boom");
		await expect(result(Promise.reject(error))).resolves.toEqual({ ok: false, error });
	});
});
