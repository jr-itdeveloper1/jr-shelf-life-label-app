# Product Image Management

![Product Image Management](assets/company-admin-product-image-management.svg)

## Status / 当前状态

This standalone page is optional/legacy for v1. Normal product image upload and replacement must be available from Product Detail. / 此独立页面在 v1 中为可选/旧版页面；正常的产品图片上传与替换必须在 Product Detail 中完成。

## Purpose / 页面目的

Optional batch review for product images used by the mobile app. / 可选的批量查看移动端产品图片状态页面。

## Roles Allowed / 可访问角色

- Company Admin

## Main Actions / 主要操作

- Review products missing images.
- Open Product Detail to upload or replace image.
- Filter missing images if the page is revived.

## Data Shown / 显示数据

- Product
- Image status
- Image preview if available
- Updated by
- Sync status

## Empty/Error/Loading States / 空状态、错误、加载状态

- No missing images
- Image metadata load failed
- Image queued for device sync

## Permissions / 权限规则

- Images are shown in app only and not printed.
- Images are uploaded from Product Detail.
- Images stored in MinIO, S3-compatible storage, or mounted server volume.
- Devices cache images for offline use.
