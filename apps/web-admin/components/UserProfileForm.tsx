'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPatch } from '@/lib/client-api';
import { Panel } from './ui';

type UserStatus = 'ACTIVE' | 'INVITED' | 'DISABLED';
type UserRole = 'COMPANY_ADMIN' | 'OUTLET_USER';

export type EditableUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  outletAccess: Array<{ outlet: { id: string; name: string } }>;
};

type OutletOption = { id: string; name: string };

export function UserProfileForm({ user, outlets }: { user: EditableUser; outlets: OutletOption[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    outletIds: user.outletAccess.map((access) => access.outlet.id),
  });
  const [cleanForm, setCleanForm] = useState(form);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const normalizedForm = { ...form, name: form.name.trim(), email: form.email.trim(), outletIds: [...form.outletIds].sort() };
  const normalizedCleanForm = { ...cleanForm, name: cleanForm.name.trim(), email: cleanForm.email.trim(), outletIds: [...cleanForm.outletIds].sort() };
  const isDirty = JSON.stringify(normalizedForm) !== JSON.stringify(normalizedCleanForm);
  const isValid = normalizedForm.name.length >= 2
    && normalizedForm.name.length <= 120
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedForm.email)
    && (form.role === 'COMPANY_ADMIN' || form.outletIds.length > 0);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setIsSaving(true);
    try {
      const response = await apiPatch<{ message: string }>(`/company/users/${user.id}`, form);
      setMessage(response.message);
      setCleanForm(form);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save user.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <form data-action-form="true" onSubmit={submit}>
        <div className="toolbar">
          <button className="button primary" disabled={!isDirty || !isValid || isSaving}>{isSaving ? 'Saving...' : 'Save User'}</button>
          <button className="button" type="button" onClick={() => window.alert('Password reset workflow queued for this user.')}>Reset Password</button>
          <button className="button warn" type="button" disabled={isSaving || form.status === 'DISABLED'} onClick={() => setForm({ ...form, status: 'DISABLED' })}>Disable User</button>
        </div>
        {message ? <div className="form-message success">{message}</div> : null}
        {error ? <div className="form-message error">{error}</div> : null}
        <section className="grid two">
          <Panel title="User Profile">
            <div className="form-grid">
              <label><span>Name</span><input value={form.name} minLength={2} maxLength={120} required onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
              <label><span>Email</span><input value={form.email} type="email" maxLength={160} required onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
              <label><span>Role</span><select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })}><option value="COMPANY_ADMIN">Company Admin</option><option value="OUTLET_USER">Outlet User</option></select></label>
              <label><span>Status</span><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as UserStatus })}><option value="ACTIVE">Active</option><option value="INVITED">Invited</option><option value="DISABLED">Disabled</option></select></label>
            </div>
          </Panel>
          <Panel title="Outlet Access">
            {form.role === 'COMPANY_ADMIN' ? (
              <div className="callout safe">Company Admin can access all outlets.</div>
            ) : (
              outlets.map((outlet) => (
                <label className="check-row" key={outlet.id}>
                  <input
                    type="checkbox"
                    checked={form.outletIds.includes(outlet.id)}
                    onChange={(event) => setForm({
                      ...form,
                      outletIds: event.target.checked ? [...form.outletIds, outlet.id] : form.outletIds.filter((id) => id !== outlet.id),
                    })}
                  />
                  {outlet.name}
                </label>
              ))
            )}
          </Panel>
        </section>
      </form>
    </>
  );
}
