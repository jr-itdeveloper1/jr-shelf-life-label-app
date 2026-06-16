# Docker Compose Website Runtime

This repository now includes a Docker Compose setup for the JR Label Cloud admin website.

## Services

- `web-admin`: Next.js + TypeScript admin website.
- `api`: NestJS + TypeScript API.
- `postgres`: PostgreSQL database with persistent `postgres_data` volume.

## Start

```powershell
docker compose up --build
```

Open:

- Web admin: http://localhost:3000
- API health: http://localhost:4000/health

## Login Entrypoints

The default login is for Company Admin users:

- Company Admin Login: http://localhost:3000/login

Site Admin has a separate high-privilege entrypoint:

- Site Admin Login: http://localhost:3000/site-admin/login

## Default Demo Users

These users are created only when demo seed is enabled.

| Role | Email | Password |
| --- | --- | --- |
| Company Admin | `grace@jrfoods.example` | `ChangeMe123!` |
| Site Admin | `site.admin@jrlabels.example` | `ChangeMe123!` |

For production:

- Set `ENABLE_DEMO_SEED=false`.
- Create real admin users through a controlled setup script.
- Change all demo passwords before exposing the service.
- Set `AUTH_TOKEN_SECRET` to a long random value and keep it stable across API container recreates.
- Set `COOKIE_SECURE=true` only when the website is served through HTTPS. Keep it `false` for local `http://localhost` testing.

## Data Persistence

PostgreSQL data is stored in the Docker named volume:

```text
postgres_data:/var/lib/postgresql/data
```

Safe:

```powershell
docker compose restart web-admin api
docker compose up -d --build web-admin api
```

Dangerous:

```powershell
docker compose down -v
```

`down -v` removes the PostgreSQL volume and deletes database data.

## Seed Data

The API runs Prisma migrations on startup. Demo data is controlled by:

```text
APP_ENV=development
ENABLE_DEMO_SEED=true
```

Production should use:

```text
APP_ENV=production
ENABLE_DEMO_SEED=false
REQUIRE_AUTH=true
```

Demo pages include:

- Site Admin dashboard and companies.
- Company Admin dashboard, outlets, users, products, categories.
- Devices & Printers with printer name and MAC address tracking.
- Print Analytics with monthly sticker totals by outlet and label type.
