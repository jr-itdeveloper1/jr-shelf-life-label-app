import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { DataTable } from '@/components/DataTable';
import { ButtonLink, Panel, StatusBadge, Toolbar } from '@/components/ui';
import { apiGet, titleCase } from '@/lib/api';

type Company = { id: string; name: string; code: string; status: string; maxPrinterConnections: number | null; _count: { users: number; outlets: number; products: number; printJobs: number; devices: number } };

export default async function SiteCompaniesPage() {
  const companies = await apiGet<Company[]>('/site/companies');
  return (
    <AppShell role="site" activePath="/site-admin/companies" title="Companies" subtitle="Create, inspect, disable, and reactivate tenant companies">
      <Toolbar><ButtonLink href="/site-admin/companies/new" primary>Create Company</ButtonLink></Toolbar>
      <Panel title="Company Directory" wide>
        <DataTable
          rows={companies}
          searchPlaceholder="Search companies..."
          getSearchText={(row) => [row.name, row.code, row.status].join(' ')}
          columns={[
            { header: 'Company', render: (row) => <Link href={`/site-admin/companies/${row.id}`}>{row.name}</Link> },
            { header: 'Code', render: (row) => row.code },
            { header: 'Status', render: (row) => <StatusBadge kind={row.status === 'DISABLED' ? 'danger' : row.status === 'SETUP' ? 'warn' : 'ok'}>{titleCase(row.status)}</StatusBadge> },
            { header: 'Admins', render: (row) => row._count.users },
            { header: 'Outlets', render: (row) => row._count.outlets },
            { header: 'Printer Limit', render: (row) => formatPrinterLimit(row._count.devices, row.maxPrinterConnections) },
            { header: 'Print Jobs', render: (row) => row._count.printJobs },
          ]}
        />
      </Panel>
    </AppShell>
  );
}

function formatPrinterLimit(connected: number, max: number | null) {
  return max === null ? `${connected}/Unlimited` : `${connected}/${max}`;
}
