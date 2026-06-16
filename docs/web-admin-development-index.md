# Web Admin Development Index / 后台网站开发索引

本文档是后台网站实际开发入口。当前选定视觉方向是 **Food Safety Compliance**，但开发目标不是 mockup，而是生产级管理系统。

## 1. Source Of Truth / 开发依据优先级

开发时请按以下优先级执行：

1. [Admin Web Functional Spec](admin-web-functional-spec.md): 生产级业务逻辑、权限、按钮行为、表单控件、工作流和验收标准。
2. [API Contracts For Web Admin](web-admin-api-contracts.md): Web 所需 API、请求/响应、错误处理。
3. [Cloud Data Model](cloud-data-model.md): PostgreSQL 多公司数据模型、同步字段、审计字段。
4. [API And Sync Design](api-and-sync-design.md): Android App bootstrap/pull/push sync 与离线打印上传。
5. [Food Safety Website Mockup](website-mockups/food-safety-compliance/index.html): 只作为视觉布局和页面导航参考。

Mockup 不代表生产逻辑已经完成。所有 dashboard 指标、列表、详情、状态、保存按钮、导入导出、审计、设备/打印机追踪和打印统计都必须由 PostgreSQL + NestJS API 驱动。

## 2. Recommended Technology Stack / 推荐技术栈

- Admin Website: Next.js + TypeScript
- Backend API: NestJS + TypeScript
- ORM: Prisma
- Database: PostgreSQL
- Scripts / backup / import tools: Python where useful
- Deployment: Single-server Docker Compose

## 3. Current Implementation Status / 当前实现状态

Current Docker version is a runnable foundation:

- Next.js admin website runs on `http://localhost:3000`.
- NestJS API runs on `http://localhost:4000`.
- PostgreSQL runs in Docker with persistent volume.
- Demo seed data is inserted into PostgreSQL for local development.

Not production-complete yet:

- Save buttons are not fully wired for all pages.
- Some form fields are still visual/text fields and must become dropdowns, switches or proper inputs.
- RBAC and tenant scoping need full guards and tests.
- Demo seed must be disabled in production.
- Import/export, image upload, backup and sync workflows need complete logic.

## 4. Page Scope / 页面范围

Site Admin:

- Login
- Site Admin Dashboard
- Company List
- Company Detail
- Create/Edit Company
- Company Admin Users
- Global Audit Log
- System Health / Backups

Company Admin:

- Company Dashboard
- Outlet List
- Outlet Detail
- User List
- User Detail / Outlet Access
- Category List
- Category Detail
- Master Label/Product List
- Product Detail
- Outlet Product Availability Matrix
- Devices & Printers
- Print Analytics
- Import/Export
- Company Audit Log

## 5. Required Production Behaviors / 必须实现的生产行为

- Dashboard data must be computed from DB queries, not hardcoded arrays.
- Status fields must use dropdowns or switches.
- Every Save/Disable/Invite/Upload/Import/Export/Backup button must call an API.
- Every write must validate input, enforce permissions, update database and create AuditLog.
- Company Admin must never access another company's records by changing URL ids.
- Outlet User must not access web admin routes in v1.
- Print analytics must group real PrintJob rows by month, outlet, label type and label size.
- Android App must upload printer name and MAC/Bluetooth identifier through sync.
- Devices & Printers must show current connected printer count and company printer quota.
- All data tables should support search, sorting, and 10-row pagination unless the page uses a more specific control.
- Import/Export must use tabs: Import Products by default, Export Categories & Products as the second mode.
- Product image upload is handled from Product Detail.
- PostgreSQL data must survive web/API container rebuilds and recreates.

## 6. Implementation Phases / 实施阶段

Phase 1: Production foundation

- Auth/session
- RBAC guards
- Tenant scoping
- Disable production demo seed
- Real CRUD APIs for company, outlet, user, category and product
- Functional Save buttons

Phase 2: Operational admin

- Availability matrix save
- Image upload and storage
- Devices & Printers edit/status workflows
- Audit logs for all writes

Phase 3: Mobile sync and print tracking

- Bootstrap and incremental pull sync
- Push PrintJob queue
- Device printer registry update
- Monthly print analytics

Phase 4: Maintenance workflows

- Import Products tab with preview/commit
- Export Categories & Products tab with XLSX filters and summary preview
- Backups
- System health
- Restore drill

## 7. Acceptance / 验收标准

Before a feature is considered done:

- It has API tests for permission and validation.
- It has frontend loading/error/success states.
- It writes AuditLog for writes.
- It rejects cross-company access.
- It uses DB-backed data.
- It has Docker verification.
