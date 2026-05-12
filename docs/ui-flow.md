# UI Flow

## Design Direction

Use an Operational Clean + Image-First Tile UI.

The app is for central kitchen and outlet staff. The interface should be simple, fast, and difficult to misuse. Avoid decorative screens and keep the main path focused on finding a product and printing a correct label.

The app supports portrait mode only. Do not design a separate landscape layout for Phase 1.

## Primary Staff Flow

1. User opens the app.
2. User selects an outlet.
3. App opens the product grid for the selected outlet.
4. User finds a product by image, category, search, or scanning a product code.
5. User opens product detail.
6. Product detail shows label preview, quantity, and Print button directly.
7. User taps Print.
8. App saves a PrintJob and shows print result.

## Outlet Selection

After selecting an outlet, the app should navigate directly to the product grid.

The selected outlet controls:

- which products are visible
- whether a product can be printed
- which printer preference may be used later
- the outletId saved on PrintJob

## Product Grid

The product list is a small category-style list, not a large SKU catalog. The expected total count is less than 100 products.

The product grid should make visual recognition easy:

- product image
- English product name
- Chinese product name
- short storage tag

Recommended layout:

- 2 columns on narrower portrait phones
- 3 columns on larger portrait phones

Top controls:

- search field
- category chips or tabs
- scan button

Search should match:

- product code
- English name
- Chinese name
- category
- storage method

## Product Detail And Print

The Product Detail screen should include printing controls directly. It should not require a separate label preview page for Phase 1.

Recommended content order:

1. product image and names
2. storage method and shelf-life rule
3. warning or blocked-print reason if applicable
4. label preview
5. quantity selector, default 1
6. Print button

If the product cannot be printed, the Print button should be disabled and the reason should be shown clearly.

Quantity selector should support fast operation:

- default value is 1
- preset buttons such as 1, 2, 5, and 10
- plus/minus buttons for small adjustments
- numeric entry for uncommon quantities
- confirmation is required when quantity is greater than 5

## Admin Flow

Staff-facing screens should stay simple. Admin functions should be behind a local admin toggle/PIN.

Phase 1 local admin should allow:

- managing ProductCategory records
- managing Product records
- enabling/disabling products
- assigning products to outlet sub-lists
- configuring category product code prefixes
- configuring outlet short codes
- creating outlet custom product categories
- creating outlet custom products, such as meal box labels with names entered on the day

When changing a category product code prefix, the admin UI should offer:

- apply to future products only
- renumber existing products too

Renumbering existing products should show a warning, old/new code preview, conflict check, and explicit confirmation.

Phase 2 should move cloud-owned master data editing to server-backed admin screens. Offline devices should keep cached data for viewing and printing, but should not modify cloud-owned master data while offline.
