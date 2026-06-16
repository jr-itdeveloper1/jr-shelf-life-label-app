import { ButtonLink } from '@/components/ui';

export default function HomePage() {
  return (
    <main className="public-main">
      <section className="hero">
        <div className="hero-panel">
          <div className="eyebrow">Food Safety Compliance Style</div>
          <h1>JR Label Cloud</h1>
          <p>Admin website for company master labels, outlets, users, printer tracking, and monthly sticker analytics.</p>
          <div className="hero-actions">
            <ButtonLink href="/login" primary>Company Admin Login</ButtonLink>
            <ButtonLink href="/site-admin/login">Site Admin Login</ButtonLink>
          </div>
        </div>
        <div className="hero-card">
          <div className="safe-badge">HACCP-ready UI</div>
          <h2>Clear status semantics</h2>
          <ul>
            <li>Green: safe and synced</li>
            <li>Amber: action needed</li>
            <li>Red: blocked or failed</li>
            <li>Audit-first admin flows</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
