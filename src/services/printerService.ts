import * as SecureStore from 'expo-secure-store';
import { NativeModules, PermissionsAndroid, Platform } from 'react-native';
import type { Permission } from 'react-native';

import type { LabelBitmapFile } from './labelBitmap';

export type BluetoothPrinterDevice = {
  id: string;
  name: string;
  address: string;
  bluetoothClass?: number;
  majorDeviceClass?: number;
};

export type PreferredBluetoothPrinter = {
  name?: string;
  address: string;
};

const preferredPrinterStorageKey = 'jr-shelf-life-preferred-printer-v1';
const hiddenPrinterStorageKey = 'jr-shelf-life-hidden-printers-v1';

type NativePrintResult = {
  status: 'printed';
  printerAddress?: string;
};

type GPrinterBluetoothNativeModule = {
  getPairedPrinters: () => Promise<BluetoothPrinterDevice[]>;
  connect: (address: string) => Promise<boolean>;
  disconnect: () => Promise<boolean>;
  printBitmap: (options: {
    bitmapUri: string;
    quantity: number;
    labelWidthMm: number;
    labelHeightMm: number;
    bitmapWidthPx: number;
    bitmapHeightPx: number;
  }) => Promise<NativePrintResult>;
};

export type PrintLabelBitmapRequest = {
  bitmap: LabelBitmapFile;
  quantity: number;
};

export type PrintLabelBitmapResult = {
  status: 'printed';
  bitmapUri: string;
  printerName?: string;
  printerAddress?: string;
};

export async function printLabelBitmap({ bitmap, quantity }: PrintLabelBitmapRequest): Promise<PrintLabelBitmapResult> {
  if (Platform.OS !== 'android') {
    throw new Error('Bluetooth label printing is currently available on Android only.');
  }

  const gPrinterBluetooth = getGPrinterBluetoothModule();

  await requestBluetoothPrinterPermissions();

  const printers = filterSupportedBluetoothPrinters(await gPrinterBluetooth.getPairedPrinters());
  const preferredPrinter = await getPreferredBluetoothPrinter();
  const selectedPrinter = selectPreferredPrinter(printers, preferredPrinter?.address);

  if (!selectedPrinter) {
    throw new Error('No supported Bluetooth label printer found. Pair the GPrinter in Android Bluetooth settings first.');
  }

  const printResult = await printWithFreshConnection(gPrinterBluetooth, selectedPrinter.address, {
    bitmapUri: bitmap.uri,
    quantity,
    labelWidthMm: bitmap.widthMm,
    labelHeightMm: bitmap.heightMm,
    bitmapWidthPx: bitmap.widthPx,
    bitmapHeightPx: bitmap.heightPx,
  });

  return {
    status: printResult.status,
    bitmapUri: bitmap.uri,
    printerName: selectedPrinter.name,
    printerAddress: printResult.printerAddress ?? selectedPrinter.address,
  };
}

export async function getPairedBluetoothPrinters(): Promise<BluetoothPrinterDevice[]> {
  if (Platform.OS !== 'android') {
    throw new Error('Bluetooth printer management is currently available on Android only.');
  }

  const gPrinterBluetooth = getGPrinterBluetoothModule();
  await requestBluetoothPrinterPermissions();
  const hiddenPrinterAddresses = await getHiddenBluetoothPrinterAddresses();
  return filterSupportedBluetoothPrinters(await gPrinterBluetooth.getPairedPrinters())
    .filter((printer) => !hiddenPrinterAddresses.includes(printer.address));
}

export async function getPreferredBluetoothPrinter(): Promise<PreferredBluetoothPrinter | null> {
  const storedPrinter = await SecureStore.getItemAsync(preferredPrinterStorageKey);

  if (!storedPrinter) {
    return null;
  }

  try {
    const parsedPrinter = JSON.parse(storedPrinter) as Partial<PreferredBluetoothPrinter>;

    if (typeof parsedPrinter.address === 'string' && parsedPrinter.address.trim().length > 0) {
      return {
        address: parsedPrinter.address,
        name: typeof parsedPrinter.name === 'string' ? parsedPrinter.name : undefined,
      };
    }
  } catch {
    return null;
  }

  return null;
}

export async function checkPreferredBluetoothPrinterReadiness() {
  if (Platform.OS !== 'android') {
    throw new Error('Bluetooth label printing is currently available on Android only.');
  }

  const preferredPrinter = await getPreferredBluetoothPrinter();

  if (!preferredPrinter) {
    return {
      status: 'missing' as const,
      printer: null,
    };
  }

  const gPrinterBluetooth = getGPrinterBluetoothModule();
  await requestBluetoothPrinterPermissions();

  try {
    await gPrinterBluetooth.connect(preferredPrinter.address);
    return {
      status: 'ready' as const,
      printer: preferredPrinter,
    };
  } catch {
    return {
      status: 'offline' as const,
      printer: preferredPrinter,
    };
  } finally {
    await safeDisconnect(gPrinterBluetooth);
  }
}

export async function setPreferredBluetoothPrinter(printer: BluetoothPrinterDevice) {
  await SecureStore.setItemAsync(
    preferredPrinterStorageKey,
    JSON.stringify({
      address: printer.address,
      name: printer.name,
    }),
  );
}

export async function clearPreferredBluetoothPrinter() {
  await SecureStore.deleteItemAsync(preferredPrinterStorageKey);
}

export async function hideBluetoothPrinter(printer: BluetoothPrinterDevice) {
  const hiddenPrinterAddresses = await getHiddenBluetoothPrinterAddresses();

  if (hiddenPrinterAddresses.includes(printer.address)) {
    return;
  }

  await SecureStore.setItemAsync(
    hiddenPrinterStorageKey,
    JSON.stringify([...hiddenPrinterAddresses, printer.address]),
  );
}

async function getHiddenBluetoothPrinterAddresses() {
  const storedPrinters = await SecureStore.getItemAsync(hiddenPrinterStorageKey);

  if (!storedPrinters) {
    return [];
  }

  try {
    const parsedPrinters = JSON.parse(storedPrinters);
    return Array.isArray(parsedPrinters)
      ? parsedPrinters.filter((address): address is string => typeof address === 'string' && address.trim().length > 0)
      : [];
  } catch {
    return [];
  }
}

async function printWithFreshConnection(
  gPrinterBluetooth: GPrinterBluetoothNativeModule,
  printerAddress: string,
  options: Parameters<GPrinterBluetoothNativeModule['printBitmap']>[0],
) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await safeDisconnect(gPrinterBluetooth);
      await delay(attempt === 0 ? 250 : 900);
      await gPrinterBluetooth.connect(printerAddress);
      await delay(250);
      return await gPrinterBluetooth.printBitmap(options);
    } catch (error) {
      lastError = error;
      await safeDisconnect(gPrinterBluetooth);
      if (attempt === 0) {
        await delay(1200);
      }
    }
  }

  throw lastError instanceof Error
    ? new Error(`Printer did not respond after retry. ${lastError.message}`)
    : new Error('Printer did not respond after retry. Turn printer Bluetooth off/on and try again.');
}

async function safeDisconnect(gPrinterBluetooth: GPrinterBluetoothNativeModule) {
  try {
    await gPrinterBluetooth.disconnect();
  } catch {
    // The native side may already be disconnected; this reset is best-effort.
  }
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function requestBluetoothPrinterPermissions() {
  if (Platform.OS !== 'android') {
    return;
  }

  const apiLevel = Number(Platform.Version);
  const permissions =
    apiLevel >= 31
      ? [
          'android.permission.BLUETOOTH_CONNECT',
          'android.permission.BLUETOOTH_SCAN',
        ]
      : [
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ];

  const results = await PermissionsAndroid.requestMultiple(permissions as Permission[]);
  const permissionResults = results as Record<string, string>;
  const deniedPermission = permissions.find((permission) => permissionResults[permission] !== PermissionsAndroid.RESULTS.GRANTED);

  if (deniedPermission) {
    throw new Error('Bluetooth permission is required before printing labels.');
  }
}

function selectPreferredPrinter(printers: BluetoothPrinterDevice[], preferredPrinterAddress?: string) {
  if (printers.length === 0) {
    return null;
  }

  if (preferredPrinterAddress) {
    const savedPrinter = printers.find((printer) => printer.address === preferredPrinterAddress);

    if (savedPrinter) {
      return savedPrinter;
    }
  }

  return printers[0];
}

function filterSupportedBluetoothPrinters(printers: BluetoothPrinterDevice[]) {
  return printers.filter(isSupportedBluetoothPrinter);
}

function isSupportedBluetoothPrinter(printer: BluetoothPrinterDevice) {
  const printerName = (printer.name ?? '').toLowerCase();
  const knownPrinterName =
    printerName.includes('gprinter') ||
    printerName.includes('gainscha') ||
    printerName.includes('m324') ||
    printerName.includes('label') ||
    printerName.includes('printer') ||
    printerName.includes('print') ||
    printerName.includes('gp-') ||
    printerName.startsWith('gp') ||
    printerName.includes('佳博');

  if (knownPrinterName) {
    return true;
  }

  // Android BluetoothClass.Device.Major.IMAGING. Most classic Bluetooth printers
  // report this class; accessories such as selfie sticks usually do not.
  return printer.majorDeviceClass === 0x0600;
}

function getGPrinterBluetoothModule() {
  const nativeModule = NativeModules.GPrinterBluetooth as GPrinterBluetoothNativeModule | undefined;

  if (!nativeModule) {
    const nativeModuleNames = Object.keys(NativeModules).sort().join(', ');
    throw new Error(
      `Bluetooth printer module is not inside this installed app. Rebuild and reinstall the Android app with "npm.cmd run android". Available native modules: ${nativeModuleNames}`,
    );
  }

  return nativeModule;
}
