import type { Outlet, Product, ProductCategory } from '../domain/models';

export const outlets: Outlet[] = [
  { id: 'central-kitchen', name: 'Central Kitchen', shortCode: 'CK' },
  { id: 'orchard', name: 'Orchard Outlet', shortCode: 'ORC' },
  { id: 'tampines', name: 'Tampines Outlet', shortCode: 'TMP' },
];

export const categories: ProductCategory[] = [
  { id: 'dairy', name: 'Dairy', codePrefix: 'DAI', scope: 'company' },
  { id: 'nuts', name: 'Nuts', codePrefix: 'NUT', scope: 'company' },
  { id: 'sauce', name: 'Sauce', codePrefix: 'SAU', scope: 'company' },
  { id: 'orchard-custom', name: 'Orchard Custom', codePrefix: 'ORC', scope: 'outlet' },
];

export const products: Product[] = [
  {
    id: 'egg',
    categoryId: 'dairy',
    productCode: 'DAI001',
    source: 'company',
    nameEn: 'Pasteurized Egg',
    nameZh: '巴氏杀菌蛋液',
    daysToExpire: 1,
    hoursToExpire: 0,
    storageMethod: { en: 'Chilled', zh: '冷藏' },
    active: true,
  },
  {
    id: 'milk',
    categoryId: 'dairy',
    productCode: 'DAI002',
    source: 'company',
    nameEn: 'Milk',
    nameZh: '牛奶',
    daysToExpire: 2,
    hoursToExpire: 0,
    storageMethod: { en: 'Chilled', zh: '冷藏' },
    active: true,
  },
  {
    id: 'nuts',
    categoryId: 'nuts',
    productCode: 'NUT001',
    source: 'company',
    nameEn: 'Mixed Nuts',
    nameZh: '混合坚果',
    daysToExpire: 7,
    hoursToExpire: 0,
    storageMethod: { en: 'Ambient', zh: '常温' },
    active: true,
  },
  {
    id: 'bento-rice',
    outletId: 'orchard',
    categoryId: 'orchard-custom',
    productCode: 'ORC001',
    source: 'outlet',
    nameEn: 'Bento Rice Set',
    nameZh: '盒饭',
    daysToExpire: 0,
    hoursToExpire: 6,
    storageMethod: { en: 'Chilled', zh: '冷藏' },
    active: true,
  },
];
