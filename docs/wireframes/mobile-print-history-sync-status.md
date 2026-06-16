# Print History Sync Status

![Print History Sync Status](assets/mobile-print-history-sync-status.svg)

## Purpose / 页面目的

Show local print history and upload status. / 查看本地打印记录和上传状态。

## Roles Allowed / 可访问角色

- Outlet User
- Company Admin

## Main Actions / 主要操作

- View print jobs
- Filter by status
- Retry upload
- Open job detail

## Data Shown / 显示数据

- Product snapshot
- Printed time
- Quantity
- Printer
- Sync status

## Empty/Error/Loading States / 空状态、错误、加载状态

- Uploaded
- Pending upload
- Upload failed
- Offline queue

## Permissions / 权限规则

- Print history is device-owned then synced.
- Uploads are idempotent by client job ID.
- Old product names/codes remain snapshots.
