# Implementation Roadmap / 实施路线图

## Phase 0: Documentation And Approval / 文档确认

- Review these cloud architecture and page documents.
- Confirm server domain, backup location, and whether images use MinIO or mounted storage.
- Confirm whether Outlet User needs any web access in v1.

Acceptance:

- Stakeholders agree on roles, data ownership, offline behavior, and deployment model.

## Phase 1: Backend Foundation / 后端基础

- Create NestJS API workspace.
- Add Prisma and PostgreSQL schema.
- Implement auth, roles, tenant guards, and migrations.
- Implement Company, User, Outlet, Category, Product, OutletProduct APIs.
- Implement Device printer registry and PrintJob reporting fields: labelType, labelSize, printerName, printerMacAddress, and printerBluetoothId.
- Add audit logging.

Acceptance:

- Company Admin cannot access another company.
- Site Admin can create company and first Company Admin.
- Product/category/outlet CRUD passes validation tests.

## Phase 2: Admin Website / 后台网站

- Create Next.js admin website.
- Build Site Admin pages.
- Build Company Admin pages.
- Build Devices & Printers page.
- Build Print Analytics page for monthly sticker totals by outlet and label type.
- Add Import Products / Export Categories & Products tabbed workflow with shared preview.
- Add Product Detail image upload.

Acceptance:

- All pages in `docs/admin-web-page-wireframes.md` have implemented equivalents.
- Permission matrix is enforced in UI and API.

## Phase 3: Mobile SQLite Cache / 移动端 SQLite 缓存

- Replace SecureStore JSON admin data with SQLite repository.
- Keep SecureStore for tokens and printer preference only.
- Add bootstrap and pull sync.
- Cache images locally.
- Require online sync for adding/removing/changing selected printer; keep actual printing offline-capable.

Acceptance:

- App starts offline after bootstrap.
- Product grid/search/print work from SQLite cache.

## Phase 4: PrintJob Upload / 打印记录上传

- Add local pending upload statuses.
- Implement `/sync/push-print-jobs`.
- Add retry and idempotency.
- Add web print history summary.

Acceptance:

- Offline print jobs upload once network returns.
- Repeated upload does not duplicate records.

## Phase 5: Production Deployment / 生产部署

- Deploy with Docker Compose.
- Configure HTTPS.
- Configure PostgreSQL volume and nightly backups.
- Run restore drill.
- Monitor logs, disk usage, and failed sync jobs.

Acceptance:

- Recreating web/API containers does not affect database data.
- PostgreSQL data survives postgres container recreate with the same volume.
- Backup restore succeeds on a clean test database.
