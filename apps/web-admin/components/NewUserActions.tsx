'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExportButton } from './ExportButton';
import { apiPost } from '@/lib/client-api';

type UserRole = 'COMPANY_ADMIN' | 'OUTLET_USER';
type UserStatus = 'ACTIVE' | 'INVITED' | 'DISABLED';
type OutletOption = { id: string; name: string };
type UserExportRow = { name: string; email: string; role: string; outletAccess: string; status: string };
const initialUserForm = {
  name: '',
  email: '',
  role: 'OUTLET_USER' as UserRole,
  status: 'ACTIVE' as UserStatus,
  password: 'ChangeMe123!',
  outletIds: [] as string[],
};

export function NewUserActions({ outlets, rows }: { outlets: OutletOption[]; rows: UserExportRow[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(initialUserForm);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const normalizedForm = { ...form, name: form.name.trim(), email: form.email.trim(), outletIds: [...form.outletIds].sort() };
  const normalizedInitialForm = { ...initialUserForm, outletIds: [...initialUserForm.outletIds].sort() };
  const isDirty = JSON.stringify(normalizedForm) !== JSON.stringify(normalizedInitialForm);
  const isValid = normalizedForm.name.length >= 2
    && normalizedForm.name.length <= 120
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedForm.email)
    && form.password.length >= 8
    && form.password.length <= 128
    && (form.role === 'COMPANY_ADMIN' || form.outletIds.length > 0);

  function toggleOutlet(outletId: string) {
    setForm((current) => ({
      ...current,
      outletIds: current.outletIds.includes(outletId) ? current.outletIds.filter((id) => id !== outletId) : [...current.outletIds, outletId],
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (form.role === 'OUTLET_USER' && form.outletIds.length === 0) {
      setError('Outlet User requires at least one outlet.');
      return;
    }
    setIsSaving(true);
    try {
      await apiPost('/company/users', form);
      setMessage('User created.');
      setIsOpen(false);
      setForm(initialUserForm);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create user.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <div className="toolbar">
        <button className="button primary" type="button" onClick={() => setIsOpen(true)}>New User</button>
        <ExportButton fileName="users.csv" rows={rows}>Export Users</ExportButton>
      </div>
      {message ? <div className="form-message success">{message}</div> : null}
      {error ? <div className="form-message error">{error}</div> : null}
      {isOpen ? (
        <div className="modal-backdrop" role="presentation">
          <form className="modal-panel" onSubmit={submit}>
            <div className="panel-head">
              <h2>New User</h2>
              <button className="button ghost" type="button" onClick={() => setIsOpen(false)}>Close</button>
            </div>
            <div className="form-grid">
              <label><span>Name</span><input value={form.name} minLength={2} maxLength={120} required onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
              <label><span>Email</span><input value={form.email} type="email" maxLength={160} required onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
              <label><span>Role</span><select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as UserRole, outletIds: event.target.value === 'COMPANY_ADMIN' ? [] : form.outletIds })}><option value="OUTLET_USER">Outlet User</option><option value="COMPANY_ADMIN">Company Admin</option></select></label>
              <label><span>Status</span><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as UserStatus })}><option value="ACTIVE">Active</option><option value="INVITED">Invited</option><option value="DISABLED">Disabled</option></select></label>
              <label><span>Temporary Password</span><input value={form.password} minLength={8} maxLength={128} required onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
            </div>
            {form.role === 'OUTLET_USER' ? (
              <div className="checkbox-grid">
                {outlets.map((outlet) => (
                  <label className="check-row" key={outlet.id}>
                    <input type="checkbox" checked={form.outletIds.includes(outlet.id)} onChange={() => toggleOutlet(outlet.id)} />
                    {outlet.name}
                  </label>
                ))}
              </div>
            ) : <div className="callout safe">Company Admin can manage all outlets.</div>}
            <div className="modal-actions">
              <button className="button primary" disabled={!isDirty || !isValid || isSaving}>{isSaving ? 'Saving...' : 'Save User'}</button>
              <button className="button" type="button" onClick={() => setIsOpen(false)}>Cancel</button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
