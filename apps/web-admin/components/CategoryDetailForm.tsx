'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPatch, apiPost } from '@/lib/client-api';
import { Panel } from './ui';

type ProductStatus = 'ACTIVE' | 'INACTIVE';

type CategoryDetail = {
  id: string;
  name: string;
  codePrefix: string;
  scope: string;
  status: ProductStatus;
  products: Array<{ id: string; productCode: string; nameEn: string }>;
};

type RenumberPreview = {
  rows: Array<{ productId: string; oldCode: string; newCode: string; product: string; conflict: boolean }>;
  summary: { productCount: number; conflicts: number };
};
const ROWS_PER_PAGE = 10;

function normalizePrefix(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
}

export function CategoryDetailForm({ category }: { category: CategoryDetail }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: category.name,
    codePrefix: category.codePrefix,
    scope: category.scope,
    status: category.status,
  });
  const [cleanForm, setCleanForm] = useState(form);
  const [preview, setPreview] = useState<RenumberPreview | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [previewPage, setPreviewPage] = useState(1);
  const previewPageCount = Math.max(1, Math.ceil((preview?.rows.length ?? 0) / ROWS_PER_PAGE));
  const safePreviewPage = Math.min(previewPage, previewPageCount);
  const previewStart = !preview || preview.rows.length === 0 ? 0 : (safePreviewPage - 1) * ROWS_PER_PAGE + 1;
  const previewEnd = preview ? Math.min(safePreviewPage * ROWS_PER_PAGE, preview.rows.length) : 0;
  const normalizedForm = {
    ...form,
    name: form.name.trim(),
    codePrefix: normalizePrefix(form.codePrefix),
  };
  const normalizedCleanForm = {
    ...cleanForm,
    name: cleanForm.name.trim(),
    codePrefix: normalizePrefix(cleanForm.codePrefix),
  };
  const isDirty = JSON.stringify(normalizedForm) !== JSON.stringify(normalizedCleanForm);
  const isValid = normalizedForm.name.length >= 2
    && normalizedForm.name.length <= 120
    && /^[A-Z0-9]{1,5}$/.test(normalizedForm.codePrefix);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setIsSaving(true);
    try {
      const codePrefix = normalizePrefix(form.codePrefix);
      if (!codePrefix) {
        throw new Error('Code prefix is required.');
      }

      let updateProductCodes = false;
      if (codePrefix !== category.codePrefix && category.products.length > 0) {
        const nextPreview = await apiPost<RenumberPreview>(`/company/categories/${category.id}/renumber-preview`, { codePrefix });
        setPreview(nextPreview);
        setPreviewPage(1);
        if (nextPreview.summary.conflicts > 0) {
          throw new Error('Product code update has conflicts. Resolve the conflicting product codes first.');
        }
        const sampleRows = nextPreview.rows.slice(0, 5).map((row) => `${row.oldCode} -> ${row.newCode}`).join('\n');
        updateProductCodes = window.confirm(
          `Code prefix changed from ${category.codePrefix} to ${codePrefix}.\n\nUpdate existing product codes now?\n\nOK: update ${nextPreview.summary.productCount} existing product code(s).\nCancel: only future products use the new prefix.\n\n${sampleRows}`,
        );
      }

      const response = await apiPatch<{ message: string }>(`/company/categories/${category.id}`, {
        ...form,
        codePrefix,
        updateProductCodes,
      });
      setForm({ ...form, codePrefix });
      setCleanForm({ ...form, codePrefix });
      setMessage(response.message);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save category.');
    } finally {
      setIsSaving(false);
    }
  }

  async function loadPreview() {
    setMessage(null);
    setError(null);
    try {
      const nextPreview = await apiPost<RenumberPreview>(`/company/categories/${category.id}/renumber-preview`, {
        codePrefix: normalizePrefix(form.codePrefix),
      });
      setPreview(nextPreview);
      setPreviewPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to preview product codes.');
    }
  }

  return (
    <form data-action-form="true" onSubmit={submit}>
      <div className="toolbar">
        <button className="button primary" disabled={!isDirty || !isValid || isSaving}>{isSaving ? 'Saving...' : 'Save Category'}</button>
        <button className="button" type="button" onClick={() => void loadPreview()}>Preview Product Codes</button>
      </div>
      {message ? <div className="form-message success">{message}</div> : null}
      {error ? <div className="form-message error">{error}</div> : null}
      <section className="grid two">
        <Panel title="Category Fields">
          <div className="form-grid">
            <label><span>Name</span><input value={form.name} minLength={2} maxLength={120} required onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <label>
              <span>Code Prefix (max 5)</span>
              <input value={form.codePrefix} minLength={1} maxLength={5} pattern="[A-Z0-9]+" required onChange={(event) => setForm({ ...form, codePrefix: normalizePrefix(event.target.value) })} />
            </label>
            <label><span>Scope</span><select value={form.scope} onChange={(event) => setForm({ ...form, scope: event.target.value })}><option value="company">Company</option><option value="outlet">Outlet</option></select></label>
            <label><span>Status</span><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ProductStatus })}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
          </div>
        </Panel>
        <Panel title="Prefix Policy">
          <div className="callout warn">Changing the prefix can either affect future products only, or renumber existing products after confirmation.</div>
          <p>{category.products.length} existing product code{category.products.length === 1 ? '' : 's'} currently use this category.</p>
        </Panel>
      </section>
      {preview ? (
        <Panel title="Product Code Preview" wide>
          <table className="data-table">
            <thead><tr><th>Product</th><th>Current Code</th><th>Next Code</th><th>Status</th></tr></thead>
            <tbody>
              {preview.rows.slice((safePreviewPage - 1) * ROWS_PER_PAGE, safePreviewPage * ROWS_PER_PAGE).map((row) => (
                <tr key={row.productId}>
                  <td>{row.product}</td>
                  <td>{row.oldCode}</td>
                  <td>{row.newCode}</td>
                  <td>{row.conflict ? <span className="pill danger">Conflict</span> : <span className="pill success">Ready</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination-controls table-pagination">
            <span>{preview.rows.length === 0 ? 'No records' : `Showing ${previewStart}-${previewEnd} of ${preview.rows.length}`}</span>
            <button className="button" type="button" disabled={safePreviewPage <= 1} onClick={() => setPreviewPage((page) => Math.max(1, page - 1))}>Previous</button>
            <button className="button" type="button" disabled={safePreviewPage >= previewPageCount} onClick={() => setPreviewPage((page) => Math.min(previewPageCount, page + 1))}>Next</button>
          </div>
        </Panel>
      ) : null}
    </form>
  );
}
