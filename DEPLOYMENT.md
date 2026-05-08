# Nexus Sentry - Deployment Guide

## Overview

Nexus Sentry est une application full-stack avec:
- **Frontend**: React + Vite (déployé sur Vercel)
- **Backend**: Hono + Bun (déployable sur Railway, Render, ou Docker)
- **Database**: PostgreSQL
- **Cache/Queue**: Redis
- **AI**: Ollama (optionnel)

---

## Option 1: Vercel (Frontend)

Le frontend est déjà configuré sur Vercel.

### Mise à jour du déploiement:
```bash
git push
```

### Configuration (vercel.json):
```json
{
  "buildCommand": "pnpm install && pnpm --filter @nexus-sentry/web build",
  "installCommand": "pnpm install",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

---

## Option 2: Railway (Backend + DB + Redis)

### Prérequis:
1. Créer un compte sur [railway.app](https://railway.app)
2. Installer CLI: `npm i -g @railway/cli`
3. Se connecter: `railway login`

### Déploiement:

```bash
# Initialiser le projet
railway init

# Ajouter PostgreSQL
railway add postgres

# Ajouter Redis
railway add redis

# Variables d'environnement
railway variables set OLLAMA_URL=http://host.docker.internal:11434
railway variables set OLLAMA_MODEL=llama3.2:3b
railway variables set NODE_ENV=production

# Déployer
railway up
```

### Configuration (apps/api/railway.json):
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install -g pnpm && pnpm install && pnpm --filter @nexus-sentry/api build"
  },
  "deploy": {
    "numReplicas": 1,
    "startCommand": "bun run src/index.ts"
  }
}
```

### Connecter Vercel à Railway:
- Dans Vercel, aller dans Settings > Environment Variables
- Ajouter `VITE_API_URL` avec l'URL Railway

---

## Option 3: Render (Backend + DB + Redis)

### Prérequis:
1. Créer un compte sur [render.com](https://render.com)
2. Connecter votre repo GitHub

### Déploiement via Blueprint:

```bash
# Le fichier render.yaml est déjà configuré
# Aller sur Render > Blueprints > New Blueprint
# Sélectionner ce repository
```

### Déploiement manuel:

1. **PostgreSQL**: Services > New > PostgreSQL
2. **Redis**: Services > New > Redis
3. **API**: Services > New > Web Service
   - Repository: votre repo
   - Branch: master
   - Build Command: `pnpm install && pnpm --filter @nexus-sentry/api build`
   - Start Command: `bun run apps/api/src/index.ts`

### Variables d'environnement sur Render:
```
DATABASE_URL=<from postgres service>
REDIS_URL=<from redis service>
NODE_ENV=production
PORT=3001
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
```

---

## Option 4: Docker (Complet - Recommandé pour VPS)

### Prérequis:
- Docker et Docker Compose installés

### Déploiement:

```bash
cd docker

# Copier et configurer les variables d'environnement
cp ../.env.example .env
# Éditer .env avec vos valeurs

# Lancer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down
```

### Services disponibles:
- **Web**: http://localhost
- **API**: http://localhost:3001
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **Ollama**: http://localhost:11434

### Production avec Nginx:

```bash
# Build et lancer
docker-compose -f docker-compose.yml up -d --build

# Mettre à jour
git pull
docker-compose -f docker-compose.yml up -d --build
```

---

## Option 5: Mixte (Vercel + Railway)

**Recommandé** pour une vraie production:

1. **Frontend** → Vercel (déployé automatiquement)
2. **Backend + DB + Redis** → Railway

### Configuration:

1. Déployer l'API sur Railway (voir Option 2)
2. Récupérer l'URL Railway (ex: `https://nexus-sentry-api.up.railway.app`)
3. Dans Vercel, ajouter variable:
   - `VITE_API_URL` = URL Railway
   - `VITE_WS_URL` = URL Railway (ws://...)

---

## Configuration des Webhooks

Pour recevoir des événements de sources externes, configurez ces URLs:

```
GitHub:   https://<votre-domaine>/webhooks/github
Sentry:   https://<votre-domaine>/webhooks/sentry
Prometheus: https://<votre-domaine>/webhooks/prometheus
Generic:  https://<votre-domaine>/webhooks/generic
```

---

## Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `DATABASE_URL` | PostgreSQL connection string | postgresql://... |
| `REDIS_URL` | Redis connection string | redis://... |
| `OLLAMA_URL` | URL du service Ollama | http://localhost:11434 |
| `OLLAMA_MODEL` | Modèle LLM à utiliser | llama3.2:3b |
| `NODE_ENV` | Mode de运行 | production |
| `PORT` | Port du serveur API | 3001 |
| `JWT_SECRET` | Secret pour les tokens JWT | - |

---

## Santé et Monitoring

### Health Check:
```
GET /health
```

### Métriques:
```
GET /api/v1/metrics
GET /api/v1/metrics/summary
```

---

## Troubleshooting

### Vérifier les logs:
```bash
# Docker
docker-compose logs -f api

# Railway
railway logs

# Render
render logs <service-name>
```

### Problèmes courants:

1. **CORS errors**: Vérifier `VITE_API_URL` sur le frontend
2. **Database connection**: Vérifier `DATABASE_URL`
3. **Redis connection**: Vérifier `REDIS_URL`
4. **Ollama errors**: L'IA est optionnelle, l'app fonctionne sans

---

## Prochaine étape - Déployer sur Railway

```bash
# Installer Railway CLI
npm i -g @railway/cli

# Se connecter
railway login

# Initialiser
railway init

# Ajouter services
railway add postgres
railway add redis

# Variables
railway variables set OLLAMA_URL=http://host.docker.internal:11434

# Déployer
railway up
```