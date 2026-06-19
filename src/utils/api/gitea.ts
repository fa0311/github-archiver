import z from "zod";
import { repositoryName } from "../repository.ts";
import { type ApiClient, describeRepository, gitAuthArgs, pagenation } from "./client.ts";

const repositorySchema = z.object({
	clone_url: z.httpUrl().transform((value) => new URL(value)),
	description: z.string().nullable().optional(),
});

export const createGiteaApi = (token?: string): ApiClient => {
	const headers = new Headers({ Accept: "application/json" });
	if (token) {
		headers.set("Authorization", `token ${token}`);
	}
	return {
		query: (url) => pagenation(url, headers),
		parse: (value) => {
			const parsed = repositorySchema.parse(JSON.parse(value));
			return { url: parsed.clone_url, description: parsed.description ?? undefined };
		},
		describe: (url) => {
			const endpoint = new URL(`/api/v1/repos/${repositoryName(url)}`, new URL(url).origin);
			return describeRepository(endpoint, headers);
		},
		gitArgs: token ? gitAuthArgs("oauth2", token) : [],
	};
};
