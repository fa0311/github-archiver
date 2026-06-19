import LinkHeader from "http-link-header";
import z from "zod";

export type RepositoryMetadata = { url: URL; description?: string };

export type ApiClient = {
	query: (url: string) => Promise<string[]>;
	parse: (value: string) => RepositoryMetadata;
	describe: (url: URL) => Promise<string | undefined>;
	gitArgs: string[];
};

export const gitAuthArgs = (user: string, token: string) => {
	const basic = Buffer.from(`${user}:${token}`).toString("base64");
	return ["-c", `http.extraHeader=Authorization: Basic ${basic}`];
};

const descriptionSchema = z.object({ description: z.string().nullable().optional() });

export const describeRepository = async (url: string | URL, headers: Headers): Promise<string | undefined> => {
	const response = await fetch(url, { headers });
	const body = await response.text();
	if (!response.ok) {
		throw new Error(`${url} failed: ${response.status} ${response.statusText}\n${body}`);
	}
	return descriptionSchema.parse(JSON.parse(body)).description ?? undefined;
};

export const pagenation = async (url: string, headers: Headers) => {
	const pages: string[] = [];
	let next: string | undefined = url;
	while (next) {
		const response = await fetch(next, { headers });
		const body = await response.text();
		if (!response.ok) {
			throw new Error(`${next} failed: ${response.status} ${response.statusText}\n${body}`);
		}
		pages.push(body);
		next = (() => {
			const link = response.headers.get("link");
			if (link) {
				const [next] = LinkHeader.parse(link).rel("next");
				return next?.uri;
			} else {
				return undefined;
			}
		})();
	}
	return pages;
};
