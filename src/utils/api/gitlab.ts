import z from "zod";
import { repositoryName } from "../repository.ts";
import { type ApiClient, describeRepository, gitAuthArgs, pagenation } from "./client.ts";

const repositorySchema = z.object({
	http_url_to_repo: z.httpUrl().transform((value) => new URL(value)),
	description: z.string().nullable().optional(),
});

export const createGitLabApi = (token?: string): ApiClient => {
	const headers = new Headers({ Accept: "application/json" });
	if (token) {
		headers.set("PRIVATE-TOKEN", token);
	}
	return {
		query: (url) => pagenation(url, headers),
		parse: (value) => {
			const parsed = repositorySchema.parse(JSON.parse(value));
			return { url: parsed.http_url_to_repo, description: parsed.description ?? undefined };
		},
		describe: (url) => {
			const endpoint = new URL(`/api/v4/projects/${encodeURIComponent(repositoryName(url))}`, new URL(url).origin);
			return describeRepository(endpoint, headers);
		},
		gitArgs: token ? gitAuthArgs("oauth2", token) : [],
	};
};
