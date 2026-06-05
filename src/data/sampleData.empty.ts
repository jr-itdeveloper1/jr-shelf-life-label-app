import type { Outlet, OutletProduct, Product, ProductCategory } from '../domain/models';

export const seedDataVersion = 'empty-products-2026-05-26-v2';

export const outlets: Outlet[] = [
  { id: 'central-kitchen', name: 'Central Kitchen', code: 'OUT-CK', shortCode: 'CK' },
  { id: 'orchard', name: 'Orchard Outlet', code: 'OUT-ORC', shortCode: 'ORC' },
  { id: 'tampines', name: 'Tampines Outlet', code: 'OUT-TMP', shortCode: 'TMP' },
];

export const categories: ProductCategory[] = [
  { id: 'eg', name: 'Eggs', codePrefix: 'EG', scope: 'company' },
  { id: 'dy', name: 'Dairy', codePrefix: 'DY', scope: 'company' },
  { id: 'se', name: 'Sauces & Dressings', codePrefix: 'SE', scope: 'company' },
  { id: 'bs', name: 'Bread Spreads', codePrefix: 'BS', scope: 'company' },
  { id: 'bv', name: 'Beverages', codePrefix: 'BV', scope: 'company' },
  { id: 'ff', name: 'Frozen Food', codePrefix: 'FF', scope: 'company' },
  { id: 'dp', name: 'Dried Products', codePrefix: 'DP', scope: 'company' },
  { id: 'bk', name: 'Bakery', codePrefix: 'BK', scope: 'company' },
  { id: 'ms', name: 'Meat & Seafood', codePrefix: 'MS', scope: 'company' },
  { id: 'veg', name: 'Vegetables', codePrefix: 'VEG', scope: 'company' },
  { id: 'rte', name: 'Ready To Eat', codePrefix: 'RTE', scope: 'company' },
];

export const products: Product[] = [];

export const outletProducts: OutletProduct[] = [];
