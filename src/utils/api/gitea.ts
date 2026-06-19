import z from "zod";
import { repositoryName } from "../repository.ts";
import { type ApiClient, describeRepository, gitAuthArgs, pagination } from "./client.ts";

const repositorySchema = z.object({
	clone_url: z.httpUrl(),
	description: z.string().nullable().optional(),
});

export const createGiteaApi = (token?: string): ApiClient => {
	const headers = new Headers({ Accept: "application/json" });
	if (token) {
		headers.set("Authorization", `token ${token}`);
	}
	return {
		query: (url) => pagination(url, headers),
		parse: (value) => {
			const parsed = repositorySchema.parse(JSON.parse(value));
			return { url: new URL(parsed.clone_url), description: parsed.description ?? undefined };
		},
		describe: (url) => {
			const endpoint = new URL(`/api/v1/repos/${repositoryName(url)}`, new URL(url).origin);
			return describeRepository(endpoint, headers);
		},
		gitArgs: token ? gitAuthArgs("oauth2", token) : [],
	};
};
