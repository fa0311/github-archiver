import z from "zod";
import { repositoryName } from "../repository.ts";
import { type ApiClient, describeRepository, gitAuthArgs, pagenation } from "./client.ts";

const repositorySchema = z.object({
	clone_url: z.httpUrl().transform((value) => new URL(value)),
	description: z.string().nullable().optional(),
});

export const createGitHubApi = (token?: string): ApiClient => {
	const headers = new Headers({
		Accept: "application/vnd.github+json",
		"X-GitHub-Api-Version": "2022-11-28",
	});
	if (token) {
		headers.set("Authorization", `Bearer ${token}`);
	}
	return {
		query: (url) => pagenation(url, headers),
		parse: (value) => {
			const parsed = repositorySchema.parse(JSON.parse(value));
			return { url: parsed.clone_url, description: parsed.description ?? undefined };
		},
		describe: (url) => {
			const endpoint = new URL(`/repos/${repositoryName(url)}`, "https://api.github.com");
			return describeRepository(endpoint, headers);
		},
		gitArgs: token ? gitAuthArgs("x-access-token", token) : [],
	};
};
