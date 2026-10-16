import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import type { Outlet, OutletProduct, PrintJob, Product, ProductCategory } from '../domain/models';
import type { BluetoothPrinterDevice } from './printerService';

const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'https://labelprinter.jrgroup.com.sg/api/backend';
const sessionStorageKey = 'jr-label-cloud-session-v1';
const deviceIdentifierStorageKey = 'jr-label-cloud-device-id-v1';
const productImageCacheDirectory = `${FileSystem.cacheDirectory ?? ''}product-images/`;

export type CloudUserRole = 'COMPANY_ADMIN' | 'OUTLET_USER';

export type CloudSession = {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: CloudUserRole;
    companyId: string;
    company?: { id: string; name: string; code: string } | null;
  };
};

export type CloudAppData = {
  categories: ProductCategory[];
  outlets: Outlet[];
  products: Product[];
  outletProducts: OutletProduct[];
};

type ApiProduct = {
  id: string;
  outletId?: string | null;
  categoryId: string;
  productCode: string;
  source: 'company' | 'outlet';
  nameEn: string;
  nameZh: string;
  daysToExpire: number;
  hoursToExpire: number;
  storageMethodEn: string;
  storageMethodZh: string;
  imageStatus?: string;
  imageUri?: string | null;
  active: boolean;
};

type BootstrapResponse = {
  categories: ProductCategory[];
  outlets: Outlet[];
  products: ApiProduct[];
  outletProducts: OutletProduct[];
};

export async function loadCloudSession() {
  const storedSession = await SecureStore.getItemAsync(sessionStorageKey);
  if (!storedSession) return null;
  try {
    return JSON.parse(storedSession) as CloudSession;
  } catch {
    await SecureStore.deleteItemAsync(sessionStorageKey);
    return null;
  }
}

export async function saveCloudSession(session: CloudSession) {
  await SecureStore.setItemAsync(sessionStorageKey, JSON.stringify(session));
}

export async function clearCloudSession() {
  await SecureStore.deleteItemAsync(sessionStorageKey);
}

export async function cloudLogin(email: string, password: string) {
  const response = await fetch(`${apiBaseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, portal: 'mobile' }),
  });
  const body = await parseApiBody(response, '/auth/login');
  if (!response.ok) {
    throw new Error(toApiMessage(body, 'Unable to sign in.'));
  }
  const session = body as CloudSession;
  await saveCloudSession(session);
  return session;
}

export async function fetchCloudBootstrap(session: CloudSession): Promise<CloudAppData> {
  const response = await authorizedFetch(session, '/mobile/bootstrap');
  const body = (await parseApiBody(response, '/mobile/bootstrap')) as BootstrapResponse;
  if (!response.ok) {
    throw new Error(toApiMessage(body, 'Unable to sync cloud data.'));
  }

  return {
    categories: body.categories,
    outlets: body.outlets,
    products: await Promise.all(body.products.map((product) => toMobileProduct(product, session))),
    outletProducts: body.outletProducts,
  };
}

export async function syncSelectedPrinter(session: CloudSession, printer: BluetoothPrinterDevice, outletId?: string) {
  const deviceIdentifier = await getCloudDeviceIdentifier();
  const response = await authorizedFetch(session, '/mobile/devices/printer', {
    method: 'POST',
    body: JSON.stringify({
      deviceIdentifier,
      deviceName: `${Platform.OS} ${Platform.Version}`,
      appVersion: 'mobile',
      outletId,
      printerName: printer.name || 'Bluetooth Printer',
      printerMacAddress: printer.address,
      printerBluetoothId: printer.id || printer.address,
    }),
  });
  const body = await parseApiBody(response, '/mobile/devices/printer');
  if (!response.ok) {
    throw new Error(toApiMessage(body, 'Printer must be synced online before it can be selected.'));
  }
  return body;
}

export async function removeSyncedPrinter(session: CloudSession) {
  const deviceIdentifier = await getCloudDeviceIdentifier();
  const response = await authorizedFetch(session, `/mobile/devices/printer/${encodeURIComponent(deviceIdentifier)}`, {
    method: 'DELETE',
  });
  const body = await parseApiBody(response, '/mobile/devices/printer');
  if (!response.ok) {
    throw new Error(toApiMessage(body, 'Printer must be removed online.'));
  }
  return body;
}

export async function uploadPrintJobs(session: CloudSession, printJobs: PrintJob[]) {
  const response = await authorizedFetch(session, '/mobile/print-jobs', {
    method: 'POST',
    body: JSON.stringify({ jobs: printJobs }),
  });
  const body = await parseApiBody(response, '/mobile/print-jobs');
  if (!response.ok) {
    throw new Error(toApiMessage(body, 'Unable to upload print jobs.'));
  }
  return body as { uploaded: number; message: string };
}

export function getCloudApiBaseUrl() {
  return apiBaseUrl;
}

async function authorizedFetch(session: CloudSession, path: string, init: RequestInit = {}) {
  return fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
      ...init.headers,
    },
  });
}

async function getCloudDeviceIdentifier() {
  const storedIdentifier = await SecureStore.getItemAsync(deviceIdentifierStorageKey);
  if (storedIdentifier) return storedIdentifier;
  const identifier = `android-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  await SecureStore.setItemAsync(deviceIdentifierStorageKey, identifier);
  return identifier;
}

async function toMobileProduct(product: ApiProduct, session: CloudSession): Promise<Product> {
  return {
    id: product.id,
    outletId: product.outletId ?? undefined,
    categoryId: product.categoryId,
    productCode: product.productCode,
    source: product.source,
    nameEn: product.nameEn,
    nameZh: product.nameZh,
    daysToExpire: product.daysToExpire,
    hoursToExpire: product.hoursToExpire,
    storageMethod: {
      en: product.storageMethodEn,
      zh: product.storageMethodZh,
    },
    imageUri: await cachedProductImageUri(product, session),
    active: product.active,
  };
}

async function cachedProductImageUri(product: ApiProduct, session: CloudSession) {
  const imageUri = product.imageUri;
  if (!imageUri || !isStoredProductImageUri(imageUri) || !FileSystem.cacheDirectory) {
    return imageUri ?? undefined;
  }

  const remoteUri = imageUri.startsWith('http') ? imageUri : `${apiBaseUrl}${imageUri}`;
  const cacheFileName = productImageCacheFileName(product.id, imageUri);
  const localUri = `${productImageCacheDirectory}${cacheFileName}`;

  try {
    await FileSystem.makeDirectoryAsync(productImageCacheDirectory, { intermediates: true });
    const existingFile = await FileSystem.getInfoAsync(localUri);
    if (existingFile.exists) return localUri;

    const download = await FileSystem.downloadAsync(remoteUri, localUri, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    return download.status >= 200 && download.status < 300 ? download.uri : undefined;
  } catch {
    // The cache may be unavailable while offline. Do not retain a protected remote
    // URL because React Native Image cannot attach the required bearer token.
    return undefined;
  }
}

function isStoredProductImageUri(imageUri: string) {
  return imageUri.startsWith('/product-images/') || imageUri.includes('/product-images/');
}

function productImageCacheFileName(productId: string, imageUri: string) {
  const sourceFileName = imageUri.split('/').pop()?.split('?')[0] ?? 'image';
  const safeSourceFileName = sourceFileName.replace(/[^A-Za-z0-9._-]/g, '');
  const safeProductId = productId.replace(/[^A-Za-z0-9_-]/g, '');
  return `${safeProductId}-${safeSourceFileName || 'image'}`;
}

function toApiMessage(body: unknown, fallback: string) {
  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as { message?: unknown }).message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string') return message;
  }
  return fallback;
}

async function parseApiBody(response: Response, path: string) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    const preview = text.replace(/\s+/g, ' ').slice(0, 120);
    throw new Error(
      `API did not return JSON from ${apiBaseUrl}${path} (HTTP ${response.status}). Check EXPO_PUBLIC_API_URL and make sure Docker API is running. Response starts with: ${preview}`,
    );
  }
}
