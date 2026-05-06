# NEXUS-SENTRY

> Open-source Security & Ops Hub — centralize alerts, analyze incidents with local AI

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
![Docker: Ready](https://img.shields.io/badge/Docker-Ready-blue.svg)

NEXUS-SENTRY is a unified hub for security alerts, metrics, and logs with AI-powered incident analysis.

## Features

- **Unified Timeline**: Aggregate alerts from GitHub, Sentry, Prometheus, and custom sources
- **AI Analysis**: Local LLM (Ollama) for automatic incident summary and root cause analysis
- **Fast Deployment**: Self-hosted in 30 seconds with Docker Compose
- **Webhook Intake**: Ready-to-use endpoints for GitHub, Sentry, Prometheus
- **CLI Tool**: Send events from terminal with `nexus send`
- **Modern UI**: React + Tailwind dashboard

## Quick Start

```bash
# Clone and start
docker compose -f docker/docker-compose.yml up

# Access
# API: http://localhost:3001
# Web: http://localhost:3000
```

## Architecture

- **Backend**: Hono (Node.js) + Drizzle ORM + PostgreSQL
- **Queue**: BullMQ + Redis
- **AI**: Ollama (llama3.2:3b)
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Monorepo**: pnpm workspaces + Turborepo

## API Endpoints

| Endpoint | Description |
|----------|------------|
| `GET /api/v1/events` | List events with filters |
| `POST /api/v1/events` | Create event |
| `GET /api/v1/incidents` | List incidents |
| `POST /api/v1/incidents/:id/analyze` | Trigger AI analysis |
| `POST /webhooks/generic` | Generic webhook |
| `POST /webhooks/github` | GitHub webhooks |
| `POST /webhooks/sentry` | Sentry webhooks |
| `POST /api/v1/ai/chat` | Chat with AI |

## Environment

Copy `.env.example` to `.env` and configure:

```bash
DATABASE_URL=postgresql://nexus:nexus@localhost:5432/nexus_sentry
REDIS_URL=redis://localhost:6379
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
```

## Development

```bash
# Install dependencies
pnpm install

# Run API
cd apps/api && pnpm dev

# Run Web
cd apps/web && pnpm dev
```

## License

MIT — Built in Gabon 🇬🇦