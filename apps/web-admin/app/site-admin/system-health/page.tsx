import { AppShell } from '@/components/AppShell';
import { ActionButton, MetricCard, Panel, StatusBadge, Toolbar } from '@/components/ui';
import { apiGet } from '@/lib/api';

type Health = { api: { status: string; p95Ms: number }; postgres: { status: string; persistence: string }; backup: { latest: string; status: string; retentionDays: number }; disk: { usedPercent: number }; restoreChecklist: string[] };

export default async function SystemHealthPage() {
  const health = await apiGet<Health>('/site/system-health');
  return (
    <AppShell role="site" activePath="/site-admin/system-health" title="System Health & Backups" subtitle="Service status, database persistence, and backup readiness">
      <Toolbar><ActionButton primary>Run Manual Backup</ActionButton><ActionButton>Download Latest Backup</ActionButton></Toolbar>
      <section className="metrics">
        <MetricCard label="API" value={health.api.status} meta={`p95 ${health.api.p95Ms}ms`} />
        <MetricCard label="PostgreSQL" value={health.postgres.status} meta="volume mounted" />
        <MetricCard label="Latest Backup" value={health.backup.latest} meta={health.backup.status} />
        <MetricCard label="Disk" value={`${health.disk.usedPercent}%`} meta="used" warn />
      </section>
      <Panel title="Persistence Safety" wide>
        <div className="callout safe"><strong>Safe:</strong> Rebuild or refresh web/API containers. PostgreSQL data remains in postgres_data.</div>
        <div className="callout warn"><strong>Restore checklist:</strong> {health.restoreChecklist.join(' -> ')}</div>
      </Panel>
    </AppShell>
  );
}
