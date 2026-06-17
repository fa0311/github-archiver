import fs from "node:fs";
import path from "node:path";

const outputTimestamp = (filename: string, errorHandler: (error: unknown) => void) => {
	(async () => {
		await fs.promises.mkdir(path.dirname(filename), { recursive: true });
		await fs.promises.writeFile(filename, `${Math.floor(Date.now() / 1000)}\n`, "utf8");
	})().catch(errorHandler);
};

const outputResult = (filename: string, result: boolean, errorHandler: (error: unknown) => void) => {
	(async () => {
		await fs.promises.mkdir(path.dirname(filename), { recursive: true });
		await fs.promises.writeFile(filename, `${result}\n`, "utf8");
	})().catch(errorHandler);
};

export const createHeartbeat = (pathname: string, errorHandler: (error: unknown) => void) => {
	outputTimestamp(pathname, errorHandler);
	setInterval(() => void outputTimestamp(pathname, errorHandler), 60000);
};

export const createCompletion = (pathname: string, errorHandler: (error: unknown) => void) => {
	let count = 0;

	return {
		error: () => {
			count++;
			outputResult(pathname, false, errorHandler);
		},
		finish: () => {
			outputResult(pathname, count === 0, errorHandler);
			count = 0;
		},
	};
};
