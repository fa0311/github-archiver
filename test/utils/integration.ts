import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export type Integration = {
	temp: () => Promise<string>;
	afterEachCall: () => Promise<void>;
};

export const createIntegration = (): Integration => {
	const cleanup: Array<() => Promise<void>> = [];
	return {
		temp: async () => {
			const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "github-archiver-test-"));
			cleanup.push(() => fs.promises.rm(tempDir, { recursive: true, force: true }));

			const temp = path.join(tempDir, "temp");
			await fs.promises.mkdir(temp, { recursive: true });
			return temp;
		},
		afterEachCall: async () => {
			await Promise.all(cleanup.map((fn) => fn()));
			cleanup.length = 0;
		},
	};
};
