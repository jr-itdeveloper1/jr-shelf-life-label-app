# Site Admin Dashboard

![Site Admin Dashboard](assets/site-admin-dashboard.svg)

## Purpose / 页面目的

Platform-wide operating view for companies, sync health, and recent admin activity. / 给平台管理员查看公司、同步健康度与最近操作。

## Roles Allowed / 可访问角色

- Site Admin

## Main Actions / 主要操作

- Open company records
- Review failed sync jobs
- Check backup status
- Open global audit log

## Data Shown / 显示数据

- Company count
- Active outlets
- Failed sync count
- Latest backup time

## Empty/Error/Loading States / 空状态、错误、加载状态

- No companies yet
- Backup overdue
- API degraded
- All systems healthy

## Permissions / 权限规则

- Site Admin can see all companies.
- Cannot edit company product data directly from global dashboard.
- Audit data is read-only.
