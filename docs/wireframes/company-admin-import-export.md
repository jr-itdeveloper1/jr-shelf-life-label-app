# Import/Export

![Import/Export](assets/company-admin-import-export.svg)

## Purpose / 页面目的

Move product/category data in and out for setup and audits. / 导入导出产品与分类资料。

## Roles Allowed / 可访问角色

- Company Admin

## Main Actions / 主要操作

- Switch between `Import Products` and `Export Categories & Products` tabs.
- Import tab: download template, select category, upload `.xlsx`, validate file, commit import.
- Export tab: choose category/product sheets and filters, review export summary, export `.xlsx`.

## Data Shown / 显示数据

- Import tab: active categories, selected category prefix, import validation metrics, row-level validation result.
- Export tab: included sheets, category filter, product filter, categories to export count, products to export count, export readiness.
- Export output uses separate Categories and Products workbook sheets when both are selected.

## Empty/Error/Loading States / 空状态、错误、加载状态

- Import empty preview: `No file validated yet.`
- Import validation errors: blocked row count and row messages.
- Import loading: validating or committing button state.
- Export invalid state: `Needs selection`, disabled `Export XLSX`.
- Export ready state: counts shown and `Export XLSX` enabled.

## Permissions / 权限规则

- Import preview required before write.
- Export requires Company Admin permission and company scope.
- Export filters must match the generated workbook.
- Import action is audited.
