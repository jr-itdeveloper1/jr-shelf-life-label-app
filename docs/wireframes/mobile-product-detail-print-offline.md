# Product Detail / Print Offline

![Product Detail / Print Offline](assets/mobile-product-detail-print-offline.svg)

## Purpose / 页面目的

Preview and print a label even when network is unavailable. / 离线时仍可预览和打印标签。

## Roles Allowed / 可访问角色

- Outlet User
- Company Admin

## Main Actions / 主要操作

- Change quantity
- Preview label
- Print label
- Save local PrintJob

## Data Shown / 显示数据

- Product details
- Shelf-life rule
- Label preview
- Printer preference
- Quantity

## Empty/Error/Loading States / 空状态、错误、加载状态

- Offline print allowed
- Printer unavailable
- Quantity confirmation
- Product blocked reason

## Permissions / 权限规则

- PrintJob saved locally first.
- Cloud upload waits for sync.
- Master data cannot be edited offline.
