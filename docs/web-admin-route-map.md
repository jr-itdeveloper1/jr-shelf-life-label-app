# Web Admin Route Map And Page Specs

本文档把最新 HTML mockup 映射为实际 Next.js 路由。开发时页面内容以 `docs/website-mockups/food-safety-compliance/` 为视觉参考，但代码应实现为真实 React components 和 API-driven data。

## Route Conventions

建议使用 Next.js App Router。

```text
apps/web-admin/app
  (public)/
  site-admin/
  company-admin/
```

URL 建议：

- Public: `/login`
- Site Admin: `/site-admin/...`
- Company Admin: `/company-admin/...`

## Public Routes

| Mockup HTML | Next.js Route | Purpose | Notes |
| --- | --- | --- | --- |
| `index.html` | `/` | Prototype launcher only | Production can redirect to `/login` or dashboard. |
| `login.html` | `/login` | Admin login | Email/password, role-based redirect after login. |

Production login behavior:

- Site Admin redirects to `/site-admin/dashboard`.
- Company Admin redirects to `/company-admin/dashboard`.
- Disabled user or disabled company must be blocked.
- Language selector is shown but v1 only supports English.

## Site Admin Routes

| Mockup HTML | Next.js Route | Role | Main Feature |
| --- | --- | --- | --- |
| `site-dashboard.html` | `/site-admin/dashboard` | Site Admin | Platform summary, company count, sync/backup health. |
| `site-companies.html` | `/site-admin/companies` | Site Admin | Company directory, create/invite/export actions. |
| `site-company-detail.html` | `/site-admin/companies/[companyId]` | Site Admin | Company profile, sync risk notes, storage summary. |
| `site-company-form.html` | `/site-admin/companies/new` and `/site-admin/companies/[companyId]/edit` | Site Admin | Create/edit company and primary admin. |
| `site-company-admin-users.html` | `/site-admin/company-admins` | Site Admin | Company Admin account management. |
| `site-audit-log.html` | `/site-admin/audit-log` | Site Admin | Global audit log across tenants. |
| `site-system-health.html` | `/site-admin/system-health` | Site Admin | API, PostgreSQL, backup, disk and restore checklist. |

Site Admin page requirements:

- Every data request uses Site Admin API namespace.
- Company status changes require confirmation and audit log.
- Backup actions are restricted and audited.
- Global audit is read-only.

## Company Admin Routes

| Mockup HTML | Next.js Route | Role | Main Feature |
| --- | --- | --- | --- |
| `company-dashboard.html` | `/company-admin/dashboard` | Company Admin | Operational summary, monthly sticker snapshot, printer tracking links. |
| `company-outlets.html` | `/company-admin/outlets` | Company Admin | Outlet list, create outlet, export outlets. |
| `company-outlet-detail.html` | `/company-admin/outlets/[outletId]` | Company Admin | Outlet profile, assigned users, recent print jobs with label type and printer snapshot. |
| `company-users.html` | `/company-admin/users` | Company Admin | User directory, invite user, role/status filters. |
| `company-user-detail.html` | `/company-admin/users/[userId]` | Company Admin | User profile, role, outlet access. |
| `company-categories.html` | `/company-admin/categories` | Company Admin | Category list and prefix visibility. |
| `company-category-detail.html` | `/company-admin/categories/[categoryId]` | Company Admin | Prefix edit and renumber preview. |
| `company-products.html` | `/company-admin/products` | Company Admin | Master label/product list with category filter. |
| `company-product-detail.html` | `/company-admin/products/[productId]` | Company Admin | Product fields, image upload, label preview. |
| `company-availability.html` | `/company-admin/availability` | Company Admin | Outlet product availability matrix. |
| `company-import-export.html` | `/company-admin/import-export` | Company Admin | Import Products and Export Categories & Products tabs with shared preview. |
| `company-audit-log.html` | `/company-admin/audit-log` | Company Admin | Company-scoped audit log. |
| `company-devices-printers.html` | `/company-admin/devices-printers` | Company Admin | App device printer registry. |
| `company-print-analytics.html` | `/company-admin/print-analytics` | Company Admin | Monthly sticker totals by outlet and label type. |

Company Admin page requirements:

- Every query must be scoped to the logged-in user company.
- Company Admin cannot create Site Admin or access another company.
- Outlet User is not a website role for v1.
- Product, category, outlet, and availability changes must write audit events.

## Shared Page States

Each route should implement these states:

- Loading skeleton or table loading row.
- Empty state with one primary next action.
- API error state with retry.
- Permission denied state.
- Unsaved changes warning on edit forms.
- Save success toast.
- Destructive action confirmation.

## Navigation

Use separate sidebar sets:

- Site Admin sidebar: Dashboard, Companies, Company Admins, Global Audit, Health & Backups.
- Company Admin sidebar: Dashboard, Outlets, Users, Devices & Printers, Categories, Products, Availability, Import/Export, Audit Log, Print Analytics.

The role switch in the mockup is for preview only. In production, role switching should be based on authenticated permissions and selected role context, not a public dropdown.
