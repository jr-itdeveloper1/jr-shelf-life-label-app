# Category List

![Category List](assets/company-admin-category-list.svg)

## Purpose / 页面目的

Manage product categories and product code prefixes. / 管理产品分类和编码前缀。

## Roles Allowed / 可访问角色

- Company Admin

## Main Actions / 主要操作

- Create category
- Edit prefix
- Sort categories
- Disable category

## Data Shown / 显示数据

- Category name
- Prefix
- Scope
- Product count
- Status

## Empty/Error/Loading States / 空状态、错误、加载状态

- Duplicate prefix
- Category has products
- No categories
- Disabled category

## Permissions / 权限规则

- Prefix unique within company.
- Changing prefix defaults to future products only.
- Renumbering existing products requires preview and confirmation.
