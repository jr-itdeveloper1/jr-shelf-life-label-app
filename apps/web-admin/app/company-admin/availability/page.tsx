import { cookies } from 'next/headers';
import { AppShell } from '@/components/AppShell';
import { AvailabilityMatrix } from '@/components/AvailabilityMatrix';
import { apiGet } from '@/lib/api';

type AvailabilityData = {
  role: string;
  selectedOutletId: string;
  outlets: Array<{ id: string; name: string }>;
  companyRows: Array<{ id: string; productCode: string; nameEn: string; active: boolean; category: { name: string } }>;
  outletRows: Array<{
    id: string;
    active: boolean;
    outlet: { id: string; name: string };
    product: { id: string; productCode: string; nameEn: string; active: boolean; category: { name: string } };
  }>;
};

export default async function Page() {
  const data = await apiGet<AvailabilityData>('/company/availability');
  const cookieStore = await cookies();
  const role = cookieStore.get('jr_user_role')?.value === 'OUTLET_USER' ? 'outlet' : 'company';

  return (
    <AppShell role={role} activePath="/company-admin/availability" title="Product Availability Matrix" subtitle="Company-level visibility and outlet-level availability">
      <AvailabilityMatrix role={data.role} outlets={data.outlets} selectedOutletId={data.selectedOutletId} companyRows={data.companyRows} outletRows={data.outletRows} />
    </AppShell>
  );
}
