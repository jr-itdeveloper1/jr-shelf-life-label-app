# Docker Deployment Architecture / Docker 部署架构

## Goal / 目标

Host the website, API, and PostgreSQL on one server using Docker Compose. Refreshing or recreating the website/API containers must not delete database data.

使用 Docker Compose 在一台服务器上托管网站、API 和 PostgreSQL。刷新或重建 website/API container 不能删除数据库数据。

## Services / 服务

| Service | Image/Runtime | Purpose / 用途 |
| --- | --- | --- |
| caddy | caddy:latest | HTTPS reverse proxy for web and API. |
| web | Next.js container | Admin website. |
| api | NestJS container | Auth, admin APIs, sync APIs. |
| postgres | postgres:16 or 17 | Persistent relational database. |
| minio | minio/minio optional | Product image/object storage. |
| backup | postgres client/alpine optional | Scheduled pg_dump backups. |

## Persistence / 持久化

PostgreSQL data must live in a Docker named volume or host bind mount, not inside the disposable API/web containers.

PostgreSQL 数据必须存在 Docker named volume 或主机 bind mount 中，不能存在 disposable API/web container 内。

Recommended volumes:

```yaml
volumes:
  postgres_data:
  minio_data:
```

Recommended mounts:

```yaml
services:
  postgres:
    image: postgres:16
    volumes:
      - postgres_data:/var/lib/postgresql/data
  minio:
    volumes:
      - minio_data:/data
  backup:
    volumes:
      - /srv/jr-label/backups:/backups
```

## Refresh Safety / Refresh Container 不丢数据策略

- Safe: `docker compose up -d --build web api` rebuilds application containers only.
- Safe: `docker compose restart web api` restarts application containers only.
- Safe with volume: recreating `postgres` keeps data if `postgres_data` is not removed.
- Dangerous: `docker compose down -v` removes volumes and deletes database data.
- Dangerous: manually deleting `postgres_data` removes the database.

## Backup / 备份

- Run scheduled `pg_dump` every night to `/srv/jr-label/backups`.
- Keep daily backups for 14 days and monthly backups for 12 months.
- Copy backups to off-server storage if possible.
- Test restore at least once before production launch.

Example restore drill:

```text
1. Start a clean PostgreSQL container with a new test volume.
2. Restore latest pg_dump into the test database.
3. Start API against the restored database.
4. Login to admin website and verify companies, products, outlets, and print jobs.
```

## Environment Variables / 环境变量

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `ADMIN_WEB_ORIGIN`
- `S3_ENDPOINT` or `MINIO_ENDPOINT`
- `S3_BUCKET_PRODUCT_IMAGES`
- `BACKUP_RETENTION_DAYS`

Secrets must be stored in server environment files or Docker secrets, not committed to Git.
