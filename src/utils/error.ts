import type { z } from "zod";

export class GitHubArchiverError extends Error {}

export class GitHubArchiverParseError extends GitHubArchiverError {}

export class GitHubArchiverZodParseError<T> extends GitHubArchiverParseError {
	constructor(message: string, error: z.ZodError<T>) {
		const text = error.issues.map((issue) => ` * [${issue.code}] ${issue.message} at ${issue.path.join(".")}`).join("\n");
		super(`${message}:\n${text}`);
	}
}

export class GitHubArchiverAlreadyExistsError extends GitHubArchiverError {}

export class GitHubArchiverRepositoryError extends GitHubArchiverError {
	constructor(repository: string, error: unknown) {
		super(`Failed to archive ${repository}`, { cause: error });
	}
}

export const unreachable = () => {
	throw new GitHubArchiverError("Unreachable code");
};
