'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { apiPatch } from '@/lib/client-api';
import { ButtonLink, Panel } from './ui';

type OutletStatus = 'ACTIVE' | 'DISABLED';

export type EditableOutlet = {
  id: string;
  name: string;
  code: string;
  status: OutletStatus;
  updatedAt?: string;
};

type OutletSaveResponse = {
  data: EditableOutlet;
  message: string;
};

export function OutletProfileForm({ outlet }: { outlet: EditableOutlet }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: outlet.name,
    code: outlet.code,
    status: outlet.status,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const initial = useMemo(
    () => ({
      name: outlet.name,
      code: outlet.code,
      status: outlet.status,
    }),
    [outlet.code, outlet.name, outlet.status],
  );

  const isDirty = JSON.stringify(form) !== JSON.stringify(initial);
  const isValid =
    form.name.trim().length >= 2 &&
    form.name.trim().length <= 120 &&
    /^[A-Z0-9-]{2,24}$/.test(form.code.trim());

  async function save(nextForm = form) {
    setError(null);
    setMessage(null);
    setIsSaving(true);
    try {
      const response = await apiPatch<OutletSaveResponse>(`/company/outlets/${outlet.id}`, {
        ...nextForm,
        updatedAt: outlet.updatedAt,
      });
      setMessage(response.message);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save outlet.');
    } finally {
      setIsSaving(false);
    }
  }

  async function disableOutlet() {
    if (!window.confirm('Disable this outlet? It will no longer appear for mobile outlet selection after sync.')) {
      return;
    }
    const nextForm = { ...form, status: 'DISABLED' as OutletStatus };
    setForm(nextForm);
    await save(nextForm);
  }

  return (
    <>
      <div className="toolbar">
        <button className="button primary" disabled={!isDirty || !isValid || isSaving || isPending} onClick={() => void save()}>
          {isSaving ? 'Saving...' : 'Save Outlet'}
        </button>
        <ButtonLink href="/company-admin/availability">Product Availability</ButtonLink>
        <button className="button warn" disabled={isSaving || isPending || form.status === 'DISABLED'} onClick={() => void disableOutlet()}>
          Disable Outlet
        </button>
      </div>
      {message ? <div className="form-message success">{message}</div> : null}
      {error ? <div className="form-message error">{error}</div> : null}
      <section className="grid two">
        <Panel title="Outlet Profile">
          <div className="form-grid">
            <label>
              <span>Outlet Name</span>
              <input value={form.name} minLength={2} maxLength={120} required onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </label>
            <label>
              <span>Outlet Code (max 24)</span>
              <input value={form.code} minLength={2} maxLength={24} pattern="[A-Z0-9-]+" title="Use 2-24 uppercase letters, numbers, or hyphens." required onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} />
            </label>
            <label>
              <span>Status</span>
              <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as OutletStatus })}>
                <option value="ACTIVE">Active</option>
                <option value="DISABLED">Disabled</option>
              </select>
            </label>
          </div>
        </Panel>
        <Panel title="Operational Notes">
          <div className="callout safe">Recent print jobs include label type, printer name, and MAC address snapshots for audit and support.</div>
          <div className="callout">Changing outlet status is audited. Disabled outlets are removed from mobile outlet selection after the next sync.</div>
        </Panel>
      </section>
    </>
  );
}
