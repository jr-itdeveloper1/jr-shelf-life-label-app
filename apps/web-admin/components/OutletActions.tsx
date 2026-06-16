'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExportButton } from './ExportButton';
import { apiPost } from '@/lib/client-api';

type OutletExportRow = {
  name: string;
  code: string;
  status: string;
  printJobs: number;
};

export function OutletActions({ rows }: { rows: OutletExportRow[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isDirty = name.trim().length > 0 || code.trim().length > 0;
  const isValid = name.trim().length >= 2 && name.trim().length <= 120 && /^[A-Z0-9-]{2,24}$/.test(code.trim());

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSaving(true);

    try {
      await apiPost('/company/outlets', { name, code });
      setMessage('Outlet created.');
      setName('');
      setCode('');
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create outlet.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <div className="toolbar">
        <button className="button primary" type="button" onClick={() => setIsOpen(true)}>
          Create Outlet
        </button>
        <ExportButton fileName="outlets.csv" rows={rows}>
          Export Outlets
        </ExportButton>
      </div>
      {message ? <div className="form-message success">{message}</div> : null}
      {error ? <div className="form-message error">{error}</div> : null}
      {isOpen ? (
        <div className="modal-backdrop" role="presentation">
          <form className="modal-panel" onSubmit={submit}>
            <div className="panel-head">
              <h2>Create Outlet</h2>
              <button className="button ghost" type="button" onClick={() => setIsOpen(false)}>
                Close
              </button>
            </div>
            <div className="form-grid">
              <label>
                <span>Outlet Name</span>
                <input value={name} minLength={2} maxLength={120} onChange={(event) => setName(event.target.value)} required />
              </label>
              <label>
                <span>Outlet Code (max 24)</span>
                <input value={code} minLength={2} maxLength={24} pattern="[A-Z0-9-]+" title="Use 2-24 uppercase letters, numbers, or hyphens." onChange={(event) => setCode(event.target.value.toUpperCase())} required />
              </label>
            </div>
            <div className="modal-actions">
              <button className="button primary" disabled={!isDirty || !isValid || isSaving}>
                {isSaving ? 'Saving...' : 'Save Outlet'}
              </button>
              <button className="button" type="button" onClick={() => setIsOpen(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
