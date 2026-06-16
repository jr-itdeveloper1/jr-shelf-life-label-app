import { AppShell } from '@/components/AppShell';
import { DataTable } from '@/components/DataTable';
import { ActionButton, Panel, StatusBadge, Toolbar } from '@/components/ui';
import { apiGet, titleCase } from '@/lib/api';

type AdminUser = { name: string; email: string; status: string; company?: { name: string } | null };

export default async function SiteCompanyAdminsPage() {
  const users = await apiGet<AdminUser[]>('/site/company-admins');
  return (
    <AppShell role="site" activePath="/site-admin/company-admins" title="Company Admin Users" subtitle="Manage company administrator accounts">
      <Toolbar><ActionButton primary>Invite Company Admin</ActionButton><ActionButton>Reset Password</ActionButton></Toolbar>
      <Panel title="Company Admins" wide>
        <DataTable
          rows={users}
          searchPlaceholder="Search admins..."
          getSearchText={(row) => [row.name, row.email, row.company?.name, row.status].join(' ')}
          columns={[
            { header: 'Name', render: (row) => row.name },
            { header: 'Email', render: (row) => row.email },
            { header: 'Company', render: (row) => row.company?.name ?? 'Platform' },
            { header: 'Status', render: (row) => <StatusBadge kind={row.status === 'DISABLED' ? 'danger' : row.status === 'INVITED' ? 'warn' : 'ok'}>{titleCase(row.status)}</StatusBadge> },
          ]}
        />
      </Panel>
    </AppShell>
  );
}
