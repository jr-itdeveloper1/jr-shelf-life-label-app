# Food Safety Compliance Website Mockup / 食品安全合规风格网站原型

This clickable HTML mockup uses the selected **Food Safety Compliance** style for the admin website only.

这个可点击 HTML 原型只覆盖后台网站，不包含手机版。

## Open / 打开

[Open the interactive website mockup](website-mockups/food-safety-compliance/index.html)

## Included / 已包含

- Login and launcher pages.
- Site Admin pages.
- Company Admin pages.
- Devices & Printers registry for app device printer name and MAC address tracking.
- Print Analytics page for monthly sticker totals by outlet and label type.
- Clickable navigation between pages.
- Searchable tables.
- Modal dialogs for create/invite/upload/preview actions.
- Toggle controls and toast feedback for mock interactions.

## Not Included / 不包含

- Mobile app pages.
- Real authentication.
- Real API/database calls.
- Production implementation code.

## Recommended Production Stack / 推荐生产技术栈

- Admin Website: Next.js + TypeScript.
- Backend API: NestJS + TypeScript.
- ORM: Prisma.
- Database: PostgreSQL.
- Scripts/import/backup tools: Python where useful.

## Development Docs

- [Web Admin Development Index](web-admin-development-index.md)
- [Route Map And Page Specs](web-admin-route-map.md)
- [Frontend Implementation Guide](web-admin-frontend-implementation.md)
- [API Contracts For Web Admin](web-admin-api-contracts.md)
- [Printer And Print Analytics Requirements](web-admin-print-tracking-requirements.md)
