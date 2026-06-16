import Link from 'next/link';
import { LanguageSelector, StatusBadge } from '@/components/ui';
import { LoginForm } from '@/components/LoginForm';
import { DemoAccounts } from '@/components/DemoAccounts';

export default function LoginPage() {
  return (
    <main className="public-main">
      <div style={{ position: 'fixed', top: 18, right: 22 }}>
        <LanguageSelector />
      </div>
      <section className="login-layout">
        <div className="login-panel">
          <div className="eyebrow">JR Label Cloud</div>
          <h1>Company admin operations</h1>
          <p>Sign in with your company admin email to manage outlets, product labels, users, printer registry, and monthly sticker analytics.</p>
          <div className="hero-actions">
            <StatusBadge>Company scoped</StatusBadge>
            <StatusBadge kind="warn">Offline print queue</StatusBadge>
            <StatusBadge>Audit trail enabled</StatusBadge>
          </div>
          <p className="muted login-alt">Site platform administrators use the separate <Link href="/site-admin/login">Site Admin login</Link>.</p>
        </div>
        <LoginForm portal="company" />
      </section>
      <DemoAccounts />
    </main>
  );
}
