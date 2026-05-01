import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { createGitSpawn } from "../../../src/utils/git.js";
import { createIntegration } from "../../utils/integration.js";

const createGit = async (cwd: string, archivePath: string) => {
	const testGitConfigPath = fileURLToPath(new URL("../../fixtures/gitconfig", import.meta.url));
	const env = {
		GIT_CONFIG_GLOBAL: testGitConfigPath,
		GIT_CONFIG_NOSYSTEM: "1",
	};

	const run = async (...args: string[]) => {
		const { stdout } = await promisify(execFile)("git", args, { cwd, env });
		return stdout.trim();
	};

	const commit = async (file: string, content: string) => {
		await fs.promises.writeFile(path.join(cwd, file), content);
		await run("add", file);
		await run("commit", "--allow-empty-message", "-m", "");
		return run("rev-parse", "HEAD");
	};

	const ref = (ref: string) => {
		return run("--git-dir", archivePath, "rev-parse", ref);
	};

	const symbolicRef = (ref: string) => {
		return run("--git-dir", archivePath, "symbolic-ref", ref);
	};

	const hasRef = async (ref: string) => {
		try {
			await run("--git-dir", archivePath, "show-ref", "--verify", "--quiet", ref);
			return true;
		} catch {
			return false;
		}
	};

	await run("init", "--initial-branch=main");

	return { cwd, env, run, commit, ref, symbolicRef, hasRef };
};

describe("createGitSpawn", () => {
	const integration = createIntegration();

	afterEach(integration.afterEachCall);

	const createArchive = async () => {
		const temp = await integration.temp();
		const sourcePath = path.join(temp, "source");
		const archivePath = path.join(temp, "archive.git");
		await fs.promises.mkdir(sourcePath, { recursive: true });

		const git = await createGit(sourcePath, archivePath);
		const archive = await createGitSpawn("git", { env: git.env });
		const base = await git.commit("README.md", "# fixture\n");
		const repository = archive.repository(archivePath);

		const clone = async () => {
			expect(await repository.has()).toBe(false);
			await repository.clone(sourcePath);
			expect(await repository.has()).toBe(true);
		};

		return { archive, repository, base, git, clone };
	};

	it("clones a mirror with local branches and tags", async () => {
		const { base, git, clone } = await createArchive();

		await git.run("checkout", "-b", "feature", base);
		const feature = await git.commit("feature.txt", "feature\n");
		await git.run("tag", "v1", base);

		await clone();

		await expect(git.ref("refs/heads/main")).resolves.toBe(base);
		await expect(git.ref("refs/heads/feature")).resolves.toBe(feature);
		await expect(git.ref("refs/tags/v1")).resolves.toBe(base);
	});

	it("fetches branches and tags created after the mirror clone", async () => {
		const { repository, base, git, clone } = await createArchive();

		await clone();

		await git.run("checkout", "-b", "new-branch", base);
		const newTip = await git.commit("new-branch.txt", "new branch\n");
		await git.run("tag", "new-tag", newTip);
		await git.run("checkout", "main");
		await repository.fetch();

		await expect(git.ref("refs/heads/new-branch")).resolves.toBe(newTip);
		await expect(git.ref("refs/tags/new-tag")).resolves.toBe(newTip);
	});

	it("mirrors a default branch change", async () => {
		const { repository, base, git, clone } = await createArchive();

		await clone();
		await expect(git.symbolicRef("HEAD")).resolves.toBe("refs/heads/main");

		await git.run("checkout", "-b", "new-default", base);
		const newDefaultTip = await git.commit("default.txt", "new default\n");
		await repository.fetch();

		await expect(git.symbolicRef("HEAD")).resolves.toBe("refs/heads/new-default");
		await expect(git.ref("HEAD")).resolves.toBe(newDefaultTip);
	});

	it("prunes deleted branches", async () => {
		const { repository, base, git, clone } = await createArchive();

		await git.run("checkout", "-b", "deleted-branch", base);
		await git.commit("deleted.txt", "delete me\n");
		await git.run("checkout", "main");
		await clone();
		await expect(git.hasRef("refs/heads/deleted-branch")).resolves.toBe(true);

		await git.run("branch", "-D", "deleted-branch");
		await repository.fetch();

		await expect(git.hasRef("refs/heads/deleted-branch")).resolves.toBe(false);
	});

	it("prunes deleted tags", async () => {
		const { repository, base, git, clone } = await createArchive();

		await git.run("tag", "deleted-tag", base);
		await clone();
		await expect(git.hasRef("refs/tags/deleted-tag")).resolves.toBe(true);

		await git.run("tag", "-d", "deleted-tag");
		await repository.fetch();

		await expect(git.hasRef("refs/tags/deleted-tag")).resolves.toBe(false);
	});

	it("mirrors a force-pushed branch", async () => {
		const { repository, base, git, clone } = await createArchive();

		await git.run("checkout", "-b", "force-updated-branch", base);
		await git.commit("force.txt", "old 1\n");
		const oldTip = await git.commit("force.txt", "old 2\n");
		await clone();
		await expect(git.ref("refs/heads/force-updated-branch")).resolves.toBe(oldTip);

		await git.run("reset", "--hard", base);
		const newTip = await git.commit("force.txt", "new\n");
		await git.run("checkout", "main");
		await repository.fetch();

		await expect(git.ref("refs/heads/force-updated-branch")).resolves.toBe(newTip);
		expect(newTip).not.toBe(oldTip);
	});

	it("mirrors a moved tag", async () => {
		const { repository, base, git, clone } = await createArchive();

		await git.run("tag", "moved-tag", base);
		await clone();
		await expect(git.ref("refs/tags/moved-tag")).resolves.toBe(base);

		const newTip = await git.commit("tag-target.txt", "new tag target\n");
		await git.run("tag", "-f", "moved-tag", newTip);
		await repository.fetch();

		await expect(git.ref("refs/tags/moved-tag")).resolves.toBe(newTip);
	});

	it("mirrors a branch deleted and recreated with the same name", async () => {
		const { repository, base, git, clone } = await createArchive();

		await git.run("checkout", "-b", "recreated-branch", base);
		const oldTip = await git.commit("recreated.txt", "old\n");
		await git.run("checkout", "main");
		await clone();
		await expect(git.ref("refs/heads/recreated-branch")).resolves.toBe(oldTip);

		await git.run("branch", "-D", "recreated-branch");
		await git.run("checkout", "-b", "recreated-branch", base);
		const newTip = await git.commit("recreated.txt", "new\n");
		await git.run("checkout", "main");
		await repository.fetch();

		await expect(git.ref("refs/heads/recreated-branch")).resolves.toBe(newTip);
		expect(newTip).not.toBe(oldTip);
	});
});
