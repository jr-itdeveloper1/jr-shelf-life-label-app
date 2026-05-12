# Data Model

This document describes the planned data model. Phase 1 stores data locally in SQLite. Phase 2 should map the same model to PostgreSQL and cloud APIs.

## Phase 1 Mobile Storage

On Android, Phase 1 app data should be stored inside the app's private sandbox storage.

Recommended storage split:

- SQLite database: structured offline data, including Company, Outlet, ProductCategory, Product, OutletProduct, LabelTemplate, PrinterDevice, and PrintJob.
- App document directory: local product image files copied from the device photo library or imported as local files.
- Bundled app assets: seed/demo product images shipped with the app.
- Secure local storage: admin PIN hash or other small sensitive settings, if a secure-storage library is available.

The SQLite database and app document files are local to the installed app. They are available offline, are not automatically uploaded to cloud services, and are normally removed if the app is uninstalled. Phase 2 cloud sync should explicitly upload/download selected records rather than relying on Android system storage.

## Company

Represents a customer company.

Fields:

- id
- name
- status
- createdAt
- updatedAt

Phase 1 may use a single local default company.

## Outlet

Represents a shop, central kitchen, or production point.

Fields:

- id
- companyId
- name
- code
- shortCode
- status
- createdAt
- updatedAt

Constraints:

- code should be unique within the same company.
- shortCode should be unique within the same company.
- shortCode should be 1 to 5 uppercase alphanumeric characters.
- Outlet custom product categories should use the outlet shortCode as their product code prefix.

## User

Represents a login user.

Fields:

- id
- companyId
- name
- email
- role
- status
- createdAt
- updatedAt

Phase 1 may not require cloud login. A local admin mode can be used instead.

## ProductCategory

Represents a product grouping.

Fields:

- id
- companyId
- outletId
- name
- codePrefix
- scope
- isCustom
- sortOrder
- status
- createdAt
- updatedAt

Recommended scope values:

- company
- outlet

Constraints:

- codePrefix should be 1 to 5 uppercase alphanumeric characters.
- codePrefix should be unique within the same company.
- Company master categories use company-defined prefixes.
- Outlet custom categories use the outlet shortCode as their prefix.
- Each outlet may have one default outlet custom category in Phase 1.

## Product

Represents an item that can be selected or scanned for label printing.

Fields:

- id
- companyId
- outletId
- categoryId
- productCode
- productSequence
- source
- nameEn
- nameZh
- daysToExpire
- hoursToExpire
- storageMethodEn
- storageMethodZh
- imageUri
- active
- createdAt
- updatedAt

Constraints:

- productCode must be unique within the same company.
- source should indicate whether the product is a company master product or an outlet custom product.
- outletId is required for outlet custom products and should be empty for company master products.
- daysToExpire must be a non-negative integer.
- hoursToExpire must be a non-negative integer.
- At least one of daysToExpire or hoursToExpire must be greater than 0.
- A product can be printed only when Product.active is true and the selected outlet's OutletProduct.active is true.
- If a product is blocked from printing, the app should show the reason.
- imageUri is optional. Products without an image remain usable and should use a text-focused fallback display with larger English and Chinese product names.

Product code generation:

- productCode = category codePrefix + 3-digit productSequence.
- Example: DAI001, NUT002, CK001.
- productSequence should start at 1 for each prefix and display as 001, 002, 003.
- The full productCode should normally stay within 8 characters.
- The generated productCode is stored on Product and should remain stable.
- Changing ProductCategory.codePrefix should default to future products only.
- If a category already has products, the admin may choose whether to keep existing productCode values or renumber existing products under the new prefix.
- Renumbering existing products must preview old/new product codes, check for conflicts, require explicit confirmation, and keep existing PrintJob.productCode snapshots unchanged.
- If a prefix reaches 999, the admin should create a new prefix or revise the code rule.

Outlet custom products:

- Outlet custom products are created under the outlet custom category.
- The outlet custom category should use the outlet shortCode as its codePrefix.
- Outlet custom products are visible only to that outlet unless a later sync rule explicitly shares them.
- Meal box labels with names entered on the day can be represented as outlet custom products.

Phase 1 image sources:

- bundled app assets
- device photo library
- local file URI

## OutletProduct

Represents the sub-list of products available to an outlet.

Fields:

- id
- outletId
- productId
- active
- createdAt
- updatedAt

## LabelTemplate

Represents label layout settings.

Fields:

- id
- companyId
- name
- widthMm
- heightMm
- dpi
- layoutJson
- active
- createdAt
- updatedAt

Initial templates:

- 60 x 40 mm
- 50 x 30 mm

Recommended Phase 1 layoutJson structure:

```json
{
  "version": 1,
  "canvas": {
    "widthMm": 60,
    "heightMm": 40,
    "dpi": 203,
    "paddingMm": 2
  },
  "elements": [
    {
      "id": "nameEn",
      "type": "text",
      "source": "product.nameEn",
      "xMm": 2,
      "yMm": 2,
      "widthMm": 56,
      "heightMm": 7,
      "fontSizePt": 12,
      "fontWeight": "bold",
      "align": "left",
      "maxLines": 1
    },
    {
      "id": "nameZhStorage",
      "type": "text",
      "source": "computed.nameZhStorage",
      "xMm": 2,
      "yMm": 10,
      "widthMm": 56,
      "heightMm": 7,
      "fontSizePt": 10,
      "fontWeight": "normal",
      "align": "left",
      "maxLines": 1
    },
    {
      "id": "openedAt",
      "type": "text",
      "source": "computed.openedAtLabel",
      "xMm": 2,
      "yMm": 21,
      "widthMm": 56,
      "heightMm": 6,
      "fontSizePt": 10,
      "fontWeight": "normal",
      "align": "left",
      "maxLines": 1
    },
    {
      "id": "expiresAt",
      "type": "text",
      "source": "computed.expiresAtLabel",
      "xMm": 2,
      "yMm": 29,
      "widthMm": 56,
      "heightMm": 6,
      "fontSizePt": 10,
      "fontWeight": "bold",
      "align": "left",
      "maxLines": 1
    }
  ]
}
```

The first implementation may hard-code rendering for the two templates, but it should keep this structure in mind so the layout can later become configurable.

## PrinterDevice

Represents a known Bluetooth printer.

Fields:

- id
- companyId
- outletId
- name
- model
- macAddress
- lastConnectedAt
- createdAt
- updatedAt

## PrintJob

Represents one print action.

Fields:

- id
- companyId
- outletId
- productId
- productCode
- labelTemplateId
- openedAt
- expiresAt
- quantity
- printerName
- printerAddress
- status
- errorMessage
- createdAt

Phase 1 should save a PrintJob for each print attempt, including failed attempts. A simple local history list is enough for Phase 1.

## Sync Direction For Phase 2

Cloud-owned:

- Company
- Outlet
- User
- ProductCategory
- Product
- OutletProduct
- LabelTemplate

In Phase 2, cloud-owned master data should be edited on server-backed admin screens only. Product and category edits should require network access and save directly to the server so devices remain consistent.

Device-owned then synced:

- PrintJob
- Known printer preference
- Local cache metadata

