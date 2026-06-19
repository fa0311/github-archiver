import type { RepositoryProvider } from "../config.ts";
import type { ApiClient } from "./client.ts";
import { createGiteaApi } from "./gitea.ts";
import { createGitHubApi } from "./github.ts";
import { createGitLabApi } from "./gitlab.ts";

type ProviderTokens = {
	GH_TOKEN?: string;
	GITLAB_TOKEN?: string;
	GITEA_TOKEN?: string;
};

export const createApi = (provider: RepositoryProvider, tokens: ProviderTokens): ApiClient => {
	switch (provider) {
		case "github":
			return createGitHubApi(tokens.GH_TOKEN);
		case "gitlab":
			return createGitLabApi(tokens.GITLAB_TOKEN);
		case "gitea":
			return createGiteaApi(tokens.GITEA_TOKEN);
	}
};
