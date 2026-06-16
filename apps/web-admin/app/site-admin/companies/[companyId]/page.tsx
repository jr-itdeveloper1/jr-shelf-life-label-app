import { AppShell } from '@/components/AppShell';
import { apiGet, titleCase } from '@/lib/api';
import { CompanyForm } from '@/components/CompanyForm';
import { ButtonLink, MetricCard, Toolbar } from '@/components/ui';

type CompanyDetail = {
  id: string;
  name: string;
  code: string;
  status: 'ACTIVE' | 'SETUP' | 'DISABLED';
  maxPrinterConnections: number | null;
  users: unknown[];
  outlets: unknown[];
  _count: { products: number; printJobs: number; devices: number };
};

export default async function SiteCompanyDetailPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const company = await apiGet<CompanyDetail>(`/site/companies/${companyId}`);
  return (
    <AppShell role="site" activePath="/site-admin/companies" title={`Company Detail: ${company.name}`} subtitle="Tenant profile, sync summary, and admin access">
      <Toolbar><ButtonLink href="/site-admin/company-admins">Open Company Admins</ButtonLink></Toolbar>
      <section className="metrics">
        <MetricCard label="Status" value={titleCase(company.status)} meta="company state" />
        <MetricCard label="Outlets" value={company.outlets.length} meta="locations" />
        <MetricCard label="Products" value={company._count.products} meta="master labels" />
        <MetricCard label="Printer Limit" value={formatPrinterLimit(company._count.devices, company.maxPrinterConnections)} meta="connected / allowed" warn={company.maxPrinterConnections !== null && company._count.devices >= company.maxPrinterConnections} />
      </section>
      <CompanyForm mode="edit" company={{ id: company.id, name: company.name, code: company.code, status: company.status, maxPrinterConnections: company.maxPrinterConnections, printJobs: company._count.printJobs }} />
    </AppShell>
  );
}

function formatPrinterLimit(connected: number, max: number | null) {
  return max === null ? `${connected}/Unlimited` : `${connected}/${max}`;
}
