# Architecture Overview

This document describes the high-level architecture and design principles of this CLI archiver application.

## Core Design Principles

### 1. Separation of Concerns

The codebase is organized into distinct layers with clear responsibilities:

- **Command Layer**: CLI interface, scheduler loop, and user interaction
- **Archive Flow Layer**: Repository query expansion, deduplication, and archive execution
- **Command Adapter Layer**: Git and GitHub CLI process execution
- **Utility Layer**: Reusable helpers for retry, logging, placeholder expansion, and config parsing

### 2. Type Safety

- Runtime validation using Zod
- Strict TypeScript configuration for compile-time safety
- Project-specific error types for validation and repository failures

### 3. Resilience

- Exponential backoff for transient Git/GitHub CLI failures
- Internal concurrency limiting for repository work
- Health signal files for external monitoring

## System Architecture

```mermaid
graph TD
    CLI[CLI Commands<br/>User-facing interface with argument parsing]
    Scheduler[Scheduler<br/>Cron-based repeated execution]
    GitHub[GitHub Query Expansion<br/>URL and gh api queries]
    Archive[Archive Flow<br/>Deduplication, clone/fetch, progress/logging]
    Git[Git Mirror Operations<br/>clone --mirror and fetch]
    Health[Health Signals<br/>Heartbeat and completion status]

    CLI --> Archive
    Scheduler --> GitHub
    GitHub --> Archive
    Archive --> Git
    Scheduler --> Health
```

## Key Components

### Command Execution Flow

1. **Input Parsing**: CLI URLs or scheduled query definitions
2. **Query Expansion**: Direct URLs and GitHub API query results become repository targets
3. **Deduplication**: Repositories gathered from URLs and `gh api` responses are keyed by `owner/repo`
4. **Archive Coordination**: Repositories are processed with an internal concurrency limit
5. **Mirror Operation**: Clone missing archives and `fetch` existing mirror directories

## Data Flow

### One-time Execution Mode

```mermaid
graph LR
    Input[Repository URLs] --> Parse[Parse GitHub URLs]
    Parse --> Archive[Clone/Fetch]
    Archive --> Output[Mirror Archives]
```

### Scheduled Execution Mode

```mermaid
graph TB
    Config[Config File] --> Cron[Cron Trigger]
    Cron --> Expand[Query Expansion]
    Expand --> Archive[Clone/Fetch]
    Archive --> Health[Health Signals]
```

## Error Handling Strategy

- Validation errors are wrapped in `GitHubArchiverZodParseError`.
- CLI execution collects repository failures and reports them together.
- Scheduled execution logs per-repository failures and continues through the remaining repositories.

## Testing Strategy

### Unit Tests

- Pure utilities and small behavior helpers
- Retry/backoff behavior
- Config parsing and scheduler helpers
- URL parsing and placeholder replacement

### Integration Tests

- CLI command execution
- Scheduler `--runOnce` flow
- Existing archive behavior
- Local/fake Git execution without network dependency
