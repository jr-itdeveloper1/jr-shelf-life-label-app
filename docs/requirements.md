# Product Requirements

## App Language

Primary interface language: English.

Chinese interface is optional for a later phase.

Product Chinese names and storage condition Chinese text must be printable.

## Product Data

Each product should support:

- Product code
- Product name in English
- Product name in Chinese
- Category
- Days to expire
- Hours to expire
- Storage method in English
- Storage method in Chinese
- Product image
- Active/inactive status
- Company ownership
- Outlet availability

Initial sample fields from Excel:

- Product Code
- Product Name (Eng)
- Product Name (Chinese)
- Days to Expire
- Hours to Expire
- Storage Method (English)
- Storage Method (Chinese)

Recommended app fields:

- `storageMethodEn`
- `storageMethodZh`

This keeps Phase 1 simple while allowing future multi-language UI and print formatting.

Validation rules:

- `Product Code` must be unique within the same company.
- `Days to Expire` must be a non-negative integer.
- `Hours to Expire` must be a non-negative integer.
- At least one of `Days to Expire` or `Hours to Expire` must be greater than 0.
- A product can be printed only when `Product.active = true` and the selected outlet's `OutletProduct.active = true`.
- If a product cannot be printed, the app must show the reason, such as inactive product, unavailable for the selected outlet, or invalid shelf-life rule.

## Label Content

Labels should print approximately four lines:

1. Item name in English
2. Chinese name and storage condition
3. Open date/time
4. Expiry date/time

Example:

```text
Pasteurized Liquid Egg
巴氏杀菌蛋液 | Chilled 冷藏
OPEN: 12 May 2026 14:30
EXP: 13 May 2026 14:30
```

## Label Sizes

Primary size:

- 60 x 40 mm

Test size:

- 50 x 30 mm

## Printing Requirements

- Print through Bluetooth
- Target printer: Gprinter/Gainscha M324F
- Support printing 1 or multiple copies
- Support Chinese text output
- Product images are not printed

Recommended print strategy:

- Render label as an image/bitmap in the app
- Send the rendered bitmap to the printer SDK
- This avoids dependency on printer built-in Chinese fonts

## Scanning Requirements

- Scan barcode or QR code
- Scanned value equals Product Code
- Matching product opens directly in product detail or print flow

## Offline Requirements

The app must work without network access for:

- Viewing products
- Viewing product images
- Searching products
- Scanning product codes
- Calculating expiry date/time
- Printing labels
- Creating or editing local products
- Managing local outlet sub-lists
- Saving print history locally

Phase 1 should save a basic local `PrintJob` record for each print attempt. A simple print history list is acceptable for Phase 1.

## Outlet Requirements

Future structure:

- Company has one master product list
- Outlet selects products from company master list
- Outlet users only see their allowed outlet list
- A user with multiple outlet access must choose an outlet before printing

Phase 1 local structure:

- Local company admin mode
- Local outlet records
- Local outlet product sub-lists
- No cloud login required

## Role Direction

Phase 1:

- Local company admin mode
- Simple local admin toggle/PIN to avoid accidental product and outlet configuration changes

Phase 2:

- Site admin
- Company admin
- Outlet user
