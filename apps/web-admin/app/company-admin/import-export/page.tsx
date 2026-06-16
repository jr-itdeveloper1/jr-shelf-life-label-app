import { AppShell } from '@/components/AppShell';
import { ImportDataPanel } from '@/components/ImportDataPanel';
import { apiGet } from '@/lib/api';

export default async function Page() {
  const [categories, products] = await Promise.all([
    apiGet<Array<{ id: string; name: string; codePrefix: string; status: string }>>('/company/categories'),
    apiGet<Array<{ id: string; productCode: string; nameEn: string; categoryId: string; category: { id: string; name: string } }>>('/company/products'),
  ]);

  return (
    <AppShell
      role="company"
      activePath="/company-admin/import-export"
      title="Import / Export"
      subtitle="Validate and import product Excel files"
    >
      <ImportDataPanel categories={categories} products={products} />
    </AppShell>
  );
}
