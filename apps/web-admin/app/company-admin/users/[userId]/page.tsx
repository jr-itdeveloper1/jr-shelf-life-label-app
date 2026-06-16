import { AppShell } from '@/components/AppShell';
import { UserProfileForm } from '@/components/UserProfileForm';
import { apiGet } from '@/lib/api';

type UserDetail = {
  id: string;
  name: string;
  email: string;
  role: 'COMPANY_ADMIN' | 'OUTLET_USER';
  status: 'ACTIVE' | 'INVITED' | 'DISABLED';
  outletAccess: Array<{ outlet: { id: string; name: string } }>;
};

export default async function UserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const [user, outlets] = await Promise.all([
    apiGet<UserDetail>(`/company/users/${userId}`),
    apiGet<Array<{ id: string; name: string }>>('/company/outlets'),
  ]);

  return (
    <AppShell role="company" activePath="/company-admin/users" title="User Detail / Outlet Access" subtitle="Role and permitted outlets">
      <UserProfileForm user={user} outlets={outlets} />
    </AppShell>
  );
}
