# Contributing Guide

Thank you for your interest in contributing to this project! This document outlines the principles and processes for contributing.

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm
- Git
- GitHub CLI (`gh`)

### Development Setup

1. Clone the repository
2. Install dependencies with pnpm
3. Build the project to verify setup
4. Run tests to ensure everything works

```bash
pnpm install
pnpm build
pnpm test:run
```

## Contribution Workflow

### 1. Before You Start

- Check existing issues and pull requests to avoid duplication
- For major changes, discuss the approach first
- Ensure your contribution aligns with the archive and scheduler goals

### 2. Making Changes

#### Code Quality Standards

- **Type Safety**: Keep TypeScript strict and avoid unnecessary assertions
- **Error Handling**: Use project-specific errors for validation and repository failures
- **Testing**: Add unit tests for helpers and integration tests for CLI/scheduler behavior
- **Documentation**: Update README, COMMANDS, or architecture docs when behavior changes
- **Code Style**: Follow Biome formatting and linting

#### Best Practices

- Keep command flow readable and close to the user-facing behavior
- Prefer small helper utilities over heavy orchestration abstractions
- Preserve mirror archive semantics: existing archives fetch by default
- Keep proxy support and prettier out of this project
- Do not expose tuning knobs such as retry or concurrency unless the product need is clear

### 3. Testing Your Changes

Run the relevant checks before submitting:

```bash
pnpm test:unit
pnpm test:integration
pnpm test:run
pnpm check
```

For command documentation:

```bash
pnpm build
pnpm build:readme
```

## Testing Guidelines

### Unit Tests

- Test pure functions in isolation
- Cover edge cases and error conditions
- Keep tests focused and independent

### Integration Tests

- Test CLI command behavior through oclif
- Use local or fake Git execution instead of network calls
- Verify filesystem effects and error behavior

## Code Review

### As a Reviewer

- Be constructive and specific
- Focus on behavior, maintainability, and test coverage
- Distinguish between required changes and suggestions

### As an Author

- Keep pull requests focused
- Explain what changed and why
- Include the commands used for verification
