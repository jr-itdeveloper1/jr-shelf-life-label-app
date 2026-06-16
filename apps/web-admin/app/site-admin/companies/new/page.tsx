import { AppShell } from '@/components/AppShell';
import { CompanyForm } from '@/components/CompanyForm';

export default function NewCompanyPage() {
  return (
    <AppShell role="site" activePath="/site-admin/companies" title="Create Company" subtitle="Company identity and first administrator">
      <CompanyForm mode="create" />
    </AppShell>
  );
}
