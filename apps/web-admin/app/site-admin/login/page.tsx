import Link from 'next/link';
import { LanguageSelector, StatusBadge } from '@/components/ui';
import { LoginForm } from '@/components/LoginForm';
import { DemoAccounts } from '@/components/DemoAccounts';

export default function SiteAdminLoginPage() {
  return (
    <main className="public-main">
      <div style={{ position: 'fixed', top: 18, right: 22 }}>
        <LanguageSelector />
      </div>
      <section className="login-layout">
        <div className="login-panel">
          <div className="eyebrow">JR Label Cloud</div>
          <h1>Site admin access</h1>
          <p>Use this separate platform login to manage companies, company admins, backups, system health, and global audit logs.</p>
          <div className="hero-actions">
            <StatusBadge>Platform scoped</StatusBadge>
            <StatusBadge kind="warn">High privilege</StatusBadge>
            <StatusBadge>Global audit enabled</StatusBadge>
          </div>
          <p className="muted login-alt">Company administrators should use the default <Link href="/login">Company Admin login</Link>.</p>
        </div>
        <LoginForm portal="site" />
      </section>
      <DemoAccounts />
    </main>
  );
}
