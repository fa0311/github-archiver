import fs from "node:fs";
import { parse } from "jsonc-parser";
import z from "zod";

const querySchema = z.discriminatedUnion("type", [
	z.strictObject({
		type: z.literal("url"),
		url: z.string(),
	}),
	z.strictObject({
		type: z.literal("api"),
		path: z.string(),
		jq: z.string(),
	}),
]);

const configSchema = z.strictObject({
	cron: z.string(),
	runOnInit: z.boolean().default(false),
	queries: z.array(querySchema).min(1),
	output: z.string().default("archives/{owner}/{repo}"),
});

export type Query = z.infer<typeof querySchema>;
export type Config = z.infer<typeof configSchema>;

export const parseConfig = async (path: string) => {
	const configJson = await fs.promises.readFile(path, "utf-8");
	const parsed = await configSchema.parseAsync(parse(configJson));
	return parsed;
};
