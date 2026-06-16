import { AppShell } from '@/components/AppShell';
import { ProductForm } from '@/components/ProductForm';
import { apiGet } from '@/lib/api';

type Product = {
  id: string;
  productCode: string;
  nameEn: string;
  nameZh: string;
  daysToExpire: number;
  hoursToExpire: number;
  storageMethodEn: string;
  storageMethodZh: string;
  imageStatus: string;
  active: boolean;
  category?: { id: string; name: string };
  categoryId?: string;
};

export default async function ProductDetailPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const [product, categories, products] = await Promise.all([
    apiGet<Product>(`/company/products/${productId}`),
    apiGet<Array<{ id: string; name: string; codePrefix: string }>>('/company/categories'),
    apiGet<Array<{ id: string; productCode: string }>>('/company/products'),
  ]);

  return (
    <AppShell role="company" activePath="/company-admin/products" title="Product Detail" subtitle="Product label rule, image, and availability status">
      <ProductForm product={product} categories={categories} products={products} mode="edit" />
    </AppShell>
  );
}
