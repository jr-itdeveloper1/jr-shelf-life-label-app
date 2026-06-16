# Mobile Cloud Sync Functional Spec / 移动端云同步功能规格

## Current State / 当前状态

The existing app is React Native / Expo with Android native printer support. Current admin data is stored as JSON in `expo-secure-store`, while `expo-sqlite` is already available as a dependency.

现有 app 是 React Native / Expo，并包含 Android 原生蓝牙打印模块。目前 admin data 存在 `expo-secure-store` JSON 中，项目已经安装 `expo-sqlite`，适合下一阶段迁移为本地数据库和同步缓存。

## Target State / 目标状态

- SQLite becomes the local source of truth for cached company data and print history.
- SecureStore keeps tokens and small sensitive settings only.
- Mobile app can operate offline after first successful bootstrap.
- Web admin owns master data editing.
- Mobile admin becomes local device settings only.
- Company Admin and Outlet User can log in on mobile with email/password.
- Login session remains valid until user signs out, subject to token refresh/security policy.

## Offline Capabilities / 离线能力

The app must work offline for:

- Viewing assigned outlets from cache.
- Viewing categories and products from cache.
- Searching by product code, English name, Chinese name, category, and storage method.
- Scanning product codes and opening cached products.
- Calculating expiry date/time.
- Previewing labels.
- Printing labels through Bluetooth.
- Saving PrintJob records locally.

The app must require network connection for:

- First login and bootstrap.
- Adding, deleting, or changing the selected printer record.
- Pulling updated Outlet, Category, Product, and availability data.
- Uploading pending PrintJob records.

## Local SQLite Tables / 本地 SQLite 表

- `companies`
- `current_user`
- `outlets`
- `product_categories`
- `products`
- `outlet_products`
- `label_templates`
- `product_images`
- `print_jobs`
- `sync_metadata`
- `sync_queue`
- `device_settings`

## Screen Changes / 页面变化

- Login / Company Selection: first network login and bootstrap.
- Outlet Selection: shows synced outlets and last sync time.
- Category Selection: shows cache status and allows offline continuation.
- Product Grid: reads from SQLite cache and indicates offline-ready status.
- Product Detail: prints offline and saves local PrintJob first.
- Print History: shows uploaded, pending, and failed upload statuses.
- Sync Status: lets user retry pull/push and inspect errors.
- Admin: product/outlet/category editing moves to website; mobile keeps printer/device settings.
- Timestamp printing screen allows editing day, month, year, hour, minute, and AM/PM using Android picker controls where available; preview updates immediately before printing.

## Sync Rules / 同步规则

- Pull server-owned data using `syncVersion` or cursor.
- Save pull results in one SQLite transaction.
- Queue device-created PrintJob records with `clientJobId`.
- Push pending jobs idempotently.
- Keep old PrintJob snapshots unchanged even if product names or codes change later.
- Save `labelType`, `labelSize`, `printerName`, and `printerMacAddress` on every local PrintJob before upload.
- Save each app device's selected printer name and MAC/Bluetooth identifier in local device settings and sync it to the cloud.
- Adding/removing/changing a printer must sync while online; actual label printing can continue offline after a printer is already selected locally.
- If auth expires, continue offline and request login before next sync.
