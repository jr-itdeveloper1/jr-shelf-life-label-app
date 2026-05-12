export type ProductSource = 'company' | 'outlet';

export type StorageMethod = {
  en: string;
  zh: string;
};

export type Outlet = {
  id: string;
  name: string;
  shortCode: string;
};

export type ProductCategory = {
  id: string;
  name: string;
  codePrefix: string;
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
