'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/client-api';
import { Panel } from './ui';

function normalizePrefix(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
}

export function CategoryCreateForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: 'New Category', codePrefix: 'NEW', scope: 'company', status: 'ACTIVE' });
  const [cleanForm] = useState(form);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const normalizedForm = { ...form, name: form.name.trim(), codePrefix: normalizePrefix(form.codePrefix) };
  const normalizedCleanForm = { ...cleanForm, name: cleanForm.name.trim(), codePrefix: normalizePrefix(cleanForm.codePrefix) };
  const isDirty = JSON.stringify(normalizedForm) !== JSON.stringify(normalizedCleanForm);
  const isValid = normalizedForm.name.length >= 2
    && normalizedForm.name.length <= 120
    && /^[A-Z0-9]{1,5}$/.test(normalizedForm.codePrefix);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      await apiPost('/company/categories', { ...form, codePrefix: normalizePrefix(form.codePrefix) });
      router.replace('/company-admin/categories');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save category.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form data-action-form="true" onSubmit={submit}>
      <div className="toolbar"><button className="button primary" disabled={!isDirty || !isValid || isSaving}>{isSaving ? 'Saving...' : 'Save Category'}</button></div>
      {error ? <div className="form-message error">{error}</div> : null}
      <Panel title="Category Fields" wide>
        <div className="form-grid">
          <label><span>Name</span><input value={form.name} minLength={2} maxLength={120} required onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label>
            <span>Code Prefix (max 5)</span>
            <input value={form.codePrefix} minLength={1} maxLength={5} pattern="[A-Z0-9]+" required onChange={(event) => setForm({ ...form, codePrefix: normalizePrefix(event.target.value) })} />
          </label>
          <label><span>Scope</span><select value={form.scope} onChange={(event) => setForm({ ...form, scope: event.target.value })}><option value="company">Company</option><option value="outlet">Outlet</option></select></label>
          <label><span>Status</span><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
        </div>
      </Panel>
    </form>
  );
}
