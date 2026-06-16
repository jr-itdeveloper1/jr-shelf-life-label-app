import Link from 'next/link';
import { ReactNode } from 'react';
import { LanguageSelector, StatusBadge } from './ui';
import { SignOutButton } from './SignOutButton';

const siteNav = [
  ['Dashboard', '/site-admin/dashboard'],
  ['Companies', '/site-admin/companies'],
  ['Company Admins', '/site-admin/company-admins'],
  ['Global Audit', '/site-admin/audit-log'],
  ['Health & Backups', '/site-admin/system-health'],
] as const;

const companyNav = [
  ['Dashboard', '/company-admin/dashboard'],
  ['Outlets', '/company-admin/outlets'],
  ['Users', '/company-admin/users'],
  ['Devices & Printers', '/company-admin/devices-printers'],
  ['Categories', '/company-admin/categories'],
  ['Products', '/company-admin/products'],
  ['Availability', '/company-admin/availability'],
  ['Import/Export', '/company-admin/import-export'],
  ['Audit Log', '/company-admin/audit-log'],
  ['Print Analytics', '/company-admin/print-analytics'],
] as const;

const outletNav = [
  ['Dashboard', '/company-admin/dashboard'],
  ['Availability', '/company-admin/availability'],
] as const;

export function AppShell({
  role,
  activePath,
  title,
  subtitle,
  children,
}: {
  role: 'site' | 'company' | 'outlet';
  activePath: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const nav = role === 'site' ? siteNav : role === 'outlet' ? outletNav : companyNav;
  const roleLabel = role === 'site' ? 'Site Admin' : role === 'outlet' ? 'Outlet User' : 'Company Admin';

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">JR Label Cloud</div>
        <div className="brand-sub">Food Safety Compliance</div>
        <nav>
          {nav.map(([label, href]) => (
            <Link key={href} className={activePath === href ? 'active' : ''} href={href}>
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <SignOutButton />
        </div>
      </aside>
      <div className="app-shell">
        <header className="topbar">
          <div>
            <div className="eyebrow">{roleLabel}</div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="top-actions">
            <LanguageSelector />
            <StatusBadge>All synced</StatusBadge>
            <StatusBadge>Audit enabled</StatusBadge>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
