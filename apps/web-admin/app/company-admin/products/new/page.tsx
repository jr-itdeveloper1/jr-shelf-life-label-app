import { AppShell } from '@/components/AppShell';
import { ProductForm } from '@/components/ProductForm';
import { apiGet } from '@/lib/api';

export default async function NewProductPage() {
  const [categories, products] = await Promise.all([
    apiGet<Array<{ id: string; name: string; codePrefix: string }>>('/company/categories'),
    apiGet<Array<{ id: string; productCode: string }>>('/company/products'),
  ]);
  return (
    <AppShell role="company" activePath="/company-admin/products" title="Create Product" subtitle="Create a company-owned printable product and shelf-life rule">
      <ProductForm
        mode="create"
        categories={categories}
        products={products}
        product={{ productCode: 'NEW001', nameEn: 'New Product', nameZh: 'Chinese name stored', daysToExpire: 1, hoursToExpire: 0, storageMethodEn: 'Chilled', storageMethodZh: 'Chilled translation stored', active: true }}
      />
    </AppShell>
  );
}
