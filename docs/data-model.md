# Data Model

This document describes the planned data model. Phase 1 stores data locally in SQLite. Phase 2 should map the same model to PostgreSQL and cloud APIs.

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
- storageMethod
- imageUri
- active
- createdAt
- updatedAt

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

