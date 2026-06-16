# Web Admin Frontend Implementation Guide

本文档说明如何把 Food Safety Compliance HTML mockup 落地为 Next.js + TypeScript 后台网站。

## Project Shape

推荐使用 monorepo 结构，便于后续共享 TypeScript types。

```text
apps/
  web-admin/
    app/
    components/
    features/
    lib/
    styles/
  api/
packages/
  shared-types/
```

如果第一阶段想简化，也可以先在现有 repo 下新增：

```text
web-admin/
api/
packages/shared-types/
```

## Next.js Structure

建议使用 App Router：

```text
app/
  layout.tsx
  page.tsx
  login/page.tsx
  site-admin/
    layout.tsx
    dashboard/page.tsx
    companies/page.tsx
    companies/[companyId]/page.tsx
    companies/[companyId]/edit/page.tsx
    company-admins/page.tsx
    audit-log/page.tsx
    system-health/page.tsx
  company-admin/
    layout.tsx
    dashboard/page.tsx
    outlets/page.tsx
    outlets/[outletId]/page.tsx
    users/page.tsx
    users/[userId]/page.tsx
    devices-printers/page.tsx
    products/page.tsx
    products/[productId]/page.tsx
    categories/page.tsx
    categories/[categoryId]/page.tsx
    availability/page.tsx
    images/page.tsx
    import-export/page.tsx
    audit-log/page.tsx
    print-analytics/page.tsx
```

## Visual System

Use the Food Safety Compliance style from the mockup:

- Base background: pale green-tinted grey.
- Surface: white cards/panels.
- Sidebar: dark green.
- Safe state: green.
- Attention state: amber.
- Blocked/error state: red.
- Typography: clear but not overly bold. Reserve heavy weight for page title and metric values only.
- Language selector: keep top right. V1 only supports English.

Avoid:

- Mixed Chinese/English in the same UI.
- Excessive bold text.
- Cards inside cards.
- Decorative dashboard clutter.
- Marketing-style hero pages for admin routes.

## Core Components

Create these shared components first:

- `AppShell`: authenticated layout with sidebar and topbar.
- `SidebarNav`: role-aware nav links.
- `Topbar`: page title, subtitle, language selector, sync/audit status.
- `StatusBadge`: `ok`, `warn`, `danger`, `neutral`.
- `MetricCard`: dashboard KPI cards.
- `DataTable`: search, pagination, empty state, loading state.
- `ConfirmDialog`: destructive actions.
- `Modal`: create/invite/upload/preview dialogs.
- `FormField`: input/select/textarea wrapper with validation message.
- `Toolbar`: page action buttons.
- `Callout`: safe/warn/danger notes.
- `LanguageSelector`: V1 English only, future-ready.

## Feature Modules

Organize domain code by feature:

```text
features/
  auth/
  site-admin/
  companies/
  users/
  outlets/
  products/
  categories/
  availability/
  images/
  devices-printers/
  print-analytics/
  audit-log/
  system-health/
  import-export/
```

Each feature should own:

- API client methods.
- TypeScript DTOs or shared types.
- Form schemas.
- Table column definitions.
- Route-specific components.

## State And Data Fetching

Recommended:

- Use server components for initial route data where practical.
- Use client components for tables with filters, modals, uploads, and interactive forms.
- Use a typed API client wrapper around `fetch`.
- Use React Query or SWR if client-side caching and mutation states become complex.

Every mutation should handle:

- loading
- success toast
- field validation errors
- permission errors
- unexpected API errors
- audit-sensitive confirmation for destructive changes

## Forms

Recommended libraries:

- `react-hook-form`
- `zod`

Validation must match backend rules:

- Product code unique within company.
- Category prefix unique within company.
- Outlet code unique within company; separate short code is not required in v1.
- Shelf life: days/hours non-negative and at least one greater than zero.
- User role cannot exceed current admin permission.
- Outlet User must have at least one outlet access assignment.

## Tables

V1 tables should support:

- text search
- status filter where useful
- pagination with 10 rows per page
- sort by important date/name columns
- loading row
- empty state
- export button where specified

Large tables should not fetch everything forever. Use server-side pagination for:

- audit logs
- print jobs
- print analytics detail drilldown
- products if the list grows beyond the current small catalog

## Accessibility

- Buttons need clear labels.
- Modal focus should be trapped.
- Forms need visible labels and error text.
- Status badges must not rely on color only.
- Tables should have real `<table>` semantics.

## Development Order

1. Create Next.js app shell, styling tokens, and shared components.
2. Implement auth and role-based layouts.
3. Implement read-only pages with mock API fixtures.
4. Connect real NestJS APIs.
5. Implement forms and mutations.
6. Implement upload/import/export.
7. Implement Devices & Printers and Print Analytics.
8. Add automated tests and permission checks.

## Import / Export UI

- `/company-admin/import-export` opens with the `Import Products` tab selected.
- Use the existing `.tabs` pattern for mode switching.
- Import tab owns `Download Template`, category selection, file selection, `Validate File`, and `Commit Import`.
- Export tab owns sheet/filter controls and `Export XLSX`.
- The shared `Preview & Validation` area changes by mode:
  - Import mode shows metrics plus row-level validation table.
  - Export mode shows summary counts only, not row-level records.
- Export preview counts must update immediately from page-loaded categories/products.
- Export request parameters must exactly match the preview state.

## Devices, Availability, And Product Image UX

- Devices & Printers filters keep search, status dropdown, and pagination in one row.
- Product Availability loads outlet-level rows only after an outlet is selected to avoid slow page loads.
- Product image upload belongs in Product Detail; do not require a separate Images page for normal image maintenance.
