'use client';

import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPatch, apiPost } from '@/lib/client-api';
import { Panel } from './ui';

type ProductStatus = 'ACTIVE' | 'INACTIVE';
type Category = { id: string; name: string; codePrefix: string };
type ProductSummary = { id?: string; productCode: string };

export type EditableProduct = {
  id?: string;
  productCode: string;
  categoryId?: string;
  category?: { id: string; name: string };
  nameEn: string;
  nameZh: string;
  daysToExpire: number;
  hoursToExpire: number;
  storageMethodEn: string;
  storageMethodZh: string;
  imageStatus?: string;
  active: boolean;
};

export function ProductForm({
  product,
  categories,
  products,
  mode,
}: {
  product: EditableProduct;
  categories: Category[];
  products: ProductSummary[];
  mode: 'create' | 'edit';
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    categoryId: product.categoryId ?? product.category?.id ?? categories[0]?.id ?? '',
    nameEn: product.nameEn,
    nameZh: product.nameZh,
    daysToExpire: String(product.daysToExpire),
    hoursToExpire: String(product.hoursToExpire),
    storageMethodEn: product.storageMethodEn,
    storageMethodZh: product.storageMethodZh,
    status: product.active ? 'ACTIVE' as ProductStatus : 'INACTIVE' as ProductStatus,
  });
  const [cleanForm, setCleanForm] = useState(form);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageStatus, setImageStatus] = useState(product.imageStatus ?? 'missing');
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const originalCategoryId = product.categoryId ?? product.category?.id ?? '';

  const generatedProductCode = useMemo(() => {
    const selectedCategory = categories.find((category) => category.id === form.categoryId);
    if (!selectedCategory) return '';
    if (mode === 'edit' && form.categoryId === originalCategoryId) {
      return product.productCode;
    }
    const nextSequence = products
      .filter((currentProduct) => currentProduct.id !== product.id)
      .filter((currentProduct) => currentProduct.productCode.startsWith(selectedCategory.codePrefix))
      .map((currentProduct) => Number(currentProduct.productCode.slice(selectedCategory.codePrefix.length)))
      .filter((sequence) => Number.isInteger(sequence))
      .reduce((max, sequence) => Math.max(max, sequence), 0) + 1;

    return `${selectedCategory.codePrefix}${String(nextSequence).padStart(3, '0')}`;
  }, [categories, form.categoryId, mode, originalCategoryId, product.id, product.productCode, products]);

  const payload = useMemo(() => ({
    ...form,
    daysToExpire: Number(form.daysToExpire),
    hoursToExpire: Number(form.hoursToExpire),
  }), [form]);
  const cleanPayload = useMemo(() => ({
    ...cleanForm,
    daysToExpire: Number(cleanForm.daysToExpire),
    hoursToExpire: Number(cleanForm.hoursToExpire),
  }), [cleanForm]);
  const isDirty = JSON.stringify(payload) !== JSON.stringify(cleanPayload);
  const isValid = Boolean(form.categoryId)
    && form.nameEn.trim().length >= 2
    && form.nameEn.trim().length <= 160
    && form.nameZh.trim().length >= 1
    && form.nameZh.trim().length <= 160
    && Number.isFinite(payload.daysToExpire)
    && Number.isFinite(payload.hoursToExpire)
    && payload.daysToExpire >= 0
    && payload.daysToExpire <= 365
    && payload.hoursToExpire >= 0
    && payload.hoursToExpire <= 8760
    && (payload.daysToExpire > 0 || payload.hoursToExpire > 0)
    && form.storageMethodEn.trim().length >= 2
    && form.storageMethodEn.trim().length <= 120
    && form.storageMethodZh.trim().length >= 1
    && form.storageMethodZh.trim().length <= 120;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setIsSaving(true);
    try {
      if (mode === 'create') {
        const response = await apiPost<{ data: { id: string }; message: string }>('/company/products', payload);
        setMessage(response.message);
        router.replace(`/company-admin/products/${response.data.id}`);
      } else {
        const response = await apiPatch<{ message: string }>(`/company/products/${product.id}`, payload);
        setMessage(response.message);
        setCleanForm(form);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save product.');
    } finally {
      setIsSaving(false);
    }
  }

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || mode !== 'edit' || !product.id) return;
    setMessage(null);
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Product image must be an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Product image must be 5 MB or smaller.');
      return;
    }
    setIsUploadingImage(true);
    try {
      const response = await apiPost<{ data: { imageStatus: string }; fileName: string; message: string }>(`/company/products/${product.id}/image`, {
        fileName: file.name,
        contentType: file.type,
        size: file.size,
      });
      setImageStatus(response.data.imageStatus);
      setImageFileName(response.fileName);
      setMessage(response.message);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload product image.');
    } finally {
      setIsUploadingImage(false);
    }
  }

  return (
    <form data-action-form="true" onSubmit={submit}>
      <div className="toolbar">
        <button className="button primary" disabled={!isDirty || !isValid || isSaving}>{isSaving ? 'Saving...' : 'Save Product'}</button>
        <button className="button" type="button" onClick={() => setShowPreview(!showPreview)}>Preview Label</button>
        {mode === 'edit' ? <button className="button warn" type="button" onClick={() => setForm({ ...form, status: 'INACTIVE' })}>Deactivate</button> : <button className="button" type="button" onClick={() => router.back()}>Cancel</button>}
      </div>
      {message ? <div className="form-message success">{message}</div> : null}
      {error ? <div className="form-message error">{error}</div> : null}
      <section className="grid two">
        <Panel title="Product Fields">
          <div className="form-grid">
            <label>
              <span>Product Code</span>
              <input value={generatedProductCode} readOnly disabled aria-readonly="true" />
              <small>Auto-generated from the selected category prefix.</small>
            </label>
            <label><span>Category</span><select value={form.categoryId} required onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            <label><span>English Name</span><input value={form.nameEn} minLength={2} maxLength={160} required onChange={(event) => setForm({ ...form, nameEn: event.target.value })} /></label>
            <label><span>Chinese Name</span><input value={form.nameZh} minLength={1} maxLength={160} required onChange={(event) => setForm({ ...form, nameZh: event.target.value })} /></label>
            <label><span>Days To Expire</span><input value={form.daysToExpire} type="number" min={0} max={365} required onChange={(event) => setForm({ ...form, daysToExpire: event.target.value })} /></label>
            <label><span>Hours To Expire</span><input value={form.hoursToExpire} type="number" min={0} max={8760} required onChange={(event) => setForm({ ...form, hoursToExpire: event.target.value })} /></label>
            <label><span>Storage Method EN</span><input value={form.storageMethodEn} minLength={2} maxLength={120} required onChange={(event) => setForm({ ...form, storageMethodEn: event.target.value })} /></label>
            <label><span>Storage Method ZH</span><input value={form.storageMethodZh} minLength={1} maxLength={120} required onChange={(event) => setForm({ ...form, storageMethodZh: event.target.value })} /></label>
            <label><span>Status</span><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ProductStatus })}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
          </div>
        </Panel>
        <Panel title="Safety Validation">
          <div className="callout safe">Printable when Product status and OutletProduct availability are both active.</div>
          <div className="image-drop">
            <div>Image status: {imageStatus}</div>
            {imageFileName ? <small>{imageFileName}</small> : null}
            {mode === 'edit' ? (
              <label className="upload-control">
                <span>{isUploadingImage ? 'Uploading...' : 'Upload Product Image'}</span>
                <input type="file" accept="image/*" disabled={isUploadingImage} onChange={(event) => void uploadImage(event)} />
              </label>
            ) : (
              <small>Save this product before uploading an image.</small>
            )}
          </div>
          {showPreview ? <div className="label-preview"><strong>{form.nameEn}</strong><span>{generatedProductCode} | {form.nameZh} | {form.storageMethodEn}</span><span>OPEN: 05/06/26 10:30</span><span>USE BY: calculated by shelf-life rule</span></div> : null}
        </Panel>
      </section>
    </form>
  );
}
