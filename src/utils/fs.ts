import fs from "node:fs";
export const statIfExists = async (pathname: string) => {
	try {
		return await fs.promises.stat(pathname);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") {
			return;
		}
		throw error;
	}
};
