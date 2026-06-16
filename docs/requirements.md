# Product Requirements

## App Language

Primary interface language: English.

Chinese interface is optional for a later phase.

Product Chinese names and storage condition Chinese text must be printable.

## Device Orientation

Phase 1 supports portrait mode only.

The app should not provide a landscape layout. This keeps the staff workflow, visual layout, and label preview behavior consistent across devices.

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
- Product image, optional but recommended
- Active/inactive status
- Company ownership
- Outlet availability
- Product source, such as company master product or outlet custom product

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
- Product image is optional. If no image is available, the app should use a text-focused fallback layout with larger English and Chinese product names.

## Product Code Rules

Product codes should be short, scannable, stable, and unique within the same company.

Recommended format:

```text
<prefix><sequence>
```

Rules:

- `prefix` should be 1 to 5 uppercase alphanumeric characters.
- `sequence` should be a 3-digit zero-padded number, such as `001`, `002`, `010`.
- The full product code should normally stay within 8 characters.
- Product category prefixes must be unique within the company.
- Outlet codes must be unique within the company.
- Product codes should use the selected category prefix, not an outlet short-code prefix.

Examples:

```text
DAI001
NUT002
CK001
ORC010
```

For company-controlled product categories, the company admin defines the category prefix.

For outlet custom products, each outlet may have its own custom category. The custom category uses the outlet short code as its prefix so products created by different outlets do not collide.

Category prefixes are used to generate product codes. When an admin changes a category prefix, the app should offer two choices:

- Apply the new prefix to future products only.
- Apply the new prefix to existing products in that category as well.

The default should be future products only, because stable product codes are safer for scanning, print history, and already printed labels.

If the admin chooses to update existing product codes, the app must:

- show a clear warning that existing barcodes or QR codes may no longer match
- show how many products will be changed
- preview old and new product codes before saving
- check for product code conflicts before applying changes
- require explicit confirmation
- keep old PrintJob records with their original productCode snapshot

If a prefix reaches `999`, the admin should create a new prefix or adjust the code rule before adding more products under that prefix.

## Outlet Custom Products

Some outlets need to print labels for items that are not fully controlled by headquarters, such as meal boxes whose names are entered on the day of production.

Phase 1 should support outlet custom products:

- Each outlet may have a custom product category.
- Outlet custom products are visible only to that outlet unless explicitly shared later.
- Outlet staff or local admin can create custom products in the outlet custom category.
- The product name can be entered locally.
- Shelf-life fields, storage method, and image should still follow the normal product validation rules.
- Outlet custom product codes are generated using the outlet custom category prefix plus the next sequence number.

Phase 2 should allow headquarters to provide default templates while preserving outlet-owned custom products where business rules allow it.

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

## Product Finding Requirements

The product list is not a large SKU catalog. It is a small category-style product list, such as milk, nuts, sauce, frozen items, and chilled items. The expected total count is less than 100 products.

The main product finding method should be:

- image-first product grid
- search by product code, English name, Chinese name, and category
- category chips or tabs
- scan button for product code lookup
- recent or frequently printed products if useful

The product grid should adapt to portrait screen width:

- 2 columns on narrower phones
- 3 columns on larger phones

Each product tile should show:

- product image
- English name
- Chinese name
- short storage tag, such as `Chilled 冷藏`

If a product image is missing, the product tile should remain usable and show the English and Chinese product names more prominently in the image area.

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

## Print Flow Requirements

After selecting an outlet, the app should open the product grid.

The product detail screen should include the print flow directly:

- product image and basic information
- shelf-life rule
- label preview
- quantity selector, defaulting to 1
- primary Print button

A separate label preview screen is not required for Phase 1 unless the layout becomes too crowded.

Quantity selection should support quick operation:

- default quantity is 1
- preset quantity buttons, such as `1`, `2`, `5`, and `10`
- plus/minus buttons for small adjustments
- direct numeric entry for uncommon quantities
- confirmation is required when quantity is greater than 5

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
- Managing local product categories
- Managing local outlet sub-lists
- Creating and printing outlet custom products
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
- Local outlet short codes
- Local outlet product sub-lists
- Local outlet custom product category
- No cloud login required

## Admin Requirements

Phase 1 local admin mode should support basic local data maintenance:

- create, edit, and delete ProductCategory records
- create, edit, and delete Product records
- enable or disable products
- assign products to outlet sub-lists
- configure category product code prefixes
- configure outlet short codes

Admin functions should be protected by a simple local admin toggle/PIN to avoid accidental changes by staff users.

Phase 2 cloud admin mode should move company master product and category maintenance to the server:

- company master product/category changes require network access
- changes are saved directly to the server
- devices sync from the server to keep outlet data consistent
- offline devices should continue printing from cached data, but should not edit cloud-owned master data while offline
- outlet custom products may remain outlet-owned or sync as outlet-owned records, depending on final business rules

## Role Direction

Phase 1:

- Local company admin mode
- Simple local admin toggle/PIN to avoid accidental product and outlet configuration changes

Phase 2:

- Site admin
- Company admin
- Outlet user
