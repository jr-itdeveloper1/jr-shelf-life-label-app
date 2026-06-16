import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { DataTable } from '@/components/DataTable';
import { NewUserActions } from '@/components/NewUserActions';
import { Panel, StatusBadge } from '@/components/ui';
import { apiGet, titleCase } from '@/lib/api';

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  outletAccess: Array<{ outlet: { name: string } }>;
};

type OutletOption = { id: string; name: string };

export default async function Page() {
  const [users, outlets] = await Promise.all([
    apiGet<UserRow[]>('/company/users'),
    apiGet<OutletOption[]>('/company/outlets'),
  ]);

  return (
    <AppShell role="company" activePath="/company-admin/users" title="Users" subtitle="Company users and outlet access">
      <NewUserActions
        outlets={outlets}
        rows={users.map((user) => ({
          name: user.name,
          email: user.email,
          role: titleCase(user.role),
          outletAccess: user.role === 'COMPANY_ADMIN' ? 'All outlets' : user.outletAccess.map((access) => access.outlet.name).join(', '),
          status: titleCase(user.status),
        }))}
      />
      <Panel title="User Directory" wide>
        <DataTable
          rows={users}
          getSearchText={(row) => [row.name, row.email, row.role, row.status, row.outletAccess.map((access) => access.outlet.name).join(' ')].join(' ')}
          columns={[
            { header: 'Name', render: (row) => <Link href={`/company-admin/users/${row.id}`}>{row.name}</Link> },
            { header: 'Email', render: (row) => row.email },
            { header: 'Role', render: (row) => titleCase(row.role) },
            { header: 'Outlet Access', render: (row) => row.role === 'COMPANY_ADMIN' ? 'All outlets' : row.outletAccess.map((access) => access.outlet.name).join(', ') || 'No outlets assigned' },
            { header: 'Status', render: (row) => <StatusBadge kind={row.status === 'INVITED' ? 'warn' : row.status === 'DISABLED' ? 'danger' : 'ok'}>{titleCase(row.status)}</StatusBadge> },
          ]}
        />
      </Panel>
    </AppShell>
  );
}
