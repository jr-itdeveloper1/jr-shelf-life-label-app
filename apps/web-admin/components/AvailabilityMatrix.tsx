'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPatch } from '@/lib/client-api';
import { Panel, StatusBadge } from './ui';

type ProductRow = { id: string; productCode: string; nameEn: string; active: boolean; category: { name: string } };
type OutletOption = { id: string; name: string };
type OutletProductRow = {
  id: string;
  active: boolean;
  outlet: { id: string; name: string };
  product: { id: string; productCode: string; nameEn: string; active: boolean; category: { name: string } };
};
const ROWS_PER_PAGE = 10;

export function AvailabilityMatrix({
  role,
  outlets,
  selectedOutletId,
  companyRows,
  outletRows,
}: {
  role: string;
  outlets: OutletOption[];
  selectedOutletId: string;
  companyRows: ProductRow[];
  outletRows: OutletProductRow[];
}) {
  const router = useRouter();
  const [companyState, setCompanyState] = useState(() => Object.fromEntries(companyRows.map((row) => [row.id, row.active])));
  const [cleanCompanyState, setCleanCompanyState] = useState(() => Object.fromEntries(companyRows.map((row) => [row.id, row.active])));
  const [outletRowsState, setOutletRowsState] = useState(outletRows);
  const [outletState, setOutletState] = useState(() => Object.fromEntries(outletRows.map((row) => [row.id, row.active])));
  const [cleanOutletState, setCleanOutletState] = useState(() => Object.fromEntries(outletRows.map((row) => [row.id, row.active])));
  const [activeTab, setActiveTab] = useState<'company' | 'outlet'>(role === 'OUTLET_USER' ? 'outlet' : 'company');
  const [companyCategory, setCompanyCategory] = useState('ALL');
  const [companyPage, setCompanyPage] = useState(1);
  const sortedOutlets = useMemo(() => [...outlets].sort((a, b) => a.name.localeCompare(b.name)), [outlets]);
  const [outletId, setOutletId] = useState(() => selectedOutletId || sortedOutlets[0]?.id || '');
  const [outletCategory, setOutletCategory] = useState('ALL');
  const [outletPage, setOutletPage] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingOutlet, setIsLoadingOutlet] = useState(false);
  const isOutletUser = role === 'OUTLET_USER';

  useEffect(() => {
    if (sortedOutlets.length === 0) {
      if (outletId) setOutletId('');
      return;
    }
    if (!sortedOutlets.some((outlet) => outlet.id === outletId)) {
      setOutletId(sortedOutlets[0].id);
      setOutletCategory('ALL');
    }
  }, [outletId, sortedOutlets]);

  const visibleOutletRows = useMemo(
    () => outletRowsState.filter((row) => isOutletUser ? row.product.active : Boolean(companyState[row.product.id])),
    [companyState, isOutletUser, outletRowsState],
  );
  const companyCategories = useMemo(() => uniqueSorted(companyRows.map((row) => row.category.name)), [companyRows]);
  const selectedOutletRows = useMemo(() => visibleOutletRows.filter((row) => row.outlet.id === outletId), [outletId, visibleOutletRows]);
  const outletCategories = useMemo(() => uniqueSorted(selectedOutletRows.map((row) => row.product.category.name)), [selectedOutletRows]);
  const filteredCompanyRows = useMemo(
    () => companyRows.filter((row) => companyCategory === 'ALL' || row.category.name === companyCategory),
    [companyCategory, companyRows],
  );
  const filteredOutletRows = useMemo(
    () => selectedOutletRows.filter((row) => outletCategory === 'ALL' || row.product.category.name === outletCategory),
    [outletCategory, selectedOutletRows],
  );
  const companyPagination = paginated(filteredCompanyRows, companyPage);
  const outletPagination = paginated(filteredOutletRows, outletPage);
  const hasCompanyChanges = !isOutletUser && companyRows.some((row) => Boolean(companyState[row.id]) !== Boolean(cleanCompanyState[row.id]));
  const hasOutletChanges = visibleOutletRows.some((row) => Boolean(outletState[row.id]) !== Boolean(cleanOutletState[row.id]));
  const isDirty = hasCompanyChanges || hasOutletChanges;

  async function save() {
    setMessage(null);
    setError(null);
    setIsSaving(true);
    try {
      const response = await apiPatch<{ message: string }>('/company/availability', {
        company: isOutletUser ? [] : companyRows.map((row) => ({ productId: row.id, active: Boolean(companyState[row.id]) })),
        outlet: visibleOutletRows.map((row) => ({ outletProductId: row.id, active: Boolean(outletState[row.id]) })),
      });
      setMessage(response.message);
      setCleanCompanyState(companyState);
      setCleanOutletState(outletState);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save availability.');
    } finally {
      setIsSaving(false);
    }
  }

  async function loadOutletRows(nextOutletId: string) {
    setOutletId(nextOutletId);
    setOutletCategory('ALL');
    setOutletPage(1);
    if (!nextOutletId) {
      setOutletRowsState([]);
      return;
    }

    setError(null);
    setIsLoadingOutlet(true);
    try {
      const data = await apiGet<{ outletRows: OutletProductRow[] }>(`/company/availability?outletId=${encodeURIComponent(nextOutletId)}`);
      setOutletRowsState(data.outletRows);
      setOutletState((current) => ({
        ...current,
        ...Object.fromEntries(data.outletRows.map((row) => [row.id, row.active])),
      }));
      setCleanOutletState((current) => ({
        ...current,
        ...Object.fromEntries(data.outletRows.map((row) => [row.id, row.active])),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load outlet products.');
    } finally {
      setIsLoadingOutlet(false);
    }
  }

  return (
    <>
      {message ? <div className="form-message success">{message}</div> : null}
      {error ? <div className="form-message error">{error}</div> : null}
      <div className="tabs" role="tablist" aria-label="Availability level">
        {!isOutletUser ? (
          <button className={activeTab === 'company' ? 'active' : ''} type="button" role="tab" aria-selected={activeTab === 'company'} onClick={() => setActiveTab('company')}>
            Company-Level Product Availability
          </button>
        ) : null}
        <button className={activeTab === 'outlet' ? 'active' : ''} type="button" role="tab" aria-selected={activeTab === 'outlet'} onClick={() => setActiveTab('outlet')}>
          Outlet-Level Product Availability
        </button>
      </div>
      {!isOutletUser && activeTab === 'company' ? (
        <Panel
          title="Company-Level Product Availability"
          wide
          action={<button className="button primary" type="button" disabled={!isDirty || isSaving} onClick={() => void save()}>{isSaving ? 'Saving...' : 'Save Availability'}</button>}
        >
          <div className="callout safe">Company-level enabled products become visible to outlet-level matrices. Disabled products are hidden from Outlet Users.</div>
          <div className="filter-bar">
            <label>
              <span className="sr-only">Category</span>
              <select value={companyCategory} onChange={(event) => { setCompanyCategory(event.target.value); setCompanyPage(1); }}>
                <option value="ALL">All categories</option>
                {companyCategories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
            <Pagination
              currentPage={companyPagination.page}
              pageCount={companyPagination.pageCount}
              start={companyPagination.start}
              end={companyPagination.end}
              total={filteredCompanyRows.length}
              onPageChange={setCompanyPage}
            />
          </div>
          <table>
            <thead><tr><th>Company Enabled</th><th>Code</th><th>Product</th><th>Category</th><th>Status</th></tr></thead>
            <tbody>
              {companyPagination.rows.map((row) => (
                <tr key={row.id}>
                  <td><label className="switch"><input type="checkbox" checked={Boolean(companyState[row.id])} onChange={(event) => setCompanyState({ ...companyState, [row.id]: event.target.checked })} /><span /></label></td>
                  <td>{row.productCode}</td>
                  <td>{row.nameEn}</td>
                  <td>{row.category.name}</td>
                  <td><StatusBadge kind={companyState[row.id] ? 'ok' : 'danger'}>{companyState[row.id] ? 'Enabled' : 'Disabled'}</StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCompanyRows.length === 0 ? <div className="empty-state">No products match this category.</div> : null}
        </Panel>
      ) : null}
      {activeTab === 'outlet' ? (
      <Panel
        title="Outlet-Level Product Availability"
        wide
        action={<button className="button primary" type="button" disabled={!isDirty || isSaving} onClick={() => void save()}>{isSaving ? 'Saving...' : 'Save Availability'}</button>}
      >
        <div className="filter-bar">
          <label>
            <span className="sr-only">Outlet</span>
            <select value={outletId} onChange={(event) => { void loadOutletRows(event.target.value); }} disabled={sortedOutlets.length === 0 || isLoadingOutlet}>
              {sortedOutlets.length === 0 ? <option value="">No authorized outlets</option> : null}
              {sortedOutlets.map((outlet) => <option key={outlet.id} value={outlet.id}>{outlet.name}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">Category</span>
            <select value={outletCategory} onChange={(event) => { setOutletCategory(event.target.value); setOutletPage(1); }} disabled={!outletId}>
              <option value="ALL">All categories</option>
              {outletCategories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <Pagination
            currentPage={outletPagination.page}
            pageCount={outletPagination.pageCount}
            start={outletPagination.start}
            end={outletPagination.end}
            total={filteredOutletRows.length}
            onPageChange={setOutletPage}
          />
        </div>
        <table>
          <thead><tr><th>Outlet Enabled</th><th>Code</th><th>Product</th><th>Category</th><th>Company Status</th></tr></thead>
          <tbody>
            {outletPagination.rows.map((row) => (
              <tr key={row.id}>
                <td><label className="switch"><input type="checkbox" checked={Boolean(outletState[row.id])} onChange={(event) => setOutletState({ ...outletState, [row.id]: event.target.checked })} /><span /></label></td>
                <td>{row.product.productCode}</td>
                <td>{row.product.nameEn}</td>
                <td>{row.product.category.name}</td>
                <td><StatusBadge kind={isOutletUser ? row.product.active ? 'ok' : 'danger' : companyState[row.product.id] ? 'ok' : 'danger'}>{isOutletUser ? row.product.active ? 'Active' : 'Inactive' : companyState[row.product.id] ? 'Active' : 'Inactive'}</StatusBadge></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredOutletRows.length === 0 ? <div className="empty-state">{outletId ? 'No products match this outlet/category filter.' : 'No authorized outlets are available.'}</div> : null}
      </Panel>
      ) : null}
    </>
  );
}

function uniqueSorted(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function paginated<T>(rows: T[], currentPage: number) {
  const pageCount = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE));
  const page = Math.min(currentPage, pageCount);
  const startIndex = (page - 1) * ROWS_PER_PAGE;
  return {
    rows: rows.slice(startIndex, startIndex + ROWS_PER_PAGE),
    page,
    pageCount,
    start: rows.length === 0 ? 0 : startIndex + 1,
    end: Math.min(startIndex + ROWS_PER_PAGE, rows.length),
  };
}

function Pagination({
  currentPage,
  pageCount,
  start,
  end,
  total,
  onPageChange,
}: {
  currentPage: number;
  pageCount: number;
  start: number;
  end: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="pagination-controls">
      <span>{total === 0 ? 'No records' : `Showing ${start}-${end} of ${total}`}</span>
      <button className="button" type="button" disabled={currentPage <= 1} onClick={() => onPageChange(Math.max(1, currentPage - 1))}>Previous</button>
      <button className="button" type="button" disabled={currentPage >= pageCount} onClick={() => onPageChange(Math.min(pageCount, currentPage + 1))}>Next</button>
    </div>
  );
}
