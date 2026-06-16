import { AppShell } from '@/components/AppShell';
import { DataTable } from '@/components/DataTable';
import { Panel, StatusBadge, Toolbar, ActionButton } from '@/components/ui';
import { apiGet, formatDate, titleCase } from '@/lib/api';

type Audit = { createdAt: string; action: string; recordType: string; risk: string; company?: { name: string } | null; actor?: { name: string } | null };

export default async function SiteAuditLogPage() {
  const rows = await apiGet<Audit[]>('/site/audit-log');
  return (
    <AppShell role="site" activePath="/site-admin/audit-log" title="Global Audit Log" subtitle="Append-only platform audit trail">
      <Toolbar><ActionButton primary>Export Audit CSV</ActionButton></Toolbar>
      <Panel title="Audit Events" wide>
        <DataTable
          rows={rows}
          searchPlaceholder="Filter audit by company, actor, action..."
          getSearchText={(row) => [row.company?.name, row.actor?.name, row.action, row.recordType, row.risk].join(' ')}
          columns={[
            { header: 'Time', render: (row) => formatDate(row.createdAt) },
            { header: 'Company', render: (row) => row.company?.name ?? 'Platform' },
            { header: 'Actor', render: (row) => row.actor?.name ?? 'System' },
            { header: 'Action', render: (row) => row.action },
            { header: 'Risk', render: (row) => <StatusBadge kind={row.risk === 'high' ? 'danger' : row.risk === 'medium' ? 'warn' : 'ok'}>{titleCase(row.risk)}</StatusBadge> },
          ]}
        />
      </Panel>
    </AppShell>
  );
}
