# CONTRIBUTING TO NEXUS-SENTRY

Thank you for your interest in contributing!

## Quick Start

```bash
# Clone the repo
git clone https://github.com/Ggboykxz/nexus-sentry.git
cd nexus-sentry

# Install dependencies
pnpm install

# Run development
docker compose -f docker/docker-compose.yml up
```

## Development Setup

### Prerequisites
- Node.js 20+
- pnpm 9+
- Docker & Docker Compose

### Local Development

```bash
# API only
cd apps/api && pnpm dev

# Web only
cd apps/web && pnpm dev
```

## Commit Convention

We use Conventional Commits:

```
feat: add new feature
fix: bug fix
docs: documentation
chore: maintenance
refactor: code refactoring
test: tests
```

Example:
```bash
git commit -m "feat(api): add github webhook parser"
git commit -m "fix(web): correct severity badge color"
```

## Pull Request Guidelines

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting
5. Commit with conventional commit message
6. Push and create PR

## Code Style

- TypeScript strict mode
- ESLint + Prettier for formatting
- Zod for validation
- Test with Vitest

## License

By contributing, you agree to license under MIT.