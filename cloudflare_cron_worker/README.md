# IFL Cron Warmup Worker

Worker Cloudflare qui pingue le site IFL toutes les 5 minutes pour empêcher le cold start des Pages Functions.

## Déploiement

```bash
cd cloudflare_cron_worker
wrangler deploy
```

## Configuration

- **Trigger** : `*/5 * * * *` (toutes les 5 min)
- **URLs pingées** :
  - https://ideal-formation-leaders.pages.dev/
  - https://ideal-formation-leaders.pages.dev/api/quiz/public-categories
  - https://ifl-landing.pages.dev/

## Plan Cloudflare

- Workers Free : 100 000 requêtes/jour, 1000 executions cron/jour
- Notre usage : 12 fois/heure × 24h = 288 invocations/jour ✅

