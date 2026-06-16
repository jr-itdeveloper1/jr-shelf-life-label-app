# UI Page Structure And Wireframes

## Design Principles

- Portrait only.
- Operational Clean + Image-First Tile UI.
- Staff flow should stay short: select outlet, find product, print.
- Admin features stay behind PIN.
- Product images are optional but recommended. If missing, product tiles and product detail should use a text-focused fallback with larger English and Chinese names.
- Product Detail includes label preview, quantity, and Print button directly.

## Navigation Structure

```text
App Start
  -> Outlet Selection
     -> Staff Home / Product Grid
        -> Product Detail + Print
           -> Quantity > 5 Confirmation
           -> Print Result
        -> Scanner
        -> Print History
        -> Admin PIN
           -> Admin Home
              -> Product Categories
                 -> Category Detail / Edit
                 -> Prefix Change Preview
              -> Products
                 -> Product Detail / Edit
                 -> Image Picker
              -> Outlets
                 -> Outlet Detail / Edit
              -> Outlet Custom Products
                 -> Custom Product Detail / Edit
```

## Staff Screens

### 1. Outlet Selection

Purpose: choose the active outlet before printing.

```text
+------------------------------+
| JR Shelf Life Labels         |
| Select Outlet                |
+------------------------------+
| Search outlet                |
+------------------------------+
| Central Kitchen       CK     |
| Orchard Outlet        ORC    |
| Tampines Outlet       TMP    |
| Marina Outlet         MAR    |
+------------------------------+
| Admin                        |
+------------------------------+
```

Notes:

- Selecting an outlet navigates directly to Product Grid.
- Outlet code is visible for identification; product codes are generated from category prefixes.
- Admin entry is secondary and should not distract staff.

### 2. Product Grid

Purpose: find products quickly by image, category, search, or scan.

```text
+------------------------------+
| Orchard Outlet        Scan   |
| Search product/code          |
+------------------------------+
| All Dairy Nuts Sauce Custom  |
+------------------------------+
| +----------+ +----------+    |
| |  image   | |  image   |    |
| | Milk     | | Nuts     |    |
| | nameZh   | | nameZh   |    |
| | Chilled  | | Ambient  |    |
| +----------+ +----------+    |
| +----------+ +----------+    |
| |  image   | |  image   |    |
| | Bento    | | Sauce    |    |
| | nameZh   | | nameZh   |    |
| | Custom   | | Chilled  |    |
| +----------+ +----------+    |
+------------------------------+
| Products | History | Admin   |
+------------------------------+
```

Notes:

- Narrow portrait phones use 2 columns.
- Larger portrait phones may use 3 columns.
- Custom category appears like other categories, but may have a small `Custom` tag.
- Search should match code, English name, Chinese name, category, and storage method.

### 3. Product Detail + Print

Purpose: show product, preview label, choose quantity, print.

```text
+------------------------------+
| < Products                   |
+------------------------------+
| +------+ Pasteurized Egg     |
| |image | nameZh              |
| +------+ Code: DAI001        |
| Chilled / storageZh          |
| Shelf life: 1 day 0 hours    |
+------------------------------+
| Label Preview                |
| +--------------------------+ |
| | Pasteurized Egg          | |
| | nameZh | Chilled nameZh  | |
| | OPEN: 12 May 2026 14:30  | |
| | EXP: 13 May 2026 14:30   | |
| +--------------------------+ |
+------------------------------+
| Quantity                     |
| [1] [2] [5] [10] [-] 1 [+] |
|                              |
| Print                        |
+------------------------------+
```

Notes:

- Quantity defaults to 1.
- Presets are 1, 2, 5, and 10.
- Direct number input is available by tapping the quantity value.
- If quantity is greater than 5, show confirmation before printing.
- If product cannot be printed, disable Print and show the reason above the button.

### 4. Quantity Confirmation

Purpose: prevent accidental high-volume printing.

```text
+------------------------------+
| Confirm Quantity             |
+------------------------------+
| Print 8 labels?              |
|                              |
| Product: Pasteurized Egg     |
| Outlet: Orchard Outlet       |
|                              |
| Cancel            Print 8    |
+------------------------------+
```

### 5. Scanner

Purpose: scan barcode or QR code, then open product detail.

```text
+------------------------------+
| < Products        Manual     |
+------------------------------+
|                              |
|      +--------------+        |
|      |              |        |
|      | Scan frame   |        |
|      |              |        |
|      +--------------+        |
|                              |
| Scan product code            |
+------------------------------+
```

Notes:

- If matched, open Product Detail.
- If not matched, show `Product code not found`.
- If matched but blocked for selected outlet, show blocked reason.

### 6. Print Result

Purpose: clear feedback after a print attempt.

```text
+------------------------------+
| Print Complete               |
+------------------------------+
| Pasteurized Egg              |
| Quantity: 2                  |
| Printer: M324F               |
| Time: 12 May 2026 14:30      |
+------------------------------+
| Print Again                  |
| Back to Products             |
+------------------------------+
```

### 7. Print History

Purpose: simple local print history.

```text
+------------------------------+
| Print History                |
+------------------------------+
| Search history               |
+------------------------------+
| Pasteurized Egg        OK    |
| DAI001 | Qty 2 | 14:30       |
|                              |
| Bento Rice             OK    |
| ORC001 | Qty 6 | 13:20       |
|                              |
| Milk                   Fail  |
| DAI002 | Qty 1 | 10:05       |
+------------------------------+
```

## Admin Screens

### 8. Admin PIN

Purpose: prevent accidental staff edits.

```text
+------------------------------+
| Admin Access                 |
+------------------------------+
| Enter PIN                    |
| * * * _                      |
|                              |
| 1 2 3                        |
| 4 5 6                        |
| 7 8 9                        |
|   0                          |
+------------------------------+
```

### 9. Admin Home

Purpose: route to local maintenance tools.

```text
+------------------------------+
| Admin                        |
+------------------------------+
| Product Categories           |
| Products                     |
| Outlets                      |
| Outlet Product Lists         |
| Printers                     |
| Backup / Export              |
+------------------------------+
```

### 10. Product Category List

Purpose: manage categories and code prefixes.

```text
+------------------------------+
| Product Categories      +    |
+------------------------------+
| Search category              |
+------------------------------+
| Dairy                  DAI   |
| 12 products | Active         |
|                              |
| Nuts                   NUT   |
| 8 products | Active          |
|                              |
| Orchard Custom         ORC   |
| 4 products | Outlet custom   |
+------------------------------+
```

### 11. Category Detail / Edit

Purpose: create/edit category, prefix, scope.

```text
+------------------------------+
| < Categories          Save   |
+------------------------------+
| Name                         |
| [Dairy                    ]  |
|                              |
| Code Prefix                  |
| [DAI                      ]  |
|                              |
| Scope                        |
| [Company] [Outlet Custom]    |
|                              |
| Status                       |
| [Active toggle]              |
|                              |
| Products in category: 12     |
+------------------------------+
```

Prefix change behavior:

```text
+------------------------------+
| Prefix Changed               |
+------------------------------+
| Apply prefix change to:      |
|                              |
| (*) Future products only     |
| ( ) Existing and future      |
|                              |
| Existing products: 12        |
| Continue                     |
+------------------------------+
```

Renumber preview:

```text
+------------------------------+
| Renumber Products            |
+------------------------------+
| 12 products will change.     |
| Existing barcodes may fail.  |
+------------------------------+
| DAI001 -> DRY001             |
| DAI002 -> DRY002             |
| DAI003 -> DRY003             |
+------------------------------+
| Cancel       Confirm Change  |
+------------------------------+
```

### 12. Product Management List

Purpose: manage product records and show products with or without images.

```text
+------------------------------+
| Products                +    |
+------------------------------+
| Search product/code          |
| All | Dairy | Nuts | Custom  |
+------------------------------+
| +----+ Pasteurized Egg       |
| |img | DAI001 | Active       |
| +----+ Chilled / storageZh   |
|                              |
| +----+ Bento Rice            |
| |img | ORC001 | Custom       |
| +----+ Chilled / storageZh   |
|                              |
| +----+ Sauce                 |
| |text| SAU002 | No image     |
| +----+ Large name fallback   |
+------------------------------+
```

### 13. Product Detail / Edit

Purpose: create/edit product with optional image and shelf-life fields.

```text
+------------------------------+
| < Products            Save   |
+------------------------------+
| Product Image                |
| +--------------------------+ |
| | image preview            | |
| +--------------------------+ |
| [Gallery] [Camera] [Assets]  |
+------------------------------+
| Category *                   |
| [Dairy                    v] |
|                              |
| Product Code                 |
| DAI001  Auto-generated       |
|                              |
| English Name *               |
| [Pasteurized Egg          ]  |
| Chinese Name                 |
| [nameZh                   ]  |
|                              |
| Storage Method               |
| [Chilled                  ]  |
| [storageZh                ]  |
|                              |
| Shelf Life                   |
| Days [1]   Hours [0]         |
|                              |
| Active [toggle]              |
+------------------------------+
```

Notes:

- Image is optional. If missing, staff-facing tiles and detail screens use larger product names in the image area.
- Product Code is generated from category prefix and next sequence.
- For existing products, Product Code should be read-only unless admin starts a controlled renumber flow.
- Days and hours must be non-negative integers, and at least one must be greater than 0.

### 14. Outlet Custom Product Detail / Edit

Purpose: allow outlet-owned items such as daily meal boxes.

```text
+------------------------------+
| < Custom Products     Save   |
+------------------------------+
| Outlet: Orchard Outlet       |
| Category: Orchard Custom     |
| Code: ORC003 Auto-generated  |
+------------------------------+
| Product Image                |
| [Choose image]               |
|                              |
| English Name *               |
| [Bento Rice Set           ]  |
| Chinese Name                 |
| [nameZh                   ]  |
|                              |
| Storage Method               |
| [Chilled                  ]  |
| [storageZh                ]  |
|                              |
| Shelf Life                   |
| Days [0]   Hours [6]         |
|                              |
| Active [toggle]              |
+------------------------------+
```

### 15. Outlet List / Detail

Purpose: manage local outlets and short codes.

```text
+------------------------------+
| Outlets                 +    |
+------------------------------+
| Central Kitchen       CK     |
| Orchard Outlet        ORC    |
| Tampines Outlet       TMP    |
+------------------------------+
```

```text
+------------------------------+
| < Outlets             Save   |
+------------------------------+
| Name                         |
| [Orchard Outlet           ]  |
| Code                         |
| [OUT-ORCHARD              ]  |
| Short Code                   |
| [ORC                      ]  |
|                              |
| Custom Category              |
| Orchard Custom | ORC         |
|                              |
| Active [toggle]              |
+------------------------------+
```

## Component Inventory

- `AppHeader`
- `SearchField`
- `CategoryChipBar`
- `ProductTile`
- `ProductImagePicker`
- `LabelPreview`
- `QuantitySelector`
- `ConfirmDialog`
- `StatusBadge`
- `AdminPinPad`
- `FormTextField`
- `FormNumberField`
- `FormSelect`
- `FormToggle`
- `EmptyState`
- `BlockedReasonBanner`

## Default Field Behavior

- Product image: optional but recommended; missing image uses large-name fallback.
- Quantity: default 1, presets 1/2/5/10, confirmation above 5.
- Product Code: generated on create; read-only during normal edit.
- Category prefix change: default future products only; optional renumber with preview and confirmation.
- Outlet custom product: uses outlet short code prefix.
- PrintJob: save the productCode snapshot at print time.
