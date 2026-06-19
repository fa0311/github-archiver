import "dotenv/config";
import { z } from "zod";
import { GitHubArchiverZodParseError } from "./error.ts";

const envSchema = z
	.object({
		LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
		LOG_COLOR: z
			.string()
			.transform((val) => val.toLowerCase() === "true")
			.default(false),
		GH_TOKEN: z.string().optional(),
		GIT_PATH: z.string().default("git"),
		JQ_PATH: z.string().default("jq"),
		GITLAB_TOKEN: z.string().optional(),
		GITEA_TOKEN: z.string().optional(),
		HEARTBEAT_PATH: z.string().optional(),
		COMPLETION_STATUS_PATH: z.string().optional(),
		TZ: z.string().default("UTC"),
	})
	.catchall(z.string());

export const parseEnv = async () => {
	const parsed = await envSchema.safeParseAsync(process.env);
	if (parsed.success) {
		return parsed.data;
	}
	throw new GitHubArchiverZodParseError("Failed to parse environment variables", parsed.error);
};
