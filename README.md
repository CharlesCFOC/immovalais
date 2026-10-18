# Mamanimmobilier

Site immobilier bilingue (français / anglais) pour présenter des biens en Suisse romande, gérer les fiches publiées et recevoir des demandes d’estimation.

## Prérequis

- Node.js 20.9 ou plus récent
- Un projet Supabase

## Développement local

```sh
cp .env.example .env.local
npm ci
npm run dev
```

Le site s’ouvre sur `http://localhost:3000` et redirige vers `/fr/immobilier`.

## Variables d’environnement

- `NEXT_PUBLIC_SUPABASE_URL` : URL du projet Supabase.
- `SUPABASE_SERVICE_ROLE_KEY` : clé secrète serveur Supabase. Ne jamais préfixer par `NEXT_PUBLIC_`.
- `ADMIN_ACCESS_CODE` : code privé pour l’administration des biens.
- `ADMIN_SESSION_SECRET` : secret aléatoire d’au moins 32 caractères pour signer les sessions administrateur.
- `NEXT_PUBLIC_SITE_URL` : URL de production, utilisée pour les métadonnées et les liens canoniques.
- `NEXT_PUBLIC_CALENDLY_URL` : URL de rendez-vous.

## Première installation Supabase

1. Appliquer, dans l’ordre, les migrations de `supabase/migrations/`.
2. Définir les variables d’environnement ci-dessus dans Vercel et dans `.env.local`.
3. Pour importer les 14 fiches initiales et leurs photos locales, configurer `.env.local`, puis exécuter une seule fois `node scripts/migrate-real-estate.mjs`.

Les demandes d’estimation sont enregistrées dans Supabase. L’envoi d’un courriel de notification n’est pas configuré dans cette application.

## Déploiement

Vercel détecte Next.js automatiquement. La commande de compilation est `npm run build`; conserver le répertoire racine du projet comme répertoire de travail.
