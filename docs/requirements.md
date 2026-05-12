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
- Storage method
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
- Storage Method

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

Phase 2:

- Site admin
- Company admin
- Outlet user

