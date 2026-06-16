'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DataTable } from './DataTable';
import { StatusBadge } from './ui';

type ProductRow = {
  id: string;
  productCode: string;
  nameEn: string;
  nameZh: string;
  daysToExpire: number;
  hoursToExpire: number;
  storageMethodEn: string;
  active: boolean;
  category?: { id: string; name: string };
};

export function ProductList({ rows }: { rows: ProductRow[] }) {
  const [categoryId, setCategoryId] = useState('ALL');
  const categories = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((row) => {
      if (row.category?.id) map.set(row.category.id, row.category.name);
    });
    return [...map.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);
  const filteredRows = useMemo(
    () => rows.filter((row) => categoryId === 'ALL' || row.category?.id === categoryId),
    [categoryId, rows],
  );

  return (
    <PanelLike title="Products" count={filteredRows.length}>
      <DataTable
        rows={filteredRows}
        searchPlaceholder="Search product code, English, Chinese, storage..."
        getSearchText={(row) => [row.productCode, row.nameEn, row.nameZh, row.storageMethodEn, row.category?.name].join(' ')}
        resetKey={categoryId}
        controls={(
          <label className="inline-filter compact" aria-label="Category filter">
            <span className="sr-only">Category</span>
            <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
              <option value="ALL">All categories</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
        )}
        columns={[
          { header: 'Code', render: (row) => <Link href={`/company-admin/products/${row.id}`}>{row.productCode}</Link> },
          { header: 'Category', render: (row) => row.category?.name ?? 'Unassigned' },
          { header: 'English Name', render: (row) => row.nameEn },
          { header: 'Chinese Name', render: (row) => row.nameZh },
          { header: 'Shelf Life', render: (row) => row.daysToExpire > 0 ? row.daysToExpire + ' day(s)' : row.hoursToExpire + ' hour(s)' },
          { header: 'Storage', render: (row) => row.storageMethodEn },
          { header: 'Status', render: (row) => <StatusBadge kind={row.active ? 'ok' : 'danger'}>{row.active ? 'Active' : 'Inactive'}</StatusBadge> },
        ]}
      />
    </PanelLike>
  );
}

function PanelLike({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section className="panel wide">
      <div className="panel-head">
        <h2>{title}</h2>
        <span className="status">{count} products</span>
      </div>
      {children}
    </section>
  );
}
