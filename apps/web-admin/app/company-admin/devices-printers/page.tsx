import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { DataTable } from '@/components/DataTable';
import { DevicePrinterRegistry } from '@/components/DevicePrinterRegistry';
import { ActionButton, ButtonLink, MetricCard, Panel, StatusBadge, Toolbar } from '@/components/ui';
import { apiGet, formatDate, titleCase } from '@/lib/api';

export default async function Page() {
  const data = await loadData('devices');
  return (
    <AppShell role="company" activePath="/company-admin/devices-printers" title="Devices & Printers" subtitle="Track app devices, selected printer names, MAC addresses, and latest connection status">
      {renderPage('devices', data)}
    </AppShell>
  );
}

async function loadData(kind: string) {
  switch (kind) {
    case 'dashboard': return apiGet<any>('/company/dashboard');
    case 'outlets': return apiGet<any[]>('/company/outlets');
    case 'users': return apiGet<any[]>('/company/users');
    case 'devices': return apiGet<any>('/company/devices-printers');
    case 'products': return apiGet<any[]>('/company/products');
    case 'categories': return apiGet<any[]>('/company/categories');
    case 'availability': return apiGet<any[]>('/company/availability');
    case 'images': return apiGet<any[]>('/company/product-images');
    case 'companyAudit': return apiGet<any[]>('/company/audit-log');
    case 'analytics': return apiGet<any>('/company/print-analytics/monthly?month=2026-06');
    case 'importExport': return apiGet<any>('/company/import/preview');
    default: return {};
  }
}

function renderPage(kind: string, data: any) {
  if (kind === 'dashboard') {
    return <>
      <section className="metrics">
        <MetricCard label="Outlets" value={data.metrics.outlets} meta="active" />
        <MetricCard label="Products" value={data.metrics.products} meta="printable" />
        <MetricCard label="Printed Today" value={data.metrics.printedToday} meta="all label types" />
        <MetricCard label="Known Printers" value={data.metrics.knownPrinters} meta="MAC recorded" warn />
      </section>
      <section className="grid two">
        <Panel title="Food Safety Work Queue"><ul className="work-list">{data.workQueue.map((item: any) => <li key={item.label}><span>{item.label}</span><StatusBadge kind={item.kind}>{item.status}</StatusBadge></li>)}</ul></Panel>
        <Panel title="Printer Tracking" action={<Link href="/company-admin/devices-printers">Open registry</Link>}><div className="callout safe">Each mobile app records selected printer name and MAC address, then snapshots both fields on PrintJob upload.</div></Panel>
      </section>
      <Panel title="Monthly Sticker Snapshot" wide action={<Link href="/company-admin/print-analytics">Open report</Link>}>
        <DataTable rows={data.monthlyTotals} searchPlaceholder="Search outlet..." getSearchText={(row: any) => row.outletName} columns={[
          { header: 'Outlet', render: (row: any) => row.outletName },
          { header: 'Product 60x40', render: (row: any) => row.productLabel60x40 },
          { header: 'Compact 40x20', render: (row: any) => row.compactProductLabel40x20 },
          { header: 'Timestamp 40x30', render: (row: any) => row.timestampLabel40x30 },
          { header: 'Total Stickers', render: (row: any) => row.totalStickers },
        ]} />
      </Panel>
    </>;
  }

  if (kind === 'outlets') {
    return <><Toolbar><ActionButton primary>Create Outlet</ActionButton><ActionButton>Export Outlets</ActionButton></Toolbar><Panel title="Outlet Directory" wide><DataTable rows={data} getSearchText={(row: any) => [row.name,row.code,row.status].join(' ')} columns={[
      { header: 'Outlet', render: (row: any) => <Link href={`/company-admin/outlets/${row.id}`}>{row.name}</Link> },
      { header: 'Code', render: (row: any) => row.code },
      { header: 'Status', render: (row: any) => <StatusBadge kind={row.status === 'DISABLED' ? 'danger' : 'ok'}>{titleCase(row.status)}</StatusBadge> },
      { header: 'Print Jobs', render: (row: any) => row._count.printJobs },
    ]} /></Panel></>;
  }

  if (kind === 'users') {
    return <><Toolbar><ActionButton primary>Invite User</ActionButton><ActionButton>Export Users</ActionButton></Toolbar><Panel title="User Directory" wide><DataTable rows={data} getSearchText={(row: any) => [row.name,row.email,row.role,row.status].join(' ')} columns={[
      { header: 'Name', render: (row: any) => <Link href={`/company-admin/users/${row.id}`}>{row.name}</Link> },
      { header: 'Email', render: (row: any) => row.email },
      { header: 'Role', render: (row: any) => titleCase(row.role) },
      { header: 'Outlet Access', render: (row: any) => row.outletAccess?.map((access: any) => access.outlet.name).join(', ') || 'All outlets' },
      { header: 'Status', render: (row: any) => <StatusBadge kind={row.status === 'INVITED' ? 'warn' : row.status === 'DISABLED' ? 'danger' : 'ok'}>{titleCase(row.status)}</StatusBadge> },
    ]} /></Panel></>;
  }

  if (kind === 'devices') {
    const devices = data.devices ?? [];
    const quota = data.printerQuota ?? { connectedPrinters: devices.length, maxPrinterConnections: null, isUnlimited: true };
    const limitText = quota.isUnlimited ? `${quota.connectedPrinters}/Unlimited` : `${quota.connectedPrinters}/${quota.maxPrinterConnections}`;
    const isAtLimit = !quota.isUnlimited && quota.connectedPrinters >= quota.maxPrinterConnections;
    return <>
      <section className="metrics">
        <MetricCard label="Connected Printers" value={quota.connectedPrinters} meta="registered printer identities" />
        <MetricCard label="Printer Limit" value={limitText} meta={quota.isUnlimited ? 'unlimited company limit' : 'site admin setting'} warn={isAtLimit} />
      </section>
      <Toolbar><ActionButton primary>Export Printer Registry</ActionButton></Toolbar>
      <DevicePrinterRegistry devices={devices} />
    </>;
  }

  if (kind === 'products') {
    return <><Toolbar><ButtonLink href="/company-admin/products/new" primary>Create Product</ButtonLink><ButtonLink href="/company-admin/import-export">Bulk Import</ButtonLink></Toolbar><Panel title="Products" wide><DataTable rows={data} searchPlaceholder="Search product code, English, Chinese, storage..." getSearchText={(row: any) => [row.productCode,row.nameEn,row.nameZh,row.storageMethodEn].join(' ')} columns={[
      { header: 'Code', render: (row: any) => <Link href={`/company-admin/products/${row.id}`}>{row.productCode}</Link> },
      { header: 'English Name', render: (row: any) => row.nameEn },
      { header: 'Chinese Name', render: (row: any) => row.nameZh },
      { header: 'Shelf Life', render: (row: any) => row.daysToExpire > 0 ? row.daysToExpire + ' day(s)' : row.hoursToExpire + ' hour(s)' },
      { header: 'Storage', render: (row: any) => row.storageMethodEn },
      { header: 'Status', render: (row: any) => <StatusBadge kind={row.active ? 'ok' : 'danger'}>{row.active ? 'Active' : 'Inactive'}</StatusBadge> },
    ]} /></Panel></>;
  }

  if (kind === 'categories') {
    return <><Toolbar><ButtonLink href="/company-admin/categories/new" primary>Create Category</ButtonLink></Toolbar><Panel title="Categories" wide><DataTable rows={data} getSearchText={(row: any) => [row.name,row.codePrefix,row.scope,row.status].join(' ')} columns={[
      { header: 'Name', render: (row: any) => <Link href={`/company-admin/categories/${row.id}`}>{row.name}</Link> },
      { header: 'Prefix', render: (row: any) => row.codePrefix },
      { header: 'Scope', render: (row: any) => titleCase(row.scope) },
      { header: 'Products', render: (row: any) => row._count.products },
      { header: 'Status', render: (row: any) => <StatusBadge>{titleCase(row.status)}</StatusBadge> },
    ]} /></Panel></>;
  }

  if (kind === 'availability') {
    return <><Toolbar><ActionButton primary>Save Availability</ActionButton><ActionButton>Enable Category</ActionButton></Toolbar><Panel title="Availability Matrix" wide><DataTable rows={data} searchPlaceholder="Search product availability..." getSearchText={(row: any) => [row.outlet.name,row.product.productCode,row.product.nameEn,row.product.category.name].join(' ')} columns={[
      { header: 'Enabled', render: (row: any) => <label className="switch"><input type="checkbox" defaultChecked={row.active} /><span /></label> },
      { header: 'Code', render: (row: any) => row.product.productCode },
      { header: 'Product', render: (row: any) => row.product.nameEn },
      { header: 'Category', render: (row: any) => row.product.category.name },
      { header: 'Product Status', render: (row: any) => <StatusBadge kind={row.product.active ? 'ok' : 'danger'}>{row.product.active ? 'Active' : 'Inactive'}</StatusBadge> },
    ]} /></Panel></>;
  }

  if (kind === 'images') {
    return <><Toolbar><ActionButton primary>Upload Image</ActionButton><ActionButton>Show Missing Images</ActionButton></Toolbar><Panel title="Image Library" wide><DataTable rows={data} searchPlaceholder="Search images..." getSearchText={(row: any) => [row.productCode,row.nameEn,row.imageStatus].join(' ')} columns={[
      { header: 'Preview', render: (row: any) => <div className={row.imageStatus === 'missing' ? 'thumb missing' : 'thumb'}>{row.productCode.slice(0, 2)}</div> },
      { header: 'Product', render: (row: any) => row.productCode + ' ' + row.nameEn },
      { header: 'Image Status', render: (row: any) => <StatusBadge kind={row.imageStatus === 'missing' ? 'warn' : 'ok'}>{titleCase(row.imageStatus)}</StatusBadge> },
      { header: 'Updated', render: (row: any) => formatDate(row.updatedAt) },
    ]} /></Panel></>;
  }

  if (kind === 'importExport') {
    return <><Toolbar><ActionButton>Download Template</ActionButton><ActionButton primary>Run Validation</ActionButton><ActionButton>Export Current Data</ActionButton></Toolbar><Panel title="Preview Rows" wide><DataTable rows={data.rows} searchPlaceholder="Search import preview..." getSearchText={(row: any) => [row.row,row.type,row.code,row.message,row.status].join(' ')} columns={[
      { header: 'Row', render: (row: any) => row.row },
      { header: 'Type', render: (row: any) => row.type },
      { header: 'Code', render: (row: any) => row.code },
      { header: 'Message', render: (row: any) => row.message },
      { header: 'Status', render: (row: any) => <StatusBadge kind={row.status === 'Blocked' ? 'danger' : row.status === 'Warning' ? 'warn' : 'ok'}>{row.status}</StatusBadge> },
    ]} /></Panel></>;
  }

  if (kind === 'companyAudit') {
    return <><Toolbar><ActionButton primary>Export Audit CSV</ActionButton></Toolbar><Panel title="Audit Events" wide><DataTable rows={data} searchPlaceholder="Filter audit events..." getSearchText={(row: any) => [row.action,row.recordType,row.risk,row.actor?.name].join(' ')} columns={[
      { header: 'Time', render: (row: any) => formatDate(row.createdAt) },
      { header: 'Actor', render: (row: any) => row.actor?.name ?? 'System' },
      { header: 'Action', render: (row: any) => row.action },
      { header: 'Record', render: (row: any) => row.recordType },
      { header: 'Risk', render: (row: any) => <StatusBadge kind={row.risk === 'high' ? 'danger' : row.risk === 'medium' ? 'warn' : 'ok'}>{titleCase(row.risk)}</StatusBadge> },
    ]} /></Panel></>;
  }

  if (kind === 'analytics') {
    return <><Toolbar><ActionButton primary>Export Monthly Report</ActionButton><ActionButton>Schedule Email Report</ActionButton></Toolbar><section className="metrics">
      <MetricCard label="June Labels" value={data.totals.reduce((sum: number, row: any) => sum + row.totalStickers, 0)} meta="all outlets" />
      <MetricCard label="Product Stickers" value={data.totals.reduce((sum: number, row: any) => sum + row.productLabel60x40, 0)} meta="60x40" />
      <MetricCard label="Compact Stickers" value={data.totals.reduce((sum: number, row: any) => sum + row.compactProductLabel40x20, 0)} meta="40x20" />
      <MetricCard label="Timestamp" value={data.totals.reduce((sum: number, row: any) => sum + row.timestampLabel40x30, 0)} meta="40x30" warn />
    </section><Panel title="Monthly Sticker Totals By Outlet" wide><DataTable rows={data.totals} searchPlaceholder="Search outlet or label type..." getSearchText={(row: any) => row.outletName} columns={[
      { header: 'Outlet', render: (row: any) => row.outletName },
      { header: 'Product 60x40', render: (row: any) => row.productLabel60x40 },
      { header: 'Compact 40x20', render: (row: any) => row.compactProductLabel40x20 },
      { header: 'Timestamp 40x30', render: (row: any) => row.timestampLabel40x30 },
      { header: 'Total Stickers', render: (row: any) => row.totalStickers },
      { header: 'Top Printer', render: (row: any) => row.topPrinterName },
    ]} /></Panel></>;
  }

  return null;
}
