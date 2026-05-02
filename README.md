# GitHub Archiver

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful CLI tool for archiving GitHub repositories as local mirror clones. Features scheduled execution, GitHub API queries, checkpoint support, and flexible existing-archive handling.

## ✨ Features

- **Command Line Archiving**: Archive one or more GitHub repositories by URL
- **Scheduler**: Automate periodic archive tasks with cron expressions
- **GitHub API Queries**: Archive starred repositories, user repositories, organization repositories, and more
- **Checkpoint System**: Skip repositories already completed in long archive runs
- **Mirror Sync**: Preserve branches, tags, deleted refs, force-pushed refs, and default branch changes
- **Existing Archive Control**: Fetch, skip, overwrite, or error when output already exists
- **Flexible Output**: Use `{owner}` and `{repo}` placeholders
- **Docker Support**: Run as a one-off CLI or long-running scheduler

## 📚 Quick Start

```bash
# Archive a repository
github-archiver archive https://github.com/fa0311/github-archiver

# Run scheduled archiving
github-archiver schedule schedule.json
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

1. Create `schedule.json` (see configuration example below)

2. Start with docker-compose

```bash
docker-compose up -d
```

## ⚙️ Configuration

### Schedule Configuration File (`schedule.json`)

```jsonc
{
  "cron": "0 0 * * *", // Cron expression (required)
  "runOnInit": false, // Execute immediately on startup
  "queries": [
    {
      "type": "url",
      "url": "https://github.com/fa0311/github-archiver"
    },
    {
      "type": "api",
      "path": "/user/starred",
      "jq": ".[].clone_url"
    },
    {
      "type": "api",
      "path": "/user/repos",
      "jq": ".[].clone_url"
    }
  ],
  "output": "archives/{owner}/{repo}", // Output path (placeholders available)
  "ifExists": "fetch", // Existing archive behavior: fetch/skip/overwrite/error
  "checkpoint": "data/.checkpoint" // Optional checkpoint file path
}
```

For detailed configuration schema, see [src/utils/config.ts](src/utils/config.ts).

### Environment Variables

Can be set via `.env` file or system environment variables.

#### GitHub Settings (All commands)

```bash
# Required for GitHub CLI API queries and private repositories
GH_TOKEN=github_pat_xxx

# Optional command paths
GH_PATH=gh
GIT_PATH=git
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

Create a read-only GitHub token here:

<https://github.com/settings/personal-access-tokens/new?name=github-archiver&description=Read-only+token+for+self-hosted+github-archiver&expires_in=none&contents=read&metadata=read&starring=read>

## 🎨 Placeholders

Available placeholders for `output`:

- `{owner}` - Repository owner or organization
- `{repo}` - Repository name

**Examples:**

```bash
# Default output
github-archiver archive https://github.com/octocat/Hello-World

# Custom output
github-archiver archive https://github.com/octocat/Hello-World --output "backups/{owner}/{repo}.git"

# Skip repositories already listed in a checkpoint file
github-archiver archive https://github.com/octocat/Hello-World --checkpoint "data/.checkpoint"

# Re-clone an existing archive
github-archiver archive https://github.com/octocat/Hello-World --ifExists=overwrite
```

## 🛠️ Development

### Requirements

- Node.js 22+
- pnpm
- Git
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
