# Web Admin API Contracts

本文档列出后台网站实际开发需要的 API。端点命名可以在实施时调整，但权限、字段和行为要保持一致。

## Auth

### `POST /auth/login`

Request:

```json
{
  "email": "admin@jrfoods.example",
  "password": "password"
}
```

Response:

```json
{
  "user": {
    "id": "uuid",
    "name": "Grace Tan",
    "email": "grace@jrfoods.example",
    "role": "company_admin",
    "companyId": "uuid"
  },
  "accessToken": "jwt",
  "refreshToken": "jwt"
}
```

Rules:

- Disabled user cannot login.
- Disabled company blocks Company Admin login.
- Site Admin user may not have `companyId`.

## Site Admin APIs

### `GET /site/companies`

Query:

- `search`
- `status`
- `page`
- `pageSize`

Returns company list with admin/outlet/sync summary.

### `POST /site/companies`

Creates company and optionally first Company Admin.

Required fields:

- `name`
- `code`
- `status`
- `primaryAdminEmail`

Validation:

- `code` unique globally.
- primary admin email valid.

### `GET /site/companies/:companyId`

Returns:

- company profile
- admin count
- outlet count
- product count
- storage usage
- latest sync status

### `PATCH /site/companies/:companyId`

Updates company metadata or status. Disabling company requires confirmation and writes audit log.

### `GET /site/company-admins`

Lists Company Admin users across tenants.

### `POST /site/company-admins/invite`

Invites a Company Admin for a selected company.

### `GET /site/audit-log`

Global audit log. Read-only.

### `GET /site/system-health`

Returns:

- API health
- PostgreSQL health
- database size
- latest backup
- backup retention
- disk usage
- failed sync counts

### `POST /site/backups/run`

Starts manual backup. Site Admin only. Must write audit log.

## Company Admin APIs

All Company Admin endpoints infer `companyId` from the authenticated user. The client must not send arbitrary `companyId` to bypass tenant scope.

### `GET /company/dashboard`

Returns:

- outlet count
- active product count
- printed today count
- known printer count
- monthly sticker snapshot
- printer tracking summary
- work queue items

### `GET /company/outlets`

Lists outlets in current company.

### `POST /company/outlets`

Creates outlet.

Validation:

- `code` unique within company.
- `code` unique within company.
- `code` length and format are validated in the form and API.

### `GET /company/outlets/:outletId`

Returns outlet profile, assigned users, availability summary, and recent print jobs.

Recent print jobs must include:

- `labelType`
- `labelSize`
- `quantity`
- `printerName`
- `printerMacAddress`
- `uploadStatus`

### `GET /company/users`

Lists company users.

### `POST /company/users/invite`

Invites Company Admin or Outlet User.

Validation:

- Company Admin cannot create Site Admin.
- Outlet User needs at least one outlet assignment.

### `GET /company/products`

Lists master products.

Important fields:

- `productCode`
- `nameEn`
- `nameZh`
- `daysToExpire`
- `hoursToExpire`
- `storageMethodEn`
- `storageMethodZh`
- `active`
- `imageStatus`

### `POST /company/products`

Creates product and generates/stores stable product code if code is not manually provided.

### `PATCH /company/products/:productId`

Updates product. Product code changes require explicit confirmation and audit log.

### `GET /company/categories`

Lists categories and prefixes.

### `PATCH /company/categories/:categoryId`

Updates category. Prefix changes default to future products only.

### `POST /company/categories/:categoryId/renumber-preview`

Returns old/new product code preview and conflicts.

### `POST /company/categories/:categoryId/renumber-apply`

Applies confirmed renumbering. Must write audit log. Existing PrintJob snapshots are not changed.

### `GET /company/availability`

Returns outlet product availability matrix.

Query:

- `outletId`
- `categoryId`
- `search`

### `PATCH /company/availability`

Bulk updates `OutletProduct.active`.

### `GET /company/product-images`

Lists product image status.

### `POST /company/product-images`

Uploads or replaces product image.

Rules:

- Images are used in mobile app only.
- Images are not printed.
- Device sync can retry image cache separately from core product data.

### `POST /company/import/preview`

Validates product Excel import and returns row-level preview.

Request:

- Multipart form data.
- `file`: `.xlsx`, max 8 MB.
- `categoryId`: existing active ProductCategory id.

Response:

- `importType`: `Products`.
- `fileName`.
- `rows[]`: row number, product code, names, storage, shelf life, image status, row status, message.
- `summary`: products, ready, warnings, blocked, images, category name and category prefix.

Rules:

- Category name is selected by dropdown on the website.
- Category prefix is read-only and must match imported product codes.
- Validation does not write Product records.

### `POST /company/import/commit`

Applies confirmed product import.

Request:

- Same multipart payload as preview.

Rules:

- Reject if blocked rows exist.
- Create/update products in a transaction.
- Write company audit event with file name and counts.

### `GET /company/export`

Exports company Categories and/or Products as `.xlsx`.

Query parameters:

- `includeCategories`: `true` or `false`.
- `includeProducts`: `true` or `false`.
- `categoryScope`: `all`, `active`, or `selected`.
- `productScope`: `all`, `selectedCategories`, or `selected`.
- `categoryIds`: comma-separated ids, required when category scope is selected or product scope is selected categories.
- `productIds`: comma-separated ids, required when product scope is selected.

Response:

- XLSX binary.
- If both sheets are included, workbook contains separate `Categories` and `Products` sheets.
- Filename prefix is `categories-products`, `categories`, or `products`.

Rules:

- Export preview counts are computed in the web UI from loaded categories/products.
- API must validate the same export option combinations before generating the workbook.
- Invalid selections return `400` with a user-facing message.

### `GET /company/audit-log`

Company-scoped audit log. Read-only.

## Devices & Printers APIs

### `GET /company/devices-printers`

Returns app devices and latest selected printer details.

Fields:

- `deviceId`
- `deviceName`
- `outletId`
- `outletName`
- `appVersion`
- `platform`
- `printerName`
- `printerMacAddress`
- `printerBluetoothId`
- `lastConnectedAt`
- `lastSyncedAt`
- `status`

Rules:

- Prefer MAC address when Android can provide it.
- If MAC address is unavailable, store Bluetooth identifier and printer display name.
- Printer details are also snapshotted on every PrintJob.

### `PATCH /company/devices-printers/:deviceId`

Company Admin can assign outlet or mark device inactive. Printer fields are normally updated by mobile sync.

## Print Analytics APIs

### `GET /company/print-analytics/monthly`

Query:

- `month`: `YYYY-MM`
- `outletId`
- `labelType`

Returns monthly totals by outlet and label type.

Response shape:

```json
{
  "month": "2026-06",
  "totals": [
    {
      "outletId": "uuid",
      "outletName": "Central Kitchen",
      "productLabel60x40": 2184,
      "compactProductLabel40x20": 940,
      "timestampLabel40x30": 388,
      "totalStickers": 3512,
      "topPrinterName": "M324F-CK"
    }
  ]
}
```

### `GET /company/print-analytics/jobs`

Paginated detail drilldown for print jobs.

Fields:

- outlet
- product snapshot
- label type
- label size
- quantity
- printer name
- printer MAC/Bluetooth identifier
- printed at
- upload status

## Error Format

Use a consistent error shape:

```json
{
  "code": "PRODUCT_CODE_CONFLICT",
  "message": "Product code already exists.",
  "fieldErrors": {
    "productCode": "Already used in this company."
  }
}
```

Frontend should map `fieldErrors` to forms and show `message` in toast or page error.
