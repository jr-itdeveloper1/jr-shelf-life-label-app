# JR Shelf Life Label App - Project Brief

## Purpose

Build a mobile application for central kitchen and outlet teams to print secondary shelf-life adhesive labels for opened food products.

The label must show the product name, Chinese name, storage condition, opening date/time, and expiry date/time. The app must support offline use and Bluetooth printing to Gprinter/Gainscha M324F portable label printers.

## Phase 1 Goal

Deliver an Android-first offline mobile app within two weeks.

Phase 1 focuses on:

- Offline product list
- Product categories
- Product search
- Product images in the app
- Product code scanning
- Shelf-life calculation
- Label preview
- Bluetooth label printing
- Local company admin mode
- Local outlet selection and outlet product sub-list

iOS will share the same UI and business logic where possible, but iOS Bluetooth printing and real-device validation are expected after Apple build requirements are available.

## Phase 2 Goal

Build the web platform and cloud sync layer.

Phase 2 focuses on:

- Site admin web portal
- Company admin web portal
- Outlet user accounts
- Company master product list
- Outlet product sub-lists
- Cloud sync
- Multi-company SaaS structure
- Audit logs and print history
- Central image management
- Role-based access control

## Target Users

- Company admin
- Outlet manager or outlet user
- Central kitchen user
- Site admin for SaaS platform operation

## Initial Repository

GitHub repository:

https://github.com/jr-jhshen/jr-shelf-life-label-app

## Key Constraints

- Phase 1 timeline: approximately two weeks
- Android is the first production target
- The printer will arrive around six days after initial planning
- App must work without network access
- Product images are shown in the app only and are not printed
- Phase 1 product images may come from bundled app assets, the device photo library, or local file URIs
- QR/barcode scan value is the product code
- Product codes are unique within the same company
- Main label size is 60 x 40 mm
- Secondary test label size is 50 x 30 mm

