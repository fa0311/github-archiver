import fs from "node:fs";

export const pathExists = async (targetPath: string) => {
	try {
		await fs.promises.access(targetPath);
		return true;
	} catch {
		return false;
	}
};

export const loadCheckpoint = async (filePath: string | undefined): Promise<string[]> => {
	if (!filePath || !(await pathExists(filePath))) {
		return [];
	}
	const data = await fs.promises.readFile(filePath, "utf8");
	return data
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);
};
