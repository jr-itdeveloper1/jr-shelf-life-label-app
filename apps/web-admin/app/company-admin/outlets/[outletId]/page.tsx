import { AppShell } from '@/components/AppShell';
import { DataTable } from '@/components/DataTable';
import { OutletProfileForm } from '@/components/OutletProfileForm';
import { Panel, StatusBadge } from '@/components/ui';
import { apiGet, formatDate, titleCase } from '@/lib/api';

type OutletDetail = {
  outlet: { id: string; name: string; code: string; status: 'ACTIVE' | 'DISABLED'; updatedAt?: string } | null;
  printJobs: Array<{
    printedAt: string;
    labelType: string;
    labelSize: string;
    productCodeSnapshot: string;
    productNameSnapshot: string;
    quantity: number;
    printerName?: string | null;
    printerMacAddress?: string | null;
    uploadStatus: string;
  }>;
};

export default async function OutletDetailPage({ params }: { params: Promise<{ outletId: string }> }) {
  const { outletId } = await params;
  const data = await apiGet<OutletDetail>(`/company/outlets/${outletId}`);
  const outlet = data.outlet;

  return (
    <AppShell role="company" activePath="/company-admin/outlets" title={outlet ? `Outlet Detail: ${outlet.name}` : 'Outlet Detail'} subtitle="Outlet profile, users, availability, and recent print jobs">
      {outlet ? <OutletProfileForm outlet={outlet} /> : <Panel title="Outlet Profile">Outlet not found.</Panel>}
      <Panel title="Recent Print Jobs" wide>
        <DataTable
          rows={data.printJobs}
          searchPlaceholder="Search print jobs..."
          getSearchText={(row) => [row.productCodeSnapshot, row.productNameSnapshot, row.labelType, row.printerName, row.printerMacAddress].join(' ')}
          columns={[
            { header: 'Time', render: (row) => formatDate(row.printedAt) },
            { header: 'Label Type', render: (row) => `${titleCase(row.labelType)} ${row.labelSize}` },
            { header: 'Product', render: (row) => `${row.productCodeSnapshot} ${row.productNameSnapshot}` },
            { header: 'Qty', render: (row) => row.quantity },
            { header: 'Printer', render: (row) => row.printerName ?? 'Unknown' },
            { header: 'MAC Address', render: (row) => <code>{row.printerMacAddress ?? 'Pending'}</code> },
            { header: 'Upload', render: (row) => <StatusBadge kind={row.uploadStatus === 'PENDING' ? 'warn' : row.uploadStatus === 'FAILED' ? 'danger' : 'ok'}>{titleCase(row.uploadStatus)}</StatusBadge> },
          ]}
        />
      </Panel>
    </AppShell>
  );
}
