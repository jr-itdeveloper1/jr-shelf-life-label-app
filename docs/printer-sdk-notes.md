# Printer SDK Notes

## Target Printer

Printer model:

- Gprinter/Gainscha M324F

## Available SDK Material

Local SDK source folder:

```text
C:\Users\ShenJianhua\Documents\Projects\GPrinter-SDK
```

Observed top-level SDK folders:

- `Android`
- `IOS`
- `Java`
- `C#`
- `windows综合开发包`
- `微信小程序`
- `指令手册`
- `SDK（开发包）适用于PC，安卓，IOS，微信小程序`

The folder `SDK（开发包）适用于PC，安卓，IOS，微信小程序` appears to duplicate most of the top-level SDK material. Prefer using the simpler top-level paths during development.

## Observed Android Material

Important Android files:

- `Android\Printer_Android_SDK_190619.zip`
- `Android\PrintersdkDemo_中性_190419_无中性文档_非客户需求勿发.zip`
- `Android\GprinterDemoForAndroidV2(2019-9-7)(3).7z`
- `Android\TSC_Cordova_Android.zip`

Observed from `Printer_Android_SDK_190619.zip`:

- `Printer_Android_SDK/gprintersdkv1.jar`
- `Printer_Android_SDK/GpsdkDemo.rar`
- Android-specific command docs for TSC, ESC, and CPCL
- Gprinter SDK usage notes

Observed from `PrintersdkDemo_中性_190419_无中性文档_非客户需求勿发.zip`:

- `PrintersdkDemo/app/libs/printersdkv1.jar`
- `PrintersdkDemo/app/src/main/java/com/printersdk/demo/printerdemo/BluetoothDeviceList.java`
- `PrintersdkDemo/app/src/main/java/com/printersdk/demo/printerdemo/DeviceConnFactoryManager.java`
- `PrintersdkDemo/app/src/main/java/com/printersdk/demo/printerdemo/PrinterCommand.java`
- `PrintersdkDemo/app/src/main/java/com/printersdk/demo/printerdemo/MainActivity.java`
- native serial libraries under `PrintersdkDemo/app/src/main/jniLibs/`

The demo code should be treated as implementation reference only. Do not copy large SDK/demo packages into the app repository until SDK licensing and repository size are reviewed.

## Command Manuals

Observed command manuals:

- `指令手册\佳博标签打印机编程手册tspl  v1.0.8.pdf`
- `指令手册\佳博票据打印机编程手册esc v1.0.6.pdf`
- `指令手册\佳博面单打印机编程手册cpcl v1.0.3.pdf`
- `指令手册\ZPLII指令集中文编程手册.pdf`
- `指令手册\zpl-zbi2-pm-en.pdf`

For the M324F label printer, TSPL is the most relevant command set to review first.

## Printing Strategy

Preferred Phase 1 strategy:

- Build a cross-platform `PrinterService` interface
- Implement Android first
- Keep iOS implementation behind the same interface
- Use a mock printer implementation until the physical printer arrives

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

## This Week Before Printer Arrival

The printer is expected in about 7 days. Before it arrives, focus on:

- Android app project setup
- local SQLite schema and seed data
- product list, search, detail, and outlet filtering
- shelf-life calculation
- label preview
- scanner flow using product code
- `PrinterService` abstraction
- mock print flow that saves local PrintJob records

Avoid blocking app development on physical printer testing.

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

Recommended local-only path inside this app repo only if a small extracted subset is needed:

```text
vendor/gprinter-sdk/
```

Recommended `.gitignore` entry:

```text
vendor/gprinter-sdk/
```

Commit only integration notes and minimal wrapper code created by the project.
