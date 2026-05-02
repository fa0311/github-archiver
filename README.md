# GitHub Archiver

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful CLI tool for archiving GitHub repositories as local mirror clones. Features scheduled execution, GitHub CLI integration, mirror sync, and health signal output for an efficient and robust archive experience.

## ✨ Features

- **Command Line Tool**: Archive repositories instantly by HTTPS clone URL
- **Scheduler**: Automate periodic archive tasks with cron expressions
- **GitHub CLI Integration**: Archive repository lists returned by `gh api`
- **Mirror Sync**: Preserve branches, tags, deleted refs, force-pushed refs, and default branch changes
- **Git LFS Support**: Mirror archives also fetch Git LFS objects
- **Incremental Scheduler**: Scheduled runs clone missing repositories and `fetch` existing mirrors
- **Docker Support**: Easy deployment with docker-compose
- **Flexible Output**: Use `{owner}` and `{repo}` placeholders

## 📚 Quick Start

```bash
# Set a GitHub token
export GH_TOKEN=github_pat_xxx

# Archive a repository
github-archiver archive https://github.com/fa0311/github-archiver

# Archive repositories returned by GitHub CLI
github-archiver archive $(gh api --paginate '/user/repos?per_page=100' --jq '.[].clone_url')

# Run scheduled archiving
github-archiver schedule schedule.jsonc
```

For detailed command options, see [COMMANDS.md](COMMANDS.md).

### Build from Source

```bash
git clone https://github.com/fa0311/github-archiver.git
cd github-archiver
pnpm install
pnpm build
```

## 🐳 Docker Usage

### CLI Usage

```bash
docker pull ghcr.io/fa0311/github-archiver:latest-cli
docker run --rm -e GH_TOKEN=github_pat_xxx -v ${PWD}/archives:/app/archives ghcr.io/fa0311/github-archiver:latest-cli archive https://github.com/fa0311/github-archiver
```

### Scheduler Usage

Use docker-compose for scheduled archiving:

1. Create `schedule.jsonc` (see configuration example below)

2. Start with docker-compose

```bash
docker-compose up -d
```

## ⚙️ Configuration

### Schedule Configuration File

The scheduler config is parsed as JSONC, so comments are allowed. The CLI default path is `schedule.json`, but you can also keep the file as `schedule.jsonc` and pass it explicitly.

```jsonc
{
  "cron": "0 0 * * *", // Cron expression (required)
  "runOnInit": false, // Execute immediately on startup
  "queries": [
    // Archive targets
    { "type": "url", "url": "https://github.com/fa0311/github-archiver" },
    {
      "type": "api",
      "path": "/user/repos?per_page=100",
      "jq": ".[].clone_url",
    },
    {
      "type": "api",
      "path": "/user/starred?per_page=100",
      "jq": ".[].clone_url",
    },
  ],
  "output": "archives/{owner}/{repo}" // Output path (placeholders available)
}
```

For detailed configuration schema, see [src/utils/config.ts](src/utils/config.ts).

### Environment Variables

Can be set via `.env` file or system environment variables.

#### GitHub Settings (All commands)

```bash
# Required by the CLI and used by gh api/scheduled queries
GH_TOKEN=github_pat_xxx

# Optional command paths
GH_PATH=gh
GIT_PATH=git
```

### GitHub Token

Create a read-only fine-grained personal access token here:

<https://github.com/settings/personal-access-tokens/new?name=github-archiver&description=Read-only+token+for+self-hosted+github-archiver&expires_in=none&contents=read&metadata=read&starring=read>

Recommended permissions:

- Repository permissions: `Contents: Read`, `Metadata: Read`
- Account permissions: `Starring: Read` when using `/user/starred`

After generating the token, set it in your shell or `.env` file:

```bash
export GH_TOKEN=github_pat_xxx
```

If you already authenticated with GitHub CLI, you can reuse that token:

```bash
export GH_TOKEN="$(gh auth token)"
```

For private repositories over HTTPS, run GitHub CLI's Git setup once so `git clone --mirror` and `git fetch` can use the same credentials:

```bash
gh auth setup-git
```

#### Schedule Command Only

```bash
# Log level (fatal/error/warn/info/debug/trace/silent)
LOG_LEVEL=info

# Enable colored logs (true/false)
LOG_COLOR=true

# Timezone (for cron schedule)
TZ=UTC

# Heartbeat timestamp file (updated every 60 seconds)
HEARTBEAT_PATH=/tmp/heartbeat.epoch

# Completion status file (updated after each scheduled archive run)
COMPLETION_STATUS_PATH=/tmp/completion_status
```

### GitHub CLI Integration

`archive` accepts multiple repository URLs, so it can consume clone URLs returned by `gh api`:

```bash
# Archive all repositories visible to the authenticated account
github-archiver archive $(gh api --paginate '/user/repos?per_page=100' --jq '.[].clone_url')

# Archive starred repositories
github-archiver archive $(gh api --paginate '/user/starred?per_page=100' --jq '.[].clone_url')

# Archive repositories in an organization
github-archiver archive $(gh api --paginate '/orgs/ORG/repos?per_page=100' --jq '.[].clone_url')
```

The scheduler uses the same `gh api --paginate <path> --jq <jq>` flow through `queries[].type = "api"`. During scheduled runs, existing archive directories are updated with `git fetch`, and missing ones are cloned.
Git LFS repositories are synced with `git lfs fetch --all origin` after each clone and fetch, so the archive includes LFS objects as well.

## 🎨 Placeholders

Available placeholders for output paths:

### Output Path

- `{owner}` - Repository owner or organization
- `{repo}` - Repository name

**Examples:**

```bash
# Default output
github-archiver archive https://github.com/octocat/Hello-World

# Custom output
github-archiver archive https://github.com/octocat/Hello-World --output "backups/{owner}/{repo}.git"

# Archive multiple repositories from GitHub CLI
github-archiver archive $(gh api --paginate '/user/repos?per_page=100' --jq '.[].clone_url')
```

## 🛠️ Development

### Requirements

- Node.js (v24+ recommended, v22+ supported)
- pnpm
- Git
- Git LFS
- GitHub CLI (`gh`)

### Build

```bash
pnpm install
pnpm build
```

### Test

```bash
pnpm test        # watch mode
pnpm test:run    # single run
pnpm test:unit
pnpm test:integration
```

### Development Mode

```bash
pnpm dev <command>
```

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 📖 Documentation

- [COMMANDS.md](COMMANDS.md) - Detailed command reference
- [src/utils/config.ts](src/utils/config.ts) - Configuration file type definitions
- [src/utils/env.ts](src/utils/env.ts) - Environment variable type definitions
