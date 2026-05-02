import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["test/integration/**/*.test.ts"],
		testTimeout: 60000,
		hookTimeout: 30000,
		retry: 2,
		pool: "forks",
		sequence: {
			concurrent: false,
		},
		disableConsoleIntercept: true,
	},
});
