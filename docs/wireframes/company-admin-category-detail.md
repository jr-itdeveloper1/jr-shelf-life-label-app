# Category Detail

![Category Detail](assets/company-admin-category-detail.svg)

## Purpose / 页面目的

Edit category name, prefix, scope, and status. / 修改分类名称、前缀、范围和状态。

## Roles Allowed / 可访问角色

- Company Admin

## Main Actions / 主要操作

- Edit name
- Edit prefix
- Choose renumber policy
- Save category

## Data Shown / 显示数据

- Name
- Code prefix
- Scope
- Product count
- Renumber preview

## Empty/Error/Loading States / 空状态、错误、加载状态

- Prefix conflict
- Renumber conflict
- Unsaved changes
- Category disabled

## Permissions / 权限规则

- Default applies prefix to future products only.
- Renumber existing product codes is a separate confirmed action.
- Product codes are generated from the selected category prefix.
