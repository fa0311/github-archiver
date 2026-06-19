import { spawn } from "node:child_process";

export type RunOptions = {
	env?: NodeJS.ProcessEnv;
	input?: string;
	stdout?: (chunk: string) => void;
	stderr?: (chunk: string) => void;
};

export type RunResult = {
	stdout: string;
	stderr: string;
	symbolicRef: (name: string) => string | undefined;
};

export const run = async (commands: string[], options: RunOptions): Promise<RunResult> => {
	const [stdout, stderr] = await new Promise<[string, string]>((resolve, reject) => {
		const child = spawn(commands[0], commands.slice(1), {
			stdio: ["pipe", "pipe", "pipe"],
			env: options.env ?? process.env,
		});
		const output = ["", ""] as [string, string];

		child.stdout.setEncoding("utf8");
		child.stderr.setEncoding("utf8");
		child.stdin.end(options.input);

		child.stdout.on("data", (chunk) => {
			options.stdout?.(chunk);
			output[0] += chunk;
		});
		child.stderr.on("data", (chunk) => {
			options.stderr?.(chunk);
			output[1] += chunk;
		});

		child.once("error", reject);
		child.once("close", (code, signal) => {
			if (code === 0) {
				resolve(output);
				return;
			}

			reject(new Error(`${commands.join(" ")} failed: ${signal ?? code}\n${output[1]}`));
		});
	});

	const symbolicRef = (name: string) => {
		for (const line of stdout.split("\n")) {
			const [ref, target] = line.split("\t", 2);
			if (target === name && ref.startsWith("ref: ")) {
				return ref.slice("ref: ".length);
			}
		}
	};
	return { stdout, stderr, symbolicRef };
};
