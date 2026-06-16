'use client';

import { ChangeEvent, useMemo, useState } from 'react';
import { StatusBadge } from './ui';

type CategoryOption = {
  id: string;
  name: string;
  codePrefix: string;
  status: string;
};

type ProductOption = {
  id: string;
  productCode: string;
  nameEn: string;
  categoryId: string;
  category: { id: string; name: string };
};

type ImportRowStatus = 'Ready' | 'Warning' | 'Blocked';
const ROWS_PER_PAGE = 10;

type ImportRow = {
  row: number;
  type: 'Product';
  code: string;
  nameEn: string;
  nameZh: string;
  storageMethodEn: string;
  daysToExpire: number;
  hoursToExpire: number;
  imageUri?: string;
  status: ImportRowStatus;
  message: string;
};

type ImportPreview = {
  importType: 'Products';
  fileName?: string;
  rows: ImportRow[];
  summary: {
    products: number;
    ready: number;
    warnings: number;
    blocked: number;
    images?: number;
    categoryId?: string;
    categoryName: string;
    categoryPrefix: string;
    categoryAction: string;
    created?: number;
    updated?: number;
    categoryCreated?: boolean;
  };
  message?: string;
};

const emptyPreview: ImportPreview = {
  importType: 'Products',
  rows: [],
  summary: {
    products: 0,
    ready: 0,
    warnings: 0,
    blocked: 0,
    images: 0,
    categoryName: 'Opened Ingredients',
    categoryPrefix: '',
    categoryAction: 'Choose an Excel file and click Import Data to validate product rows.',
  },
};

type CategoryExportScope = 'all' | 'active' | 'selected';
type ProductExportScope = 'all' | 'selectedCategories' | 'selected';
type ImportExportTab = 'import' | 'export';

export function ImportDataPanel({ categories, products }: { categories: CategoryOption[]; products: ProductOption[] }) {
  const activeCategories = categories.filter((category) => category.status === 'ACTIVE');
  const [activeTab, setActiveTab] = useState<ImportExportTab>('import');
  const [includeCategories, setIncludeCategories] = useState(true);
  const [includeProducts, setIncludeProducts] = useState(true);
  const [categoryExportScope, setCategoryExportScope] = useState<CategoryExportScope>('all');
  const [productExportScope, setProductExportScope] = useState<ProductExportScope>('all');
  const [selectedExportCategoryIds, setSelectedExportCategoryIds] = useState<string[]>([]);
  const [selectedExportProductIds, setSelectedExportProductIds] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(activeCategories[0]?.id ?? '');
  const [preview, setPreview] = useState<ImportPreview>(emptyPreview);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [previewPage, setPreviewPage] = useState(1);

  const canCommit = Boolean(file) && preview.rows.length > 0 && preview.summary.blocked === 0;
  const blockedRows = useMemo(() => preview.rows.filter((row) => row.status === 'Blocked'), [preview.rows]);
  const previewPageCount = Math.max(1, Math.ceil(preview.rows.length / ROWS_PER_PAGE));
  const safePreviewPage = Math.min(previewPage, previewPageCount);
  const previewStart = preview.rows.length === 0 ? 0 : (safePreviewPage - 1) * ROWS_PER_PAGE + 1;
  const previewEnd = Math.min(safePreviewPage * ROWS_PER_PAGE, preview.rows.length);
  const previewRows = preview.rows.slice((safePreviewPage - 1) * ROWS_PER_PAGE, safePreviewPage * ROWS_PER_PAGE);
  const selectedCategory = activeCategories.find((category) => category.id === selectedCategoryId) ?? null;
  const filteredExportProducts = useMemo(() => {
    if (productExportScope !== 'selectedCategories') return products;
    if (selectedExportCategoryIds.length === 0) return [];
    return products.filter((product) => selectedExportCategoryIds.includes(product.categoryId));
  }, [productExportScope, products, selectedExportCategoryIds]);
  const exportSummary = useMemo(() => {
    const categoryCount = !includeCategories
      ? 0
      : categoryExportScope === 'active'
        ? activeCategories.length
        : categoryExportScope === 'selected'
          ? selectedExportCategoryIds.length
          : categories.length;
    const productCount = !includeProducts
      ? 0
      : productExportScope === 'selected'
        ? selectedExportProductIds.length
        : productExportScope === 'selectedCategories'
          ? filteredExportProducts.length
          : products.length;
    return { categoryCount, productCount };
  }, [
    activeCategories.length,
    categories.length,
    categoryExportScope,
    filteredExportProducts.length,
    includeCategories,
    includeProducts,
    productExportScope,
    products.length,
    selectedExportCategoryIds.length,
    selectedExportProductIds.length,
  ]);
  const canExport = (includeCategories || includeProducts)
    && (!includeCategories || categoryExportScope !== 'selected' || selectedExportCategoryIds.length > 0)
    && (!includeProducts || productExportScope !== 'selected' || selectedExportProductIds.length > 0)
    && (!includeProducts || productExportScope !== 'selectedCategories' || selectedExportCategoryIds.length > 0);
  const includedSheetCount = Number(includeCategories) + Number(includeProducts);
  const includedSheetLabel = [
    includeCategories ? 'Categories' : '',
    includeProducts ? 'Products' : '',
  ].filter(Boolean).join(' + ') || 'None';
  const categoryFilterLabel = !includeCategories
    ? 'Categories sheet excluded'
    : categoryExportScope === 'all'
      ? 'All categories'
      : categoryExportScope === 'active'
        ? 'Active categories only'
        : `${selectedExportCategoryIds.length} selected categor${selectedExportCategoryIds.length === 1 ? 'y' : 'ies'}`;
  const productFilterLabel = !includeProducts
    ? 'Products sheet excluded'
    : productExportScope === 'all'
      ? 'All products'
      : productExportScope === 'selectedCategories'
        ? `Products from ${selectedExportCategoryIds.length} selected categor${selectedExportCategoryIds.length === 1 ? 'y' : 'ies'}`
        : `${selectedExportProductIds.length} selected product${selectedExportProductIds.length === 1 ? '' : 's'}`;
  const exportStatusLabel = canExport ? 'Ready' : 'Needs selection';
  const shouldShowCategorySelection = (includeCategories && categoryExportScope === 'selected')
    || (includeProducts && productExportScope === 'selectedCategories');
  const blockedNotice = useMemo(() => {
    if (blockedRows.length === 0) return '';
    const prefixMismatch = selectedCategory?.codePrefix
      ? blockedRows.every((row) => row.message.includes(`Product code prefix must match ${selectedCategory.codePrefix}.`))
      : false;
    if (prefixMismatch) {
      return `Blocked rows must be corrected before import can be committed. The selected category prefix is ${selectedCategory?.codePrefix}, but the Excel product codes use a different prefix. Select the matching category or update the Excel Code values.`;
    }
    return 'Blocked rows must be corrected before import can be committed.';
  }, [blockedRows, selectedCategory?.codePrefix]);

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    setSuccess('');
    setError('');
    setPreview(emptyPreview);
    setPreviewPage(1);
    if (!nextFile) {
      setFile(null);
      return;
    }
    if (!nextFile.name.toLowerCase().endsWith('.xlsx')) {
      setFile(null);
      setError('Only .xlsx Excel files are supported.');
      return;
    }
    if (nextFile.size > 8 * 1024 * 1024) {
      setFile(null);
      setError('Excel file must be 8MB or smaller.');
      return;
    }
    setFile(nextFile);
  }

  function switchTab(tab: ImportExportTab) {
    setActiveTab(tab);
    setError('');
    setSuccess('');
  }

  function toggleExportCategory(categoryId: string) {
    setSelectedExportCategoryIds((ids) => (
      ids.includes(categoryId) ? ids.filter((id) => id !== categoryId) : [...ids, categoryId]
    ));
  }

  function toggleExportProduct(productId: string) {
    setSelectedExportProductIds((ids) => (
      ids.includes(productId) ? ids.filter((id) => id !== productId) : [...ids, productId]
    ));
  }

  async function importData() {
    if (activeTab !== 'import') {
      setError('Open the Import Products tab, then choose an Excel file to validate.');
      return;
    }
    if (!selectedCategory) {
      setError('Create or activate a Category before importing products.');
      return;
    }
    if (!file) {
      setError('Choose an Excel file before importing.');
      return;
    }
    setIsPreviewing(true);
    setSuccess('');
    setError('');
    try {
      const result = await uploadImport('/api/backend/company/import/preview');
      setPreview(result);
      setPreviewPage(1);
      if (result.summary.blocked > 0) {
        setError(`${result.summary.blocked} blocked row${result.summary.blocked === 1 ? '' : 's'} found. Fix the errors below before committing.`);
      } else if (result.summary.warnings > 0) {
        setSuccess(`Validation completed with ${result.summary.warnings} warning${result.summary.warnings === 1 ? '' : 's'}. Existing products will be updated if you commit.`);
      } else {
        setSuccess('Validation completed. All rows are ready to import.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to validate import file.');
    } finally {
      setIsPreviewing(false);
    }
  }

  async function commitImport() {
    if (!canCommit) return;
    setIsCommitting(true);
    setError('');
    setSuccess('');
    try {
      const result = await uploadImport('/api/backend/company/import/commit');
      setPreview(result);
      setPreviewPage(1);
      setSuccess(result.message ?? 'Import committed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to commit import.');
    } finally {
      setIsCommitting(false);
    }
  }

  async function uploadImport(path: string) {
    if (!file) throw new Error('Choose an Excel file before importing.');
    if (!selectedCategory) throw new Error('Select an active Category before importing.');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('categoryId', selectedCategory.id);

    const response = await fetch(path, {
      method: 'POST',
      body: formData,
    });
    const payload = await safeJson(response);
    if (!response.ok) {
      const message = typeof payload?.message === 'string'
        ? payload.message
        : Array.isArray(payload?.message)
          ? payload.message.join(' ')
          : `Import request failed: ${response.status}`;
      throw new Error(message);
    }
    return payload as ImportPreview;
  }

  async function exportCategoriesProducts() {
    if (!canExport) {
      setError('Choose at least one valid category or product export option.');
      return;
    }
    setError('');
    setSuccess('');
    try {
      const params = new URLSearchParams({
        includeCategories: String(includeCategories),
        includeProducts: String(includeProducts),
        categoryScope: includeCategories ? categoryExportScope : 'all',
        productScope: includeProducts ? productExportScope : 'all',
      });
      if (categoryExportScope === 'selected' || productExportScope === 'selectedCategories') {
        params.set('categoryIds', selectedExportCategoryIds.join(','));
      }
      if (productExportScope === 'selected') {
        params.set('productIds', selectedExportProductIds.join(','));
      }
      const response = await fetch(`/api/backend/company/export?${params.toString()}`);
      if (!response.ok) {
        const payload = await safeJson(response) as { message?: string } | null;
        const message = payload && 'message' in payload && typeof payload.message === 'string' ? payload.message : `Export failed: ${response.status}`;
        throw new Error(message);
      }
      const blob = await response.blob();
      downloadBlob(fileNameFromDisposition(response.headers.get('content-disposition')) ?? 'categories-products.xlsx', blob);
      setSuccess(`Excel export prepared with ${exportSummary.categoryCount} categor${exportSummary.categoryCount === 1 ? 'y' : 'ies'} and ${exportSummary.productCount} product${exportSummary.productCount === 1 ? '' : 's'}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to export categories and products.');
    }
  }

  function downloadTemplate() {
    downloadText(
      'product-import-template.csv',
      'Product Name,Picture,Storage Condition,Storage Time,Code\nExample Product 示例产品,,Chilled,7 days,R001\n',
    );
  }

  return (
    <>
      <div className="tabs" role="tablist" aria-label="Import and export modes">
        <button className={activeTab === 'import' ? 'active' : ''} type="button" role="tab" aria-selected={activeTab === 'import'} onClick={() => switchTab('import')}>
          Import Products
        </button>
        <button className={activeTab === 'export' ? 'active' : ''} type="button" role="tab" aria-selected={activeTab === 'export'} onClick={() => switchTab('export')}>
          Export Categories & Products
        </button>
      </div>

      {error ? <div className="form-message error">{error}</div> : null}
      {success ? <div className="form-message success">{success}</div> : null}

      {activeTab === 'import' ? (
        <section className="panel wide">
          <div className="panel-head">
            <h2>Product Excel Import</h2>
            <div className="top-actions">
              <StatusBadge kind="neutral">Products only</StatusBadge>
              <button className="button" type="button" onClick={downloadTemplate}>Download Template</button>
            </div>
          </div>

          <div className="form-grid">
            <label>
              <span>Import Type</span>
              <input value="Products" readOnly disabled aria-readonly="true" />
            </label>
            <label>
              <span>Excel File (.xlsx, max 8MB)</span>
              <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={chooseFile} />
            </label>
            <label>
              <span>Category Name</span>
              <select value={selectedCategoryId} onChange={(event) => setSelectedCategoryId(event.target.value)} disabled={activeCategories.length === 0}>
                {activeCategories.length === 0 ? <option value="">No active categories</option> : null}
                {activeCategories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
                </select>
            </label>
            <label>
              <span>Category Prefix</span>
              <input value={selectedCategory?.codePrefix ?? ''} readOnly disabled aria-readonly="true" />
            </label>
          </div>

          <div className="toolbar import-actions">
            <button className="button primary" type="button" disabled={isPreviewing} onClick={() => void importData()}>
              {isPreviewing ? 'Validating...' : 'Validate File'}
            </button>
            <button className="button" type="button" disabled={!canCommit || isCommitting} onClick={() => void commitImport()}>
              {isCommitting ? 'Committing...' : 'Commit Import'}
            </button>
          </div>

          {blockedRows.length > 0 ? (
            <div className="callout warn">
              {blockedNotice}
            </div>
          ) : null}
        </section>
      ) : (
        <section className="panel wide">
          <div className="panel-head">
            <h2>Export Categories & Products</h2>
            <StatusBadge kind="neutral">XLSX workbook</StatusBadge>
          </div>

          <div className="form-grid">
            <label className="check-row">
              <input type="checkbox" checked={includeCategories} onChange={(event) => setIncludeCategories(event.target.checked)} />
              <span>Include Categories sheet</span>
            </label>
            <label className="check-row">
              <input type="checkbox" checked={includeProducts} onChange={(event) => setIncludeProducts(event.target.checked)} />
              <span>Include Products sheet</span>
            </label>
            {includeCategories ? (
              <label>
                <span>Category Export Scope</span>
                <select value={categoryExportScope} onChange={(event) => setCategoryExportScope(event.target.value as CategoryExportScope)}>
                  <option value="all">All categories</option>
                  <option value="active">Active categories only</option>
                  <option value="selected">Selected categories</option>
                </select>
              </label>
            ) : null}
            {includeProducts ? (
              <label>
                <span>Product Export Scope</span>
                <select value={productExportScope} onChange={(event) => setProductExportScope(event.target.value as ProductExportScope)}>
                  <option value="all">All products</option>
                  <option value="selectedCategories">Products from selected categories</option>
                  <option value="selected">Selected products</option>
                </select>
              </label>
            ) : null}
          </div>

          {shouldShowCategorySelection ? (
            <div className="export-choice-block">
              <div className="panel-head">
                <h2>Categories</h2>
                <button
                  className="button"
                  type="button"
                  onClick={() => setSelectedExportCategoryIds(selectedExportCategoryIds.length === categories.length ? [] : categories.map((category) => category.id))}
                >
                  {selectedExportCategoryIds.length === categories.length ? 'Clear All' : 'Select All'}
                </button>
              </div>
              <div className="checkbox-list">
                {categories.map((category) => (
                  <label key={category.id} className="check-row">
                    <input type="checkbox" checked={selectedExportCategoryIds.includes(category.id)} onChange={() => toggleExportCategory(category.id)} />
                    <span>{category.name} ({category.codePrefix})</span>
                  </label>
                ))}
              </div>
              {selectedExportCategoryIds.length === 0 ? (
                <div className="empty-state">Select at least one category for this export option.</div>
              ) : null}
            </div>
          ) : null}

          {includeProducts && productExportScope === 'selected' ? (
            <div className="export-choice-block">
              <div className="panel-head">
                <h2>Products</h2>
                <button
                  className="button"
                  type="button"
                  onClick={() => setSelectedExportProductIds(selectedExportProductIds.length === products.length ? [] : products.map((product) => product.id))}
                >
                  {selectedExportProductIds.length === products.length ? 'Clear All' : 'Select All'}
                </button>
              </div>
              <div className="checkbox-list">
                {products.map((product) => (
                  <label key={product.id} className="check-row">
                    <input type="checkbox" checked={selectedExportProductIds.includes(product.id)} onChange={() => toggleExportProduct(product.id)} />
                    <span>{product.productCode} - {product.nameEn} ({product.category.name})</span>
                  </label>
                ))}
              </div>
              {selectedExportProductIds.length === 0 ? (
                <div className="empty-state">Select at least one product for this export option.</div>
              ) : null}
            </div>
          ) : null}

          <div className="toolbar import-actions">
            <button className="button primary" type="button" disabled={!canExport} onClick={() => void exportCategoriesProducts()}>
              Export XLSX
            </button>
          </div>
        </section>
      )}

      {activeTab === 'import' ? (
        <>
          <section className="metrics">
            <article className="metric">
              <div className="metric-label">Products</div>
              <div className="metric-value">{preview.summary.products}</div>
              <div className="metric-meta">validated rows</div>
            </article>
            <article className="metric">
              <div className="metric-label">Images</div>
              <div className="metric-value">{preview.summary.images ?? 0}</div>
              <div className="metric-meta">detected</div>
            </article>
            <article className="metric">
              <div className="metric-label">Warnings</div>
              <div className="metric-value">{preview.summary.warnings}</div>
              <div className="metric-meta warn">updates</div>
            </article>
            <article className="metric">
              <div className="metric-label">Blocked</div>
              <div className="metric-value">{preview.summary.blocked}</div>
              <div className="metric-meta danger">fix required</div>
            </article>
          </section>

          <section className="panel wide">
            <div className="panel-head">
              <h2>Preview &amp; Validation</h2>
              <div className="top-actions">
                {preview.fileName ? <span className="muted">{preview.fileName}</span> : null}
                {preview.fileName && preview.summary.categoryName ? (
                  <StatusBadge kind="neutral">{preview.summary.categoryName}</StatusBadge>
                ) : null}
              </div>
            </div>
            <div className="table-shell">
              <table>
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Code</th>
                    <th>English Name</th>
                    <th>Chinese Name</th>
                    <th>Storage</th>
                    <th>Shelf Life</th>
                    <th>Image</th>
                    <th>Status</th>
                    <th>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row) => (
                    <tr key={`${row.row}-${row.code}`}>
                      <td>{row.row}</td>
                      <td>{row.code}</td>
                      <td>{row.nameEn}</td>
                      <td>{row.nameZh}</td>
                      <td>{row.storageMethodEn}</td>
                      <td>{row.daysToExpire > 0 ? `${row.daysToExpire} day(s)` : `${row.hoursToExpire} hour(s)`}</td>
                      <td>{row.imageUri ? 'Detected' : 'Missing'}</td>
                      <td><StatusBadge kind={row.status === 'Blocked' ? 'danger' : row.status === 'Warning' ? 'warn' : 'ok'}>{row.status}</StatusBadge></td>
                      <td>{row.message}</td>
                    </tr>
                  ))}
                  {preview.rows.length === 0 ? (
                    <tr>
                      <td colSpan={9}>No file validated yet.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <div className="pagination-controls table-pagination">
              <span>{preview.rows.length === 0 ? 'No records' : `Showing ${previewStart}-${previewEnd} of ${preview.rows.length}`}</span>
              <button className="button" type="button" disabled={safePreviewPage <= 1} onClick={() => setPreviewPage((page) => Math.max(1, page - 1))}>Previous</button>
              <button className="button" type="button" disabled={safePreviewPage >= previewPageCount} onClick={() => setPreviewPage((page) => Math.min(previewPageCount, page + 1))}>Next</button>
            </div>
          </section>
        </>
      ) : (
        <>
          <section className="metrics">
            <article className="metric">
              <div className="metric-label">Sheets Included</div>
              <div className="metric-value">{includedSheetCount}</div>
              <div className={includedSheetCount === 0 ? 'metric-meta danger' : 'metric-meta'}>{includedSheetLabel}</div>
            </article>
            <article className="metric">
              <div className="metric-label">Categories</div>
              <div className="metric-value">{exportSummary.categoryCount}</div>
              <div className="metric-meta">to export</div>
            </article>
            <article className="metric">
              <div className="metric-label">Products</div>
              <div className="metric-value">{exportSummary.productCount}</div>
              <div className="metric-meta">to export</div>
            </article>
            <article className="metric">
              <div className="metric-label">Export Status</div>
              <div className="metric-value">{exportStatusLabel}</div>
              <div className={canExport ? 'metric-meta' : 'metric-meta danger'}>{canExport ? 'download enabled' : 'fix selection'}</div>
            </article>
          </section>

          <section className="panel wide">
            <div className="panel-head">
              <h2>Preview &amp; Validation</h2>
              <StatusBadge kind={canExport ? 'ok' : 'danger'}>{exportStatusLabel}</StatusBadge>
            </div>
            <div className="table-shell">
              <table>
                <tbody>
                  <tr>
                    <th>Sheets Included</th>
                    <td>{includedSheetLabel}</td>
                  </tr>
                  <tr>
                    <th>Category Filter</th>
                    <td>{categoryFilterLabel}</td>
                  </tr>
                  <tr>
                    <th>Product Filter</th>
                    <td>{productFilterLabel}</td>
                  </tr>
                  <tr>
                    <th>Categories To Export</th>
                    <td>{exportSummary.categoryCount}</td>
                  </tr>
                  <tr>
                    <th>Products To Export</th>
                    <td>{exportSummary.productCount}</td>
                  </tr>
                  <tr>
                    <th>Export Status</th>
                    <td><StatusBadge kind={canExport ? 'ok' : 'danger'}>{exportStatusLabel}</StatusBadge></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}

async function safeJson(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function downloadText(fileName: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  downloadBlob(fileName, blob);
}

function downloadBlob(fileName: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function fileNameFromDisposition(value: string | null) {
  if (!value) return null;
  const match = value.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}
