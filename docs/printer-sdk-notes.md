# Printer SDK Notes

## Target Printer

Printer model:

- Gprinter/Gainscha M324F

## Available SDK Material

Local SDK source folder on the first computer:

```text
C:\Users\super\Documents\JR Group\OneDrive - Jr Foods Pte Ltd\Projects\Secondary Shelf Life Bar Code Chart\SDK（开发包）适用于PC，安卓，IOS，微信小程序
```

Observed SDK folders:

- Android
- iOS
- C#
- Java
- Windows package
- WeChat mini-program
- Command manuals

Observed Android material:

- `gprintersdkv1.jar`
- Android demo packages
- TSPL command documentation
- ESC command documentation
- CPCL command documentation

Observed iOS material:

- iOS demo project
- `GSDK.a`
- `BLEConnecter`
- `Connecter`
- `TscCommand`
- `EscCommand`

## Printing Strategy

Preferred Phase 1 strategy:

- Build a cross-platform `PrinterService` interface
- Implement Android first
- Keep iOS implementation behind the same interface

Suggested interface:

```ts
PrinterService.scan()
PrinterService.connect(deviceId)
PrinterService.printLabel(label)
PrinterService.disconnect()
```

## Chinese Text

The label includes Chinese product names and Chinese storage text.

To reduce printer font compatibility risk, prefer rendering the label as a bitmap in the app and printing the bitmap through the SDK.

Fallback:

- Generate TSPL commands directly
- Use printer text commands only if Chinese fonts render correctly on M324F

## TSPL Reference

The TSPL manual shows the basic structure:

```text
SIZE 58 mm,30 mm
GAP 2 mm
CLS
TEXT 50,50,"4",0,1,1,"DEMO FOR TEXT"
PRINT 1
```

Every command line should end with CRLF.

## Phase 1 Print Tests

When printer arrives:

1. Confirm Bluetooth pairing behavior
2. Confirm Android can discover printer
3. Confirm SDK connection works
4. Print plain English text
5. Print Chinese text
6. Print bitmap label
7. Test 60 x 40 mm
8. Test 50 x 30 mm
9. Test multiple copies
10. Test offline operation

## Repository Policy

Do not commit the full SDK package to GitHub until licensing and size are reviewed.

Recommended local-only path:

```text
vendor/gprinter-sdk/
```

Recommended `.gitignore` entry:

```text
vendor/gprinter-sdk/
```

Commit only integration notes and minimal wrapper code created by the project.

