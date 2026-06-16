# Local Device Settings Admin

![Local Device Settings Admin](assets/mobile-admin-local-device-settings.svg)

## Purpose / 页面目的

Limit mobile admin to device settings after cloud rollout. / 云端上线后移动端 Admin 只管理本机设置。

## Roles Allowed / 可访问角色

- Company Admin

## Main Actions / 主要操作

- Select printer
- View device cache
- Trigger sync
- Export diagnostic logs

## Data Shown / 显示数据

- Preferred printer
- Device ID
- Cache size
- Last sync
- App version

## Empty/Error/Loading States / 空状态、错误、加载状态

- Printer not paired
- Cache clear confirmation
- Sync failed
- Diagnostics exported

## Permissions / 权限规则

- Product/outlet/category edits move to web admin.
- Device settings remain local.
- Cache clearing requires confirmation.
