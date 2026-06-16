# Product Grid Offline Ready

![Product Grid Offline Ready](assets/mobile-product-grid-offline-ready.svg)

## Purpose / 页面目的

Search and select cached products while online or offline. / 在线或离线搜索并选择缓存产品。

## Roles Allowed / 可访问角色

- Outlet User
- Company Admin

## Main Actions / 主要操作

- Search products
- Scan product code
- Open product detail
- Change category

## Data Shown / 显示数据

- Product image
- English/Chinese name
- Storage method
- Product code
- Availability

## Empty/Error/Loading States / 空状态、错误、加载状态

- Offline ready
- Image not cached
- No search results
- Product disabled after sync

## Permissions / 权限规则

- Visible only when Product.active and OutletProduct.active.
- Search uses local SQLite cache.
- Images cached for offline use where available.
