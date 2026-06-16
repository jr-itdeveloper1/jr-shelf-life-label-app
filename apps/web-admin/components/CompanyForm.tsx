'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPatch, apiPost } from '@/lib/client-api';
import { Panel } from './ui';

type CompanyStatus = 'ACTIVE' | 'SETUP' | 'DISABLED';

export function CompanyForm({
  mode,
  company,
}: {
  mode: 'create' | 'edit';
  company?: { id: string; name: string; code: string; status: CompanyStatus; maxPrinterConnections?: number | null; printJobs?: number };
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: company?.name ?? 'JR Foods',
    code: company?.code ?? 'JRFOODS',
    status: company?.status ?? 'SETUP' as CompanyStatus,
    maxPrinterConnections: company?.maxPrinterConnections ?? 10,
    unlimitedPrinters: company?.maxPrinterConnections === null,
    primaryAdminEmail: 'admin@jrfoods.example',
  });
  const [cleanForm, setCleanForm] = useState(form);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isDirty = JSON.stringify(form) !== JSON.stringify(cleanForm);
  const isValid = form.name.trim().length >= 2
    && form.name.trim().length <= 120
    && /^[A-Z0-9-]{2,24}$/.test(form.code.trim())
    && (form.unlimitedPrinters || (Number.isInteger(form.maxPrinterConnections) && form.maxPrinterConnections >= 1 && form.maxPrinterConnections <= 999))
    && (mode === 'edit' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.primaryAdminEmail));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSaving(true);
    try {
      const payload = {
        ...form,
        maxPrinterConnections: form.unlimitedPrinters ? null : form.maxPrinterConnections,
      };
      if (mode === 'create') {
        const response = await apiPost<{ data: { id: string }; message: string }>('/site/companies', payload);
        setMessage(response.message);
        router.replace(`/site-admin/companies/${response.data.id}`);
      } else {
        const response = await apiPatch<{ message: string }>(`/site/companies/${company?.id}`, payload);
        setMessage(response.message);
        setCleanForm(form);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save company.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form data-action-form="true" onSubmit={submit}>
      <div className="toolbar">
        <button className="button primary" disabled={!isDirty || !isValid || isSaving}>{isSaving ? 'Saving...' : 'Save Company'}</button>
        <button className="button" type="button" onClick={() => router.back()}>Cancel</button>
      </div>
      {message ? <div className="form-message success">{message}</div> : null}
      {error ? <div className="form-message error">{error}</div> : null}
      <Panel title="Company Setup" wide>
        <div className="form-grid">
          <label><span>Company Name</span><input value={form.name} minLength={2} maxLength={120} required onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label><span>Company Code</span><input value={form.code} minLength={2} maxLength={24} pattern="[A-Z0-9-]+" required onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} /></label>
          <label><span>Status</span><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as CompanyStatus })}><option value="ACTIVE">Active</option><option value="SETUP">Setup</option><option value="DISABLED">Disabled</option></select></label>
          <label><span>Printer Limit Type</span><select value={form.unlimitedPrinters ? 'UNLIMITED' : 'LIMITED'} onChange={(event) => setForm({ ...form, unlimitedPrinters: event.target.value === 'UNLIMITED' })}><option value="LIMITED">Limited</option><option value="UNLIMITED">Unlimited</option></select></label>
          {!form.unlimitedPrinters ? (
            <>
              <label><span>Max Printer Connections</span><input value={form.maxPrinterConnections} type="number" min={1} max={999} required onChange={(event) => setForm({ ...form, maxPrinterConnections: Number(event.target.value) })} /></label>
              {mode === 'edit' ? <label><span>Print Jobs</span><input value={company?.printJobs ?? 0} readOnly disabled aria-readonly="true" /></label> : null}
            </>
          ) : null}
          {mode === 'create' ? <label><span>Primary Admin Email</span><input value={form.primaryAdminEmail} type="email" maxLength={160} required onChange={(event) => setForm({ ...form, primaryAdminEmail: event.target.value })} /></label> : null}
        </div>
      </Panel>
    </form>
  );
}
