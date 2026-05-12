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
- status
- createdAt
- updatedAt

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
- name
- sortOrder
- status
- createdAt
- updatedAt

## Product

Represents an item that can be selected or scanned for label printing.

Fields:

- id
- companyId
- categoryId
- productCode
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
- daysToExpire must be a non-negative integer.
- hoursToExpire must be a non-negative integer.
- At least one of daysToExpire or hoursToExpire must be greater than 0.
- A product can be printed only when Product.active is true and the selected outlet's OutletProduct.active is true.
- If a product is blocked from printing, the app should show the reason.

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

Device-owned then synced:

- PrintJob
- Known printer preference
- Local cache metadata

