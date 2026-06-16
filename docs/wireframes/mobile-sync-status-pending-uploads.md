# Sync Status / Pending Uploads

![Sync Status / Pending Uploads](assets/mobile-sync-status-pending-uploads.svg)

## Purpose / 页面目的

Explain cache freshness and pending uploads to operators. / 向操作员说明缓存和待上传状态。

## Roles Allowed / 可访问角色

- Outlet User
- Company Admin

## Main Actions / 主要操作

- Pull latest data
- Retry pending uploads
- View sync errors
- Sign out

## Data Shown / 显示数据

- Last successful pull
- Pending print jobs
- Failed uploads
- Device ID

## Empty/Error/Loading States / 空状态、错误、加载状态

- All synced
- Offline
- Auth expired
- Conflict requires admin

## Permissions / 权限规则

- Pull server-owned records.
- Push device-owned print jobs.
- Sign out does not delete local print history unless confirmed.
