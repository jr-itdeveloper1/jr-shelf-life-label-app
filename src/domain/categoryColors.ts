import type { ProductCategory } from './models';

export type CategoryColorOption = {
  color: string;
  label: string;
};

export const categoryColorOptions: CategoryColorOption[] = [
  { color: '#2563eb', label: 'Blue' },
  { color: '#dc2626', label: 'Red' },
  { color: '#eab308', label: 'Yellow' },
  { color: '#16a34a', label: 'Green' },
  { color: '#f97316', label: 'Orange' },
  { color: '#9333ea', label: 'Purple' },
  { color: '#ec4899', label: 'Pink' },
  { color: '#06b6d4', label: 'Cyan' },
  { color: '#92400e', label: 'Brown' },
  { color: '#6b7280', label: 'Gray' },
  { color: '#111827', label: 'Black' },
  { color: '#ffffff', label: 'White' },
];

const categoryColorById: Record<string, string> = {
  bk: '#f97316',
  bs: '#eab308',
  bv: '#06b6d4',
  dp: '#92400e',
  dy: '#2563eb',
  eg: '#dc2626',
  ff: '#9333ea',
  ms: '#111827',
  rte: '#6b7280',
  se: '#16a34a',
  veg: '#ec4899',
};

export function getCategoryColor(category: ProductCategory | string): string {
  const categoryId = typeof category === 'string' ? category : category.id;
  const configuredColor = typeof category === 'string' ? undefined : category.color;

  if (isCategoryColor(configuredColor)) {
    return configuredColor;
  }

  if (categoryId === 'all') {
    return '#0f766e';
  }

  if (categoryId === 'custom') {
    return '#0ea5e9';
  }

  return categoryColorById[categoryId] ?? '#2563eb';
}

export function isCategoryColor(color: string | undefined): color is string {
  return Boolean(color && /^#[0-9a-f]{6}$/i.test(color));
}
