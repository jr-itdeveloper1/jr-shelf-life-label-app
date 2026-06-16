import { AppShell } from '@/components/AppShell';
import { MetricCard, Panel, StatusBadge } from '@/components/ui';
import { apiGet } from '@/lib/api';

type Dashboard = {
  metrics: { companies: number; outlets: number; devices: number; printJobs: number; auditEvents: number };
  workQueue: { label: string; status: string; kind: 'ok' | 'warn' | 'danger' }[];
  health: Record<string, string | number>;
};

export default async function SiteDashboardPage() {
  const data = await apiGet<Dashboard>('/site/dashboard');

  return (
    <AppShell role="site" activePath="/site-admin/dashboard" title="Site Admin Dashboard" subtitle="Platform-wide view of companies, sync health, and backups">
      <section className="metrics">
        <MetricCard label="Companies" value={data.metrics.companies} meta="platform tenants" />
        <MetricCard label="Outlets" value={data.metrics.outlets} meta="active locations" />
        <MetricCard label="Known Devices" value={data.metrics.devices} meta="printer registry" />
        <MetricCard label="Audit Events" value={data.metrics.auditEvents} meta="latest activity" warn />
      </section>
      <section className="grid two">
        <Panel title="Platform Work Queue">
          <ul className="work-list">
            {data.workQueue.map((item) => (
              <li key={item.label}><span>{item.label}</span><StatusBadge kind={item.kind}>{item.status}</StatusBadge></li>
            ))}
          </ul>
        </Panel>
        <Panel title="Service Health">
          <ul className="work-list">
            <li><span>API</span><StatusBadge>{String(data.health.api)}</StatusBadge></li>
            <li><span>PostgreSQL</span><StatusBadge>{String(data.health.postgres)}</StatusBadge></li>
            <li><span>Backup</span><StatusBadge kind="warn">{String(data.health.backup)}</StatusBadge></li>
            <li><span>Storage</span><StatusBadge>{String(data.health.storage)}</StatusBadge></li>
          </ul>
        </Panel>
      </section>
    </AppShell>
  );
}
