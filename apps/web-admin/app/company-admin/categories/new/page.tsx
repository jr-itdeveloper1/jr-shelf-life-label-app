import { AppShell } from '@/components/AppShell';
import { CategoryCreateForm } from '@/components/CategoryCreateForm';

export default function NewCategoryPage() {
  return (
    <AppShell role="company" activePath="/company-admin/categories" title="Create Category" subtitle="Category prefix and renumbering policy">
      <CategoryCreateForm />
    </AppShell>
  );
}
