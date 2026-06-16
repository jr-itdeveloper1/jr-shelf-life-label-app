export type ProductSource = 'company' | 'outlet';

export type StorageMethod = {
  en: string;
  zh: string;
};

export type Outlet = {
  id: string;
  name: string;
  code: string;
  shortCode: string;
};

export type ProductCategory = {
  id: string;
  name: string;
  codePrefix: string;
  color?: string;
  scope: 'company' | 'outlet';
};

export type Product = {
  id: string;
  outletId?: string;
  categoryId: string;
  productCode: string;
  source: ProductSource;
  nameEn: string;
  nameZh: string;
  daysToExpire: number;
  hoursToExpire: number;
  storageMethod: StorageMethod;
  imageUri?: string;
  active: boolean;
};

export type OutletProduct = {
  id: string;
  outletId: string;
  productId: string;
  active: boolean;
};

export type PrintJob = {
  id: string;
  labelType?: 'product' | 'timestamp';
  outletId: string;
  outletName: string;
  productId: string;
  productCode: string;
  productNameEn: string;
  productNameZh: string;
  quantity: number;
  printedAt: string;
  expiresAt: string;
  labelBitmapUri?: string;
  labelBitmapWidthPx?: number;
  labelBitmapHeightPx?: number;
  printerName?: string;
  printerAddress?: string;
  status: 'mock-saved' | 'printed' | 'failed';
  syncStatus?: 'pending' | 'syncing' | 'synced' | 'failed';
  syncedAt?: string;
  syncError?: string;
};

export type AppDataImport = {
  categories?: ProductCategory[];
  outlets?: Outlet[];
  products?: Product[];
  outletProducts?: OutletProduct[];
  printJobs?: PrintJob[];
};
