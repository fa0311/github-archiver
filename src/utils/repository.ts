import path from "node:path";

export const repositoryName = (url: URL): string =>
	path.posix.join(path.posix.dirname(url.pathname), path.posix.basename(url.pathname, ".git")).slice(1);
