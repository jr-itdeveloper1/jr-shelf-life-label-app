import { AppShell } from '@/components/AppShell';
import { CategoryDetailForm } from '@/components/CategoryDetailForm';
import { apiGet } from '@/lib/api';

type Category = {
  id: string;
  name: string;
  codePrefix: string;
  scope: string;
  status: 'ACTIVE' | 'INACTIVE';
  products: Array<{ id: string; productCode: string; nameEn: string }>;
};

export default async function CategoryDetailPage({ params }: { params: Promise<{ categoryId: string }> }) {
  const { categoryId } = await params;
  const category = await apiGet<Category>(`/company/categories/${categoryId}`);

  return (
    <AppShell role="company" activePath="/company-admin/categories" title="Category Detail" subtitle="Category prefix and renumbering policy">
      <CategoryDetailForm category={category} />
    </AppShell>
  );
}
