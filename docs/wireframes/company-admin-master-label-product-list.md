# Master Label/Product List

![Master Label/Product List](assets/company-admin-master-label-product-list.svg)

## Purpose / 页面目的

Company-owned master list for printable products and shelf-life rules. / 公司主标签/产品清单。

## Roles Allowed / 可访问角色

- Company Admin

## Main Actions / 主要操作

- Create product
- Search product code/name
- Filter by category/status
- Bulk import products

## Data Shown / 显示数据

- Product code
- English name
- Chinese name
- Shelf life
- Storage method
- Status

## Empty/Error/Loading States / 空状态、错误、加载状态

- No products
- Invalid shelf life
- Duplicate product code
- Inactive product

## Permissions / 权限规则

- Product code unique within company.
- Master products are server-owned.
- Offline mobile app can print cached products but cannot edit master list.
