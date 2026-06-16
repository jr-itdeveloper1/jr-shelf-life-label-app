# Admin Web Functional Spec / 后台网站生产级功能规格

本文档用于把当前 Docker 可运行原型升级为真实业务系统。现有页面不能停留在 mockup 状态：所有 dashboard 数字、列表、详情、保存按钮、状态切换、权限边界和审计记录都必须连接 PostgreSQL，并通过 NestJS API 执行业务逻辑。

This document defines the production behavior for the JR Label Cloud admin website. The UI may keep the current Food Safety Compliance visual style, but every page must be backed by real database queries, role-based permissions, validation, state transitions, and audit logs.

## 1. Product Boundary / 产品边界

### 1.1 System Purpose

JR Label Cloud 管理公司、outlet、产品 master label list、产品图片、门店可用产品、APP 设备、打印机记录、打印统计和审计日志。Android App 继续负责离线查看、搜索和蓝牙打印；后台网站负责云端 master data 和运营管理。

### 1.2 Prototype vs Production

当前运行版本中的数据是由 API seed 写入 PostgreSQL 的 demo data，所以页面看起来像 dummy data。生产版本必须遵守：

- 页面不得 hardcode dashboard 指标、outlet、产品、打印统计或提示数字。
- Demo seed 只能在 development 环境启用，生产环境默认只创建初始 Site Admin 或由安装脚本创建。
- 所有列表和详情页必须从 API 读取数据库数据。
- 所有 Save、Disable、Invite、Import、Export、Upload、Toggle、Run Backup 按钮必须有明确 API 行为、加载状态、错误状态和审计记录。

Recommended production env flags:

| Env Key | Purpose |
| --- | --- |
| `APP_ENV=production` | 禁止 demo seed 和开发快捷入口。 |
| `ENABLE_DEMO_SEED=false` | 不创建示例公司、示例 outlet、示例 print jobs。 |
| `INITIAL_SITE_ADMIN_EMAIL` | 首次部署创建平台管理员。 |
| `DATABASE_URL` | PostgreSQL 连接字符串。 |

## 2. Roles And Permissions / 角色与权限

### 2.1 Roles

| Role | Scope | Main Responsibility |
| --- | --- | --- |
| `SITE_ADMIN` | Global platform | 管理公司、Company Admin、系统健康、备份和全局审计。 |
| `COMPANY_ADMIN` | One company | 管理本公司 outlet、用户、产品、分类、图片、可用性、设备、打印统计和公司审计。 |
| `OUTLET_USER` | Assigned outlets | 使用 Android App 查看产品、打印 label、上传 print jobs；默认不能访问后台网站。 |

### 2.2 Enforcement Rules

权限必须在三层同时执行：

- Frontend route guard: 不显示无权菜单和按钮。
- API guard: JWT/session 中的 `role`, `companyId`, `userId` 必须校验。
- Database query scope: Company Admin 和 Outlet User 所有查询必须包含 `companyId`，Outlet User 还必须限制 `outletId in assignedOutlets`。

Frontend 隐藏按钮不是安全控制，真正授权必须由 API 完成。

### 2.3 Permission Matrix

| Feature | Site Admin | Company Admin | Outlet User |
| --- | --- | --- | --- |
| Login web admin | Yes | Yes | No by default |
| Create company | Yes | No | No |
| Edit company profile/status | Yes | No | No |
| Manage company admins | Yes | No | No |
| View system health/backups | Yes | No | No |
| View global audit | Yes | No | No |
| Manage outlets | No | Yes, own company | No |
| Manage users | No | Yes, own company | No |
| Manage categories | No | Yes, own company | No |
| Manage master products | No | Yes, own company | No |
| Manage outlet product availability | No | Yes, own company | No |
| Manage product images | No | Yes, own company | No |
| View device/printer registry | No | Yes, own company | Read own assigned devices in mobile only |
| Edit device/printer notes/status | No | Yes, own company | Device updates through sync only |
| View print analytics | Optional global summary | Yes, own company | No |
| Import/export company data | No | Yes, own company | No |
| Print labels | No | No on web | Yes on Android App |

## 3. Shared UI Logic / 通用页面逻辑

### 3.1 Form Controls

Text-looking fields are not acceptable where the data has a finite state. Required controls:

| Data | UI Control | Notes |
| --- | --- | --- |
| `Outlet.status` | Dropdown or switch | Values: `ACTIVE`, `DISABLED`, `ARCHIVED`; archive requires confirmation. |
| `Company.status` | Dropdown | Values: `TRIAL`, `ACTIVE`, `SUSPENDED`, `DISABLED`. |
| `User.status` | Dropdown | Values: `INVITED`, `ACTIVE`, `DISABLED`. |
| `Product.active` | Switch | Controls mobile visibility with OutletProduct. |
| `OutletProduct.active` | Switch in matrix | Per outlet availability. |
| `Category.status` | Dropdown | Values: `ACTIVE`, `DISABLED`, `ARCHIVED`. |
| `Device.status` | Dropdown | Values: `ACTIVE`, `OFFLINE`, `NEEDS_SETUP`, `RETIRED`. |
| `Label type` | Dropdown | Values controlled by `LabelTemplate` or enum. |
| Month/report period | Month picker | Used by print analytics. |

### 3.2 Save Button Behavior

Every Save button must be functional.

Required behavior:

- Button is disabled until form is dirty and valid.
- On click, call the relevant `PATCH` or `POST` endpoint.
- Show loading state: `Saving...`.
- API validates role, company scope, status transition, uniqueness and optimistic concurrency.
- On success, show success toast, update local view, reset dirty state, write `AuditLog`.
- On validation error, show field-level errors.
- On conflict, show stale data message and reload option.
- On network/server error, show retry option.

### 3.3 Optimistic Concurrency

Editable records must include `updatedAt` or `syncVersion` in the form payload.

API rule:

- If submitted version is older than DB version, reject with `409 CONFLICT`.
- Response includes current server copy and changed fields.
- UI shows “This record was updated by another user. Review latest version before saving.”

### 3.4 Audit Requirements

Every business write creates an append-only `AuditLog` row:

- actor user
- company
- outlet when relevant
- action
- record type and record id
- before snapshot
- after snapshot
- risk level
- request id
- createdAt

High-risk examples:

- Disable company
- Disable outlet
- Disable user
- Renumber products
- Bulk import
- Delete/replace product image
- Clear printer MAC address

## 4. Data Model And Status Rules / 数据模型与状态规则

### 4.1 Required Core Entities

| Entity | Production Role |
| --- | --- |
| `Company` | Tenant root. Disabled company blocks login and sync. |
| `User` | Authentication identity and role. |
| `UserOutletAccess` | Outlet-level assignment for mobile users. |
| `Outlet` | Kitchen/store using label printing. |
| `ProductCategory` | Category prefix and grouping. |
| `Product` | Company master label list item. |
| `OutletProduct` | Product availability per outlet. |
| `ProductImage` | Image metadata and storage path. |
| `LabelTemplate` | Sticker/label type definition and layout. |
| `Device` | Registered Android app installation/device. |
| `PrintJob` | Immutable print attempt snapshot uploaded from app. |
| `AuditLog` | Append-only operation history. |

### 4.2 PrintJob Required Fields

`PrintJob` is the source for print analytics. It must be immutable after upload except internal sync metadata.

Required fields:

- `companyId`
- `outletId`
- `productId`
- `userId`
- `deviceId`
- `clientJobId`
- `productCodeSnapshot`
- `productNameSnapshot`
- `labelType`
- `labelSize`
- `quantity`
- `printedAt`
- `printerName`
- `printerMacAddress`
- `printerBluetoothId`
- `uploadStatus`
- `uploadedAt`

Analytics must group by `printedAt` month, `outletId`, `labelType`, and `labelSize`, and sum `quantity`.

### 4.3 Device Printer Tracking

Android App records selected printer name and MAC/Bluetooth identifier locally. On sync:

- Update `Device.printerName`.
- Update `Device.printerMacAddress` or `Device.printerBluetoothId`.
- Update `Device.lastPrinterConnectedAt`.
- Snapshot the same printer fields onto each `PrintJob`.
- If printer changes, create `AuditLog` action `PRINTER_CHANGED`.

## 5. Page Functional Specs / 页面功能规格

### 5.1 Login

Purpose:

- Authenticate user and open the correct role workspace.

Logic:

- `POST /auth/login`.
- Site Admin routes to `/site-admin/dashboard`.
- Company Admin routes to `/company-admin/dashboard`.
- Outlet User login on web is rejected unless explicitly enabled.
- Disabled user or disabled company cannot login.

Controls:

- Email input
- Password input
- Role/workspace selector only for demo/dev; production derives role from account.
- Language selector can remain, but English is default for current build.

### 5.2 Site Admin Dashboard

Data source:

- `GET /site/dashboard`

Metrics must come from DB:

- active companies count
- suspended/disabled companies count
- company admin count
- failed sync uploads count
- backup status
- storage/database size
- recent high-risk audit events

Actions:

- Open companies
- Open global audit
- Open system health
- Run backup if permitted

### 5.3 Company List

Data source:

- `GET /site/companies`

Actions:

- Create company
- Edit company
- Suspend/disable/reactivate company
- Search/filter by name, code, status

Rules:

- Company code unique.
- Disabling company blocks Company Admin login and mobile sync.
- Disabling company requires confirmation and audit reason.

### 5.4 Company Detail / Create/Edit Company

Controls:

- Company name: text
- Company code: text, immutable after creation unless special permission
- Status: dropdown
- Plan/license: dropdown if needed
- Default timezone: dropdown
- Data retention policy: dropdown

Save:

- Create: `POST /site/companies`
- Edit: `PATCH /site/companies/:companyId`

### 5.5 Company Admin Users

Data source:

- `GET /site/company-admins`

Actions:

- Invite Company Admin
- Disable/reactivate Company Admin
- Reset invite

Rules:

- Email unique globally.
- A user can be Company Admin for one company in v1.
- Invite sends token or email link in production.

### 5.6 Global Audit Log

Data source:

- `GET /site/audit-log`

Filters:

- Company
- Actor
- Action
- Record type
- Risk
- Date range

Rules:

- Read-only.
- Export requires Site Admin.

### 5.7 System Health / Backups

Data source:

- `GET /site/system-health`

Actions:

- Run backup: `POST /site/backups/run`
- Download backup manifest if enabled

Rules:

- Backup files and PostgreSQL data must be stored in persistent Docker volumes or mounted host paths.
- `docker compose down` must not delete DB data.
- `docker compose down -v` is destructive and must be documented as forbidden for normal maintenance.

### 5.8 Company Dashboard

Data source:

- `GET /company/dashboard`

Dashboard widgets must be computed from DB:

| Widget | Query Logic |
| --- | --- |
| Products missing images | Active products in company without active ProductImage. |
| Failed print upload retries | PrintJob or sync queue records with failed/pending status. |
| Printer registry changes this month | AuditLog where action is `PRINTER_CHANGED` in current month. |
| Monthly sticker snapshot | Sum PrintJob.quantity by outlet and label type for selected month. |
| Recent audit events | Latest AuditLog rows for company. |
| Offline devices | Devices whose last sync is older than threshold. |

Actions:

- Open printer registry
- Open print analytics
- Open products missing images
- Open failed sync jobs

### 5.9 Outlet List

Data source:

- `GET /company/outlets`

Actions:

- Create outlet
- Export outlets
- Open outlet detail
- Filter by status

Rules:

- `code` unique within company. A separate `shortCode` is not required in v1 unless a future integration needs it.
- Disabled outlet is excluded from mobile outlet selection.

### 5.10 Outlet Detail

Data source:

- `GET /company/outlets/:outletId`

Controls:

- Outlet name: text
- Outlet code: text or immutable text after creation
- Short code: text
- Status: dropdown or switch, not plain text input
- Timezone: dropdown if outlet-specific
- Operational notes: textarea

Actions:

- Save Outlet: `PATCH /company/outlets/:outletId`
- Disable Outlet: confirmation modal then `PATCH status=DISABLED`
- Open Product Availability

Rules:

- Disable outlet requires confirmation and reason.
- If outlet has pending unsynced print jobs, show warning before disable.
- Recent print jobs table is read-only and from `PrintJob`.

### 5.11 User List

Data source:

- `GET /company/users`

Actions:

- Invite user
- Export users
- Open user detail

Rules:

- Company Admin can manage users only in own company.
- Outlet User must have at least one outlet access unless marked inactive.

### 5.12 User Detail / Outlet Access

Controls:

- Name: text
- Email: text, immutable after invite unless admin action
- Role: dropdown limited to `COMPANY_ADMIN` or `OUTLET_USER`
- Status: dropdown
- Outlet access: multi-select list

Save:

- `PATCH /company/users/:userId`

Rules:

- Company Admin cannot promote someone to Site Admin.
- Company Admin cannot remove their own last Company Admin permission if it would leave company without admin.

### 5.13 Master Label/Product List

Data source:

- `GET /company/products`

Actions:

- Create product
- Bulk import
- Export products
- Open product detail
- Filter by category, active status, missing image

Rules:

- Product code unique within company.
- Product visibility in Android App requires `Product.active = true` and `OutletProduct.active = true`.

### 5.14 Product Detail

Controls:

- Product code: generated or manually entered based on company rule
- English name: text
- Chinese name: text if needed
- Category: dropdown
- Shelf life: number + unit selector
- Storage method: dropdown/text
- Print label type defaults: dropdown
- Active: switch
- Image: upload/replace/remove controls

Save:

- `PATCH /company/products/:productId`

Rules:

- Existing PrintJob snapshots never change when product is edited.
- Product code changes require high-risk confirmation and audit.

### 5.15 Category List / Detail

Data source:

- `GET /company/categories`
- `GET /company/categories/:categoryId`

Controls:

- Name: text
- Code prefix: text
- Scope: dropdown
- Status: dropdown

Actions:

- Save category
- Preview renumber
- Confirm renumber

Rules:

- Prefix unique within company.
- Renumber requires preview, conflict check, confirmation and audit.

### 5.16 Outlet Product Availability Matrix

Data source:

- `GET /company/availability?outletId=&categoryId=`

Controls:

- Company-level tab: category filter dropdown, company enabled switch per product.
- Outlet-level tab: outlet filter dropdown first, then category filter dropdown.
- Outlet-level product availability switch per product/outlet row.

Save:

- `PATCH /company/availability`

Rules:

- Company-level enabled products become visible to outlet-level matrices.
- Outlet-level matrix must load rows for the selected outlet on demand; do not pre-load every outlet/product combination on page open.
- Outlet User sees and edits only products for assigned outlets, and only if company-level availability is enabled.
- Bulk save must submit changed rows only.
- Every changed row writes AuditLog.
- Android App sees changes only after next sync pull.

### 5.17 Product Images

Data source:

- `GET /company/products/:productId`
- `POST /company/products/:productId/image`

Actions:

- Upload image from Product Detail.
- Replace image from Product Detail.
- Show missing image status in product list/dashboard work queue.

Rules:

- Product image upload belongs in Product Detail for v1.
- A standalone Images page is optional/legacy and must not be the only way to upload images.
- Files stored in server local volume or MinIO/S3-compatible storage.
- Database stores metadata and object path, not large binary content.
- Removing image does not disable product.

### 5.18 Devices & Printers

Data source:

- `GET /company/devices-printers`

Controls:

- Device status: dropdown
- Status filter dropdown aligned with search.
- Support notes: textarea

Actions:

- Export printer registry
- Mark device retired
- Clear stale printer assignment with confirmation

Rules:

- Page shows connected printer count and company maximum printer connections; maximum can be a number or unlimited.
- Printer name/MAC are normally updated by Android sync.
- Admin edit of printer fields is restricted and audited.
- Device belongs to one company and optionally one outlet.

### 5.19 Print Analytics

Data source:

- `GET /company/print-analytics/monthly?month=YYYY-MM`
- `GET /company/print-analytics/jobs`

Filters:

- Month
- Outlet
- Label type
- Printer
- Device

Reports:

- Total stickers by outlet per month
- Total stickers by label type
- Total stickers by label size
- Top products printed
- Printer usage by MAC/name
- Failed/retried print job uploads

Rules:

- Counts must sum `PrintJob.quantity`, not row count.
- Report uses `printedAt`, not `uploadedAt`, for monthly totals.
- PrintJob snapshots are used for historical accuracy.

### 5.20 Import / Export

Page layout:

- Two tabs: `Import Products` and `Export Categories & Products`.
- Import tab is the default when opening `/company-admin/import-export`.
- Each tab shows only controls for its mode.
- Shared section title: `Preview & Validation`.

Import tab actions:

- Download template
- Upload `.xlsx` file
- Select existing Category; Category Prefix is read-only from selected Category.
- Validate File
- Commit Import

Import workflow:

1. User selects an existing active Category and uploads `.xlsx`.
2. API validates rows and returns row-level preview with errors/warnings.
3. User reviews preview.
4. Commit applies valid rows in transaction.
5. Write AuditLog with file name, counts, failures and actor.

Export tab actions:

- Choose whether to include Categories sheet.
- Choose whether to include Products sheet.
- Category scope: all categories, active categories only, selected categories.
- Product scope: all products, products from selected categories, selected products.
- Export XLSX.

Export preview:

- Shows sheets included.
- Shows category filter.
- Shows product filter.
- Shows categories to export count.
- Shows products to export count.
- Shows export status `Ready` or `Needs selection`.
- Does not show row-level export data.

Rules:

- No partial silent failures.
- Commit must be idempotent or protected by import session id.
- Export must use the same selected options shown in the preview.
- Export file is `.xlsx`; Categories and Products are separate sheets when both are included.
- Large imports should run as background jobs in later phase.

### 5.21 Company Audit Log

Data source:

- `GET /company/audit-log`

Rules:

- Company Admin sees own company only.
- Read-only.
- Export requires permission.

## 6. Main Workflows / 主要工作流

### 6.1 Company Onboarding

1. Site Admin creates Company.
2. Site Admin invites first Company Admin.
3. Company Admin logs in.
4. Company Admin creates outlets.
5. Company Admin creates categories and products.
6. Company Admin configures outlet product availability.
7. Android users login online and bootstrap data.
8. Outlets can print offline after bootstrap.

### 6.2 Outlet Management

1. Company Admin opens Outlet List.
2. Creates or edits outlet.
3. Status uses dropdown/switch.
4. Save validates uniqueness and permissions.
5. API writes Outlet and AuditLog.
6. Mobile sync pull receives changed outlet record.

### 6.3 Product Publishing To Mobile

1. Company Admin creates Product.
2. Optional image upload.
3. Company Admin enables Product.active.
4. Company Admin enables OutletProduct.active for each outlet.
5. Mobile app sync pull receives product, category, image metadata and availability.
6. Offline app shows only eligible products for selected outlet.

### 6.4 Offline Print And Upload

1. User selects outlet in Android App.
2. App searches cached products offline.
3. User prints label.
4. App creates local PrintJob with `clientJobId`, label type, quantity, printer name and MAC/Bluetooth id.
5. When online, app pushes pending print jobs.
6. API upserts by `clientJobId`.
7. API stores immutable PrintJob and updates Device printer registry.
8. Dashboard and print analytics reflect uploaded jobs.

### 6.5 Printer Change Tracking

1. Android user selects or reconnects printer.
2. App records printer name and MAC/Bluetooth identifier.
3. Sync updates Device.
4. If changed from previous printer, API writes `AuditLog PRINTER_CHANGED`.
5. Every PrintJob also stores printer snapshot.

### 6.6 Disable Outlet

1. Company Admin clicks Disable Outlet.
2. UI shows confirmation and reason field.
3. API checks permission and pending sync risk.
4. Outlet status becomes `DISABLED`.
5. Mobile sync receives disabled outlet; app blocks new outlet selection after sync.
6. Historical PrintJobs remain visible.

## 7. API Requirements / API 需求

### 7.1 Write Endpoint Pattern

All write endpoints should return:

```json
{
  "data": {},
  "auditId": "uuid",
  "syncVersion": 123,
  "message": "Saved"
}
```

Validation errors:

```json
{
  "error": "VALIDATION_ERROR",
  "fields": {
    "code": "Outlet code already exists in this company."
  }
}
```

Conflict errors:

```json
{
  "error": "CONFLICT",
  "message": "Record was updated by another user.",
  "current": {}
}
```

### 7.2 Required Web API Endpoints

| Page | Required Endpoints |
| --- | --- |
| Login | `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh` |
| Site Dashboard | `GET /site/dashboard` |
| Companies | `GET/POST /site/companies`, `GET/PATCH /site/companies/:id` |
| Company Admins | `GET/POST /site/company-admins`, `PATCH /site/company-admins/:id` |
| System Health | `GET /site/system-health`, `POST /site/backups/run` |
| Company Dashboard | `GET /company/dashboard` |
| Outlets | `GET/POST /company/outlets`, `GET/PATCH /company/outlets/:id` |
| Users | `GET/POST /company/users`, `GET/PATCH /company/users/:id` |
| Categories | `GET/POST /company/categories`, `GET/PATCH /company/categories/:id` |
| Products | `GET/POST /company/products`, `GET/PATCH /company/products/:id` |
| Availability | `GET/PATCH /company/availability` |
| Images | `GET/POST/PATCH/DELETE /company/product-images` |
| Devices | `GET/PATCH /company/devices-printers/:id` |
| Print Analytics | `GET /company/print-analytics/monthly`, `GET /company/print-analytics/jobs` |
| Import/Export | `POST /company/import/preview`, `POST /company/import/commit`, `GET /company/export` |
| Audit Log | `GET /company/audit-log`, `GET /site/audit-log` |

## 8. Production Acceptance Criteria / 生产验收标准

The implementation is not accepted until all criteria are met:

- Dashboard data is computed from PostgreSQL, not hardcoded arrays.
- Demo seed is disabled in production.
- Every Save/Disable/Invite/Upload/Import/Export/Backup button has real behavior.
- Status fields use dropdowns or switches, not plain text inputs.
- All writes validate input and create AuditLog records.
- Company Admin cannot access another company by changing URL ids.
- Outlet User cannot access web admin pages by URL.
- Print analytics groups by outlet, month, label type and label size using `PrintJob.quantity`.
- Device/printer registry records printer name and MAC/Bluetooth id from Android sync.
- Offline Android workflow can view/search/print/save PrintJobs without network after bootstrap.
- Sync upload is idempotent by `clientJobId`.
- Forms show loading, validation errors, conflict errors and success state.
- Docker deployment preserves PostgreSQL data across container rebuild/recreate.

## 9. Implementation Priority / 实施优先级

Phase 1: Foundation

- Production auth/session and RBAC guards.
- Disable demo seed for production.
- Real CRUD APIs for company, outlet, user, category, product.
- Functional Save buttons and form validation.

Phase 2: Operational Admin

- Availability matrix save.
- Product image upload storage.
- Device/printer registry update APIs.
- Audit log on every write.

Phase 3: Mobile Sync And Print Analytics

- Bootstrap/pull sync.
- Push print jobs idempotently.
- Monthly print analytics from PrintJob.
- Failed upload retry visibility.

Phase 4: Import/Export And Maintenance

- Import preview/commit workflow.
- Export files.
- Backup/restore workflow.
- System health monitoring.
