# Phase 1 Plan

## Recommended Technical Stack

- Mobile app: React Native + Expo Development Build
- Language: TypeScript
- Local database: SQLite
- Barcode/QR scanning: camera-based scanning
- Printing: native bridge to Gprinter/Gainscha SDK, with TSPL/bitmap printing fallback
- Version control: GitHub

## Phase 1 Scope

### Must Have

- English UI
- Offline operation
- Local product database
- Product category list
- Product search
- Product images in the app
- Product detail screen
- Label preview screen
- Open date/time defaulting to current time
- Expiry date/time calculated from shelf-life rule
- Label quantity selection
- Product code scanning
- Bluetooth printer connection
- Print 60 x 40 mm labels
- Support 50 x 30 mm test labels
- Local company admin mode
- Simple local admin toggle/PIN
- Local outlet setup
- Outlet product sub-list selection
- Basic local PrintJob saving

### Should Have

- Simple print history list
- Import product seed data from Excel-derived JSON
- Edit product information locally
- Enable or disable products per outlet
- Basic backup/export option for local data

### Defer To Phase 2

- Web admin portal
- Cloud login
- Site admin role
- Company admin web role
- Outlet user cloud role
- Multi-company SaaS billing or subscription
- Cloud sync
- Advanced audit logs
- Apple App Store/TestFlight release

## Two-Week Working Plan

### Day 1

- Finalize label data fields
- Finalize label sizes
- Create project docs
- Initialize GitHub repository
- Create React Native project structure

### Day 2

- Define data model
- Convert sample Excel product list to seed data
- Build local SQLite schema

### Day 3

- Build product category and product list screens
- Add search and filtering
- Add product image support

### Day 4

- Build product detail screen
- Build open/expiry time calculation
- Build label preview screen

### Day 5

- Build outlet selection
- Build local company admin product maintenance
- Build outlet sub-list selection

### Day 6

- Add scanner flow using product code
- Add label quantity selection
- Prepare Bluetooth permission handling

### Day 7

- Integrate Android Bluetooth discovery and connection
- Create printer service abstraction

### Day 8

- Integrate Gprinter Android SDK or TSPL command printing
- Print first test labels once printer is available

### Day 9

- Refine label layout for 60 x 40 mm and 50 x 30 mm
- Test Chinese text output
- Fix printing issues

### Day 10

- Android device testing on Oppo phone
- Offline testing
- Prepare APK/internal build
- Write setup and handover notes

## Main Delivery Definition

Phase 1 is successful when an Android phone can open the app offline, scan or select a product, calculate the expiry date/time, connect to the M324F printer, and print correct adhesive labels.

