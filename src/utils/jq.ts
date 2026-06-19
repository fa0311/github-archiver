import { type RunOptions, run } from "./spawn.ts";

export const createJq = (jq: string, options: RunOptions) => {
	return {
		filter: async (input: string, filter: string): Promise<string[]> => {
			const { stdout } = await run([jq, "-c", filter], { ...options, input });
			const lines = stdout.split("\n");
			lines.pop();
			return lines;
		},
	};
};

export type Jq = ReturnType<typeof createJq>;
