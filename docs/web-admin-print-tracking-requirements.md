# Printer And Print Analytics Requirements

本文档整理最新需求：记录每个 app 连接过的打印机名称/MAC Address，并记录每次打印的 label type，方便按 outlet 和月份统计不同 sticker 的总打印量。

## Goals

1. Company Admin can see which printer each Android app device is using.
2. Support team can trace print issues by outlet, app device, printer name, and MAC/Bluetooth identifier.
3. PrintJob data can be grouped by outlet, month, label type, and label size.
4. Company Admin can see monthly sticker totals per outlet.

## Mockup References

- [Devices & Printers](website-mockups/food-safety-compliance/company-devices-printers.html)
- [Print Analytics](website-mockups/food-safety-compliance/company-print-analytics.html)
- [Outlet Detail](website-mockups/food-safety-compliance/company-outlet-detail.html)
- [Company Dashboard](website-mockups/food-safety-compliance/company-dashboard.html)

## Device Printer Registry

Create or extend a `Device` table.

Recommended fields:

- `id`
- `companyId`
- `outletId`
- `deviceName`
- `platform`
- `appVersion`
- `deviceIdentifier`
- `printerName`
- `printerMacAddress`
- `printerBluetoothId`
- `lastPrinterConnectedAt`
- `lastSyncedAt`
- `status`
- `createdAt`
- `updatedAt`

Rules:

- Mobile app updates this record during sync.
- Company Admin can view device/printer records.
- Company Admin may assign outlet or mark a device inactive.
- Printer name and MAC/Bluetooth identifier should not be manually overwritten unless there is a support/admin reason.
- If Android cannot expose MAC address, store Bluetooth identifier plus printer display name.

## PrintJob Reporting Fields

Extend `PrintJob` to include:

- `labelType`: `product`, `compact_product`, `timestamp`
- `labelSize`: `60x40`, `40x20`, `40x30`
- `quantity`
- `printerName`
- `printerMacAddress`
- `printerBluetoothId`
- `deviceId`
- `deviceName`
- `printedAt`
- `uploadStatus`

Rules:

- Save these fields locally before printing/uploading.
- Upload PrintJob idempotently using `clientJobId`.
- Keep PrintJob snapshots unchanged if product, outlet, or printer names change later.
- `quantity` is the sticker count for reporting.

## Label Type Definitions

| Label Type | Label Size | Meaning |
| --- | --- | --- |
| `product` | `60x40` | Standard product shelf-life label. |
| `compact_product` | `40x20` | Compact product label. |
| `timestamp` | `40x30` | Timestamp-only label. |

If new sticker formats are added later, add a new `labelType` and `labelSize` instead of overloading old values.

## Monthly Sticker Totals

Analytics grouping:

- company
- outlet
- month from `printedAt`
- labelType
- labelSize

Metric:

- `SUM(quantity)` as total stickers

Example report columns:

- Outlet
- Product 60x40
- Compact 40x20
- Timestamp 40x30
- Total Stickers
- Top Printer

## Backend Implementation Notes

PostgreSQL indexes:

```sql
CREATE INDEX print_jobs_company_outlet_month_idx
ON print_jobs (company_id, outlet_id, printed_at);

CREATE INDEX print_jobs_label_type_idx
ON print_jobs (company_id, label_type, label_size);

CREATE INDEX devices_company_outlet_idx
ON devices (company_id, outlet_id, status);
```

Prisma can represent monthly grouping with raw SQL or a reporting query service. For large data later, consider a monthly aggregate table.

## Frontend Implementation Notes

Devices & Printers page:

- Search by outlet, device, printer name, MAC/Bluetooth identifier.
- Status filter dropdown: all, active, offline, needs setup, inactive.
- Show connected printer count and company maximum printer connections; maximum can be limited or unlimited.
- Export printer registry as XLSX when export is implemented for this page.

Print Analytics page:

- Month selector.
- Outlet filter.
- Label type filter.
- Monthly totals table.
- Export monthly report as XLSX.
- Drilldown link to detailed print jobs can be added after v1.

## Acceptance Criteria

- A synced app device appears in Devices & Printers with selected printer name and MAC/Bluetooth identifier.
- Outlet Detail recent print jobs show Label Type, Printer, and MAC Address.
- Print Analytics shows monthly totals by outlet and label type.
- Exported monthly report includes outlet, label type columns, total sticker quantity, and top printer.
- Existing mobile offline printing still works even when printer metadata cannot be uploaded immediately.
