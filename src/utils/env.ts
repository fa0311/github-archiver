import "dotenv/config";
import { z } from "zod";

const envSchema = z
	.object({
		LOG_LEVEL: z
			.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
			.default("info"),
		LOG_COLOR: z
			.string()
			.transform((val) => val.toLowerCase() === "true")
			.default(false),
		GH_TOKEN: z.string(),
		GH_PATH: z.string().default("gh"),
		GIT_PATH: z.string().default("git"),
		HEARTBEAT_PATH: z.string().optional(),
		COMPLETION_STATUS_PATH: z.string().optional(),
		TZ: z.string().default("UTC"),
	})
	.catchall(z.string());

export const parseEnv = async () => {
	const parsed = await envSchema.parseAsync(process.env);
	return parsed;
};
