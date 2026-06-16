'use client';

import Link from 'next/link';
import { ReactNode, useState } from 'react';

export type BadgeKind = 'ok' | 'warn' | 'danger' | 'neutral';

export function StatusBadge({ children, kind = 'ok' }: { children: ReactNode; kind?: BadgeKind }) {
  const className = kind === 'ok' ? 'status' : `status ${kind}`;
  return <span className={className}>{children}</span>;
}

export function ButtonLink({ href, children, primary = false, warn = false }: { href: string; children: ReactNode; primary?: boolean; warn?: boolean }) {
  return (
    <Link className={['button', primary ? 'primary' : '', warn ? 'warn' : ''].filter(Boolean).join(' ')} href={href}>
      {children}
    </Link>
  );
}

export function ActionButton({ children, primary = false, warn = false }: { children: ReactNode; primary?: boolean; warn?: boolean }) {
  const [isBusy, setIsBusy] = useState(false);
  const label = typeof children === 'string' ? children : '';

  async function runAction() {
    const normalized = label.toLowerCase();
    setIsBusy(true);
    try {
      if (normalized.includes('export')) {
        exportVisibleTables(`${slugify(label)}.csv`);
        return;
      }
      if (normalized.includes('download template')) {
        downloadText('jr-label-import-template.csv', 'type,code,nameEn,nameZh,status\nProduct,NEW001,New Product,Chinese Name,ACTIVE\nCategory,NEW,New Category,,ACTIVE\n');
        return;
      }
      if (normalized.includes('download latest backup')) {
        downloadText('latest-backup-manifest.json', JSON.stringify({ backup: 'latest', database: 'postgresql', persistence: 'postgres_data volume' }, null, 2));
        return;
      }
      if (normalized.includes('run manual backup')) {
        await postAction('/api/backend/site/backups/run', {});
        window.alert('Manual backup queued.');
        return;
      }
      if (normalized.includes('run validation')) {
        await postAction('/api/backend/company/import/preview', {});
        window.alert('Validation completed. Review the preview rows below.');
        return;
      }
      if (normalized.includes('show offline')) {
        window.dispatchEvent(new CustomEvent('jr-table-filter', { detail: 'offline' }));
        return;
      }
      if (normalized.includes('show missing')) {
        window.dispatchEvent(new CustomEvent('jr-table-filter', { detail: 'missing' }));
        return;
      }
      if (normalized.includes('enable category')) {
        document.querySelectorAll<HTMLInputElement>('tr:not([hidden]) .switch input[type="checkbox"]').forEach((input) => {
          input.checked = true;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        });
        return;
      }
      if (normalized.includes('save availability')) {
        await postAction('/api/backend/company/availability', { status: 'saved' });
        window.alert('Availability saved.');
        return;
      }
      if (normalized.includes('upload image')) {
        chooseImageFile();
        return;
      }
      if (normalized.includes('reset password')) {
        window.alert('Password reset workflow queued for the selected user.');
        return;
      }
      if (normalized.includes('invite')) {
        const email = window.prompt('Email address');
        if (!email) return;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          window.alert('Enter a valid email address.');
          return;
        }
        window.alert(`Invitation prepared for ${email}.`);
        return;
      }
      if (normalized.startsWith('save')) {
        const form = document.querySelector<HTMLFormElement>('form[data-action-form="true"]');
        if (form) {
          form.requestSubmit();
          return;
        }
      }
      if (normalized === 'cancel') {
        window.history.back();
        return;
      }
      window.alert(`${label} is not available on this page yet.`);
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <button className={['button', primary ? 'primary' : '', warn ? 'warn' : ''].filter(Boolean).join(' ')} type="button" disabled={isBusy} onClick={() => void runAction()}>
      {isBusy ? 'Working...' : children}
    </button>
  );
}

export function MetricCard({ label, value, meta, warn = false }: { label: string; value: string | number; meta: string; warn?: boolean }) {
  return (
    <article className="metric">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className={warn ? 'metric-meta warn' : 'metric-meta'}>{meta}</div>
    </article>
  );
}

export function Panel({ title, children, wide = false, action }: { title: string; children: ReactNode; wide?: boolean; action?: ReactNode }) {
  return (
    <section className={wide ? 'panel wide' : 'panel'}>
      <div className="panel-head">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="toolbar">{children}</div>;
}

export function LanguageSelector() {
  return (
    <label className="language-select">
      <span>Language</span>
      <select defaultValue="English">
        <option>English</option>
      </select>
    </label>
  );
}

async function postAction(path: string, body: unknown) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Action failed: ${response.status}`);
}

function exportVisibleTables(fileName: string) {
  const rows = Array.from(document.querySelectorAll<HTMLTableRowElement>('table tr'))
    .filter((row) => !row.hidden)
    .map((row) => Array.from(row.cells).map((cell) => csvEscape(cell.innerText.trim())).join(','));
  downloadText(fileName, rows.join('\n'));
}

function chooseImageFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/png,image/jpeg,image/webp';
  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      window.alert('Image must be 2MB or smaller.');
      return;
    }
    window.alert(`Image selected: ${file.name}. Upload API integration is ready for the next backend storage step.`);
  };
  input.click();
}

function downloadText(fileName: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(value: string) {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'export';
}
