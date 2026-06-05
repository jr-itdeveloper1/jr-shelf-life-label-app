# Codex Context

This file is a handoff note for future Codex sessions working on the JR Shelf Life Labels app. Read this first when opening the project in a new thread.

## Current Project Path

Preferred working path:

```powershell
C:\Projects\jr-shelf-life-label-app
```

The project was moved from:

```powershell
C:\Users\ShenJianhua\Documents\Projects\jr-shelf-life-label-app
```

Use the new `C:\Projects` path for development, builds, APK generation, and testing.

## Product Goal

JR Shelf Life Labels is an Android-first mobile app for central kitchen and outlet staff. It helps staff quickly select an outlet, choose a product/category, preview a shelf-life label, and print it on a Bluetooth label printer.

The app is designed for operational use in kitchens and outlets: simple, portrait-only, easy to scan, and fast enough for repeated label printing.

## Target Users

- Central kitchen staff preparing shared product data and labels.
- Outlet staff printing shelf-life labels during daily operations.
- Admin users managing local products, categories, outlets, outlet product visibility, printers, and data import/export.

## Technology Stack

- React Native / Expo app.
- Android native module for Bluetooth printer support.
- TypeScript.
- Local data stored on device, using Expo/React Native storage and local app state patterns already in the codebase.
- Native Android build is required for printer support. Expo Go cannot include the custom Bluetooth printer module.

Key commands:

```powershell
npm.cmd run typecheck
npm.cmd run android
npx expo start --dev-client
```

## Important Android Build Note

After moving the project to `C:\Projects`, Android builds failed once with errors like:

```text
Invalid empty classfile
expo-modules-core ... classes.jar
```

Cause: old copied Gradle/native build artifacts or Gradle build cache restored damaged class files.

Fix used successfully:

1. Clean project build artifacts such as:
   - `android\.gradle`
   - `android\build`
   - `android\app\build`
   - `node_modules\expo-modules-core\android\build`
   - related native module `android\build` folders

2. Rebuild without Gradle build cache:

```powershell
cd C:\Projects\jr-shelf-life-label-app\android
.\gradlew.bat --no-build-cache --rerun-tasks app:installDebug -x lint -x test -PreactNativeDevServerPort=8081 '-PreactNativeArchitectures=arm64-v8a,armeabi-v7a' --console=plain
```

This installed successfully on the connected Oppo phone.

## App Flow

Main user flow:

1. Landing screen: select outlet.
2. Choose category screen: shows categories in compact pastel/color-coded cards. Bottom nav still includes History and Admin.
3. Product page: shows products for the selected outlet/category. Supports regular and compact view mode.
4. Product detail page: shows product info, label preview, quantity selector, and print button.
5. History screen: shows what was printed, time, and quantity.
6. Admin area: hidden behind admin access/PIN.

Admin flow includes:

- Product categories.
- Products.
- Outlets.
- Outlet product list visibility.
- Printers.
- Import/export data.

## UI Direction

Chosen style: Operational Clean + Image-First / compact operational UI.

Important UI decisions:

- Portrait only, no landscape version.
- Simple kitchen-worker-friendly screens.
- Product list can switch between regular and compact modes.
- Compact product mode prioritizes seeing many products at once.
- Regular mode can show product images and richer information.
- Category cards use pastel/basic colors. White category needs a grey border in user-facing category selection so it does not blend into the background.
- Product category filters were simplified: users choose category first, then enter product list; product page has a Change Category button.
- Bottom buttons must avoid Android system navigation overlap.
- Sticky top back headers are preferred on scrollable admin/detail screens.

## App Icon

The selected app icon is the red printer/check design, based on Option A Printer Crimson.

Updated assets:

- `assets/icon.png`
- `assets/adaptive-icon.png`
- `assets/splash-icon.png`
- `assets/app-icon-option-a-preview.png`

The color is inspired by JR Group red, adjusted to look good as an app icon.

## Label Printing Rules

Product normal label:

- Size: 60 x 40 mm.
- Includes product name, Chinese name, storage tag, OPEN time, and USE BY time.

Product compact label:

- Current size: 40 x 20 mm.
- Should preview and print at this size.
- Format:

```text
OPEN  : DD/MM/YY HH:MM
USE BY: DD/MM/YY HH:MM
```

- OPEN and USE BY should include both date and time.
- USE BY is calculated from current/open time plus the product shelf life.
- Compact label should keep text clear, bold enough, aligned, and not truncated.

Timestamp label:

- Separate feature after outlet selection.
- Current intended size from prior iterations: 40 x 30 mm.
- Prints date/time only, depending on the timestamp screen implementation.

General label notes:

- Avoid decorative borders in actual printing if they create unwanted visible lines.
- Text must fit within the physical label dimensions.
- Printer output clarity matters more than preview aesthetics.

## Printer Integration

Printer support is through a native Android Bluetooth module, not Expo Go.

Important points:

- The app must run as a native/dev-client APK or release APK to print.
- Expo Go cannot include the custom Bluetooth printer module.
- Admin > Printers should show connected/paired printer-like devices, not unrelated Bluetooth items when possible.
- If multiple printers are connected/paired, admin should be able to select the preferred printer.
- The selected printer should be remembered.
- After printing, avoid success popups; only show error feedback when print fails.
- Prior issue: sometimes the first print after opening via QR/dev server failed. Native installed app is preferred over Expo Go/QR for printer testing.

## Data/Product Rules

Important business rules already discussed:

- Product code should be unique within a company by default.
- Product code can use category prefix + auto-increment number.
- Custom outlet categories can use outlet prefix to avoid code collisions.
- Category prefix changes should not automatically rewrite existing product codes unless admin chooses to update existing products.
- Product.active and OutletProduct.active must both be true for a product to be printable/visible for that outlet.
- If product cannot be printed, the UI should explain the reason.
- Products may have images, but active products without images are allowed, especially daily items such as bento/meal products.
- No-image product UI should avoid repeating name text awkwardly.

## Data Import/Export

Admin import/export has been added.

Expected export should include operational data such as:

- Products.
- Product names.
- Product codes.
- Categories.
- Tags/storage methods.
- Outlets.
- Outlet product visibility/list data.
- Related admin-maintained local data where implemented.

There are release APK variants:

- With products.
- Empty-products version: keeps categories but has zero products under each category.

## Existing APK Outputs

Previous APK outputs were placed under `dist` in the project. Names may include dates such as:

- `jr-shelf-life-label-app-android-release-2026-06-04.apk`
- `jr-shelf-life-label-app-android-empty-products-2026-06-04.apk`

Both APKs use the same Android package name, so only one can be installed at a time. Installing one replaces the other.

## Git/GitHub

The project is connected to GitHub. Moving the folder does not break Git as long as the `.git` folder moved with it.

Useful checks:

```powershell
git status
git remote -v
```

Do not assume changes are automatically uploaded. Commit and push manually when ready.

## Development Preferences

- Read existing code patterns before changing files.
- Keep UI operational and compact rather than decorative.
- Use focused changes; avoid unrelated refactors.
- Preserve user-made changes and generated output unless explicitly asked to remove them.
- For Android build failures, check stale build artifacts/cache before changing source code.
- For app icon, printer module, and other native changes, rebuild/install native app; Metro refresh alone is not enough.
