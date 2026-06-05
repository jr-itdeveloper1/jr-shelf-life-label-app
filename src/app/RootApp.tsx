import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking } from 'react-native';

import {
  categories as seedCategories,
  outletProducts as seedOutletProducts,
  outlets as seedOutlets,
  seedDataVersion,
  products as seedProducts,
} from '../data/sampleData';
import type { ProductLabelMode } from '../components/LabelPreview';
import { getCategoryColor } from '../domain/categoryColors';
import type { AppDataImport, Outlet, OutletProduct, PrintJob, Product, ProductCategory } from '../domain/models';
import { AdminCategoryDetailScreen } from '../screens/AdminCategoryDetailScreen';
import { AdminCategoryListScreen } from '../screens/AdminCategoryListScreen';
import { AdminBackupExportScreen } from '../screens/AdminBackupExportScreen';
import { AdminHomeScreen } from '../screens/AdminHomeScreen';
import { AdminOutletDetailScreen } from '../screens/AdminOutletDetailScreen';
import { AdminOutletListScreen } from '../screens/AdminOutletListScreen';
import { AdminOutletProductDetailScreen } from '../screens/AdminOutletProductDetailScreen';
import { AdminOutletProductListScreen } from '../screens/AdminOutletProductListScreen';
import { AdminPinScreen } from '../screens/AdminPinScreen';
import { AdminPrinterScreen } from '../screens/AdminPrinterScreen';
import { AdminProductDetailScreen } from '../screens/AdminProductDetailScreen';
import { AdminProductListScreen } from '../screens/AdminProductListScreen';
import { CategorySelectionScreen } from '../screens/CategorySelectionScreen';
import { OutletSelectionScreen } from '../screens/OutletSelectionScreen';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { ProductGridScreen, type ProductViewMode } from '../screens/ProductGridScreen';
import { PrintHistoryScreen } from '../screens/PrintHistoryScreen';
import { TimestampPrintScreen } from '../screens/TimestampPrintScreen';

const adminDataStorageKey = `jr-shelf-life-admin-data-${seedDataVersion}`;
const legacyCategoryStorageKey = `jr-shelf-life-categories-${seedDataVersion}`;
const productLabelModeStorageKey = 'jr-shelf-life-product-label-mode-v1';

type LocalAdminData = {
  categories: ProductCategory[];
  outlets: Outlet[];
  products: Product[];
  outletProducts: OutletProduct[];
  printJobs: PrintJob[];
};

type Screen =
  | 'outlets'
  | 'product-categories'
  | 'products'
  | 'product-detail'
  | 'timestamp-print'
  | 'history'
  | 'admin-pin'
  | 'admin-home'
  | 'admin-backup-export'
  | 'admin-categories'
  | 'admin-category-detail'
  | 'admin-outlets'
  | 'admin-outlet-detail'
  | 'admin-outlet-products'
  | 'admin-outlet-product-detail'
  | 'admin-printers'
  | 'admin-products'
  | 'admin-product-detail';

export function RootApp() {
  const [screen, setScreen] = useState<Screen>('outlets');
  const [categories, setCategories] = useState<ProductCategory[]>(seedCategories);
  const [outlets, setOutlets] = useState<Outlet[]>(seedOutlets);
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [outletProducts, setOutletProducts] = useState<OutletProduct[]>(seedOutletProducts);
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);
  const [loadedSeedDataVersion, setLoadedSeedDataVersion] = useState('');
  const [hasLoadedAdminData, setHasLoadedAdminData] = useState(false);
  const [hasLoadedProductLabelMode, setHasLoadedProductLabelMode] = useState(false);
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  const [adminSelectedOutlet, setAdminSelectedOutlet] = useState<Outlet | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [selectedProductCategoryId, setSelectedProductCategoryId] = useState('all');
  const [productViewMode, setProductViewMode] = useState<ProductViewMode>('compact');
  const [productLabelMode, setProductLabelMode] = useState<ProductLabelMode>('full');
  const [quantity, setQuantity] = useState(1);
  const [adminPin, setAdminPin] = useState('');
  const [initialUrl, setInitialUrl] = useState<string | null>(null);

  const openAppShortcut = useCallback((url: string) => {
    const shortcutTarget = (url
      .replace(/^[^:]+:\/\//, '')
      .split(/[?#]/)[0] ?? ''
    ).toLowerCase();

    if (shortcutTarget === 'outlets') {
      setSelectedOutlet(null);
      setSelectedProductCategoryId('all');
      setScreen('outlets');
      return;
    }

    const outletForShortcut = selectedOutlet ?? outlets[0] ?? null;

    if (!outletForShortcut) {
      setScreen('outlets');
      return;
    }

    setSelectedOutlet(outletForShortcut);

    if (shortcutTarget === 'admin') {
      setAdminPin('');
      setScreen('admin-pin');
      return;
    }

    if (shortcutTarget === 'history') {
      setScreen('history');
      return;
    }

    if (shortcutTarget === 'timestamp') {
      setScreen('timestamp-print');
      return;
    }

    if (shortcutTarget === 'products') {
      setSelectedProduct(null);
      setSelectedProductCategoryId('all');
      setScreen('products');
      return;
    }

    setSelectedProduct(null);
    setSelectedProductCategoryId('all');
    setScreen('product-categories');
  }, [outlets, selectedOutlet]);

  useEffect(() => {
    let cancelled = false;

    async function loadAdminData() {
      try {
        const storedLabelMode = await SecureStore.getItemAsync(productLabelModeStorageKey);

        if (!cancelled && (storedLabelMode === 'full' || storedLabelMode === 'compact')) {
          setProductLabelMode(storedLabelMode);
        }

        const storedAdminData = await SecureStore.getItemAsync(adminDataStorageKey);

        if (cancelled) {
          return;
        }

        if (storedAdminData) {
          const parsedData = JSON.parse(storedAdminData) as Partial<LocalAdminData>;

          setCategories(Array.isArray(parsedData.categories) ? parsedData.categories : seedCategories);
          setOutlets(Array.isArray(parsedData.outlets) ? parsedData.outlets : seedOutlets);
          setProducts(Array.isArray(parsedData.products) ? parsedData.products : seedProducts);
          setOutletProducts(Array.isArray(parsedData.outletProducts) ? parsedData.outletProducts : seedOutletProducts);
          setPrintJobs(Array.isArray(parsedData.printJobs) ? parsedData.printJobs : []);
          return;
        }

        const storedCategories = await SecureStore.getItemAsync(legacyCategoryStorageKey);

        if (!cancelled && storedCategories) {
          const parsedCategories = JSON.parse(storedCategories) as ProductCategory[];
          setCategories(Array.isArray(parsedCategories) ? parsedCategories : seedCategories);
        }
      } catch {
        // Keep seed data if local stored admin data cannot be read.
      } finally {
        if (!cancelled) {
          setHasLoadedAdminData(true);
          setHasLoadedProductLabelMode(true);
        }
      }
    }

    void loadAdminData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedProductLabelMode) {
      return;
    }

    void SecureStore.setItemAsync(productLabelModeStorageKey, productLabelMode).catch(() => undefined);
  }, [hasLoadedProductLabelMode, productLabelMode]);

  useEffect(() => {
    let cancelled = false;

    Linking.getInitialURL()
      .then((url) => {
        if (!cancelled && url) {
          setInitialUrl(url);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (hasLoadedAdminData) {
        openAppShortcut(url);
      } else {
        setInitialUrl(url);
      }
    });

    return () => subscription.remove();
  }, [hasLoadedAdminData, openAppShortcut]);

  useEffect(() => {
    if (!hasLoadedAdminData || !initialUrl) {
      return;
    }

    openAppShortcut(initialUrl);
    setInitialUrl(null);
  }, [hasLoadedAdminData, initialUrl, openAppShortcut]);

  useEffect(() => {
    if (!hasLoadedAdminData) {
      return;
    }

    if (loadedSeedDataVersion === seedDataVersion) {
      return;
    }

    setSelectedProduct(null);
    setSelectedCategory(null);
    setSelectedProductCategoryId('all');
    setAdminSelectedOutlet(null);
    setLoadedSeedDataVersion(seedDataVersion);
  }, [hasLoadedAdminData, loadedSeedDataVersion]);

  useEffect(() => {
    if (!hasLoadedAdminData) {
      return;
    }

    const adminData: LocalAdminData = {
      categories,
      outlets,
      products,
      outletProducts,
      printJobs,
    };

    void SecureStore.setItemAsync(adminDataStorageKey, JSON.stringify(adminData)).catch(() => undefined);
  }, [categories, hasLoadedAdminData, outletProducts, outlets, printJobs, products]);

  const visibleProducts = useMemo(() => {
    if (!selectedOutlet) {
      return [];
    }

    return products.filter((product) => {
      const eligibleForOutlet = product.source === 'company' || product.outletId === selectedOutlet.id;
      const outletProduct = outletProducts.find(
        (setting) => setting.outletId === selectedOutlet.id && setting.productId === product.id,
      );

      return eligibleForOutlet && product.active && (outletProduct?.active ?? true);
    });
  }, [outletProducts, products, selectedOutlet]);

  const selectedProductCategoryLabel = useMemo(() => {
    if (selectedProductCategoryId === 'all') {
      return 'All Products';
    }

    if (selectedProductCategoryId === 'custom') {
      return 'Custom';
    }

    return categories.find((category) => category.id === selectedProductCategoryId)?.name ?? 'Products';
  }, [categories, selectedProductCategoryId]);

  const selectedProductCategoryColor = useMemo(() => {
    if (selectedProductCategoryId === 'all' || selectedProductCategoryId === 'custom') {
      return getCategoryColor(selectedProductCategoryId);
    }

    const category = categories.find((currentCategory) => currentCategory.id === selectedProductCategoryId);
    return getCategoryColor(category ?? selectedProductCategoryId);
  }, [categories, selectedProductCategoryId]);

  const categoryProducts = useMemo(() => {
    if (selectedProductCategoryId === 'all') {
      return visibleProducts;
    }

    if (selectedProductCategoryId === 'custom') {
      return visibleProducts.filter((product) => product.source === 'outlet');
    }

    return visibleProducts.filter((product) => product.categoryId === selectedProductCategoryId);
  }, [selectedProductCategoryId, visibleProducts]);

  const saveOutlet = (outlet: Outlet) => {
    setOutlets((currentOutlets) => {
      const exists = currentOutlets.some((currentOutlet) => currentOutlet.id === outlet.id);

      if (exists) {
        return currentOutlets.map((currentOutlet) =>
          currentOutlet.id === outlet.id ? outlet : currentOutlet,
        );
      }

      return [...currentOutlets, outlet];
    });

    setSelectedOutlet((currentOutlet) =>
      currentOutlet?.id === outlet.id ? outlet : currentOutlet,
    );
    setAdminSelectedOutlet(outlet);
    setScreen('admin-outlets');
  };

  const deleteOutlet = (outletId: string) => {
    setOutlets((currentOutlets) =>
      currentOutlets.filter((currentOutlet) => currentOutlet.id !== outletId),
    );
    setOutletProducts((currentOutletProducts) =>
      currentOutletProducts.filter((outletProduct) => outletProduct.outletId !== outletId),
    );
    setAdminSelectedOutlet(null);

    if (selectedOutlet?.id === outletId) {
      setSelectedOutlet(null);
      setScreen('outlets');
      return;
    }

    setScreen('admin-outlets');
  };

  const toggleOutletProduct = (outletId: string, productId: string, active: boolean) => {
    setOutletProducts((currentOutletProducts) => {
      const exists = currentOutletProducts.some(
        (outletProduct) =>
          outletProduct.outletId === outletId && outletProduct.productId === productId,
      );

      if (exists) {
        return currentOutletProducts.map((outletProduct) =>
          outletProduct.outletId === outletId && outletProduct.productId === productId
            ? { ...outletProduct, active }
            : outletProduct,
        );
      }

      return [
        ...currentOutletProducts,
        {
          id: `${outletId}-${productId}`,
          outletId,
          productId,
          active,
        },
      ];
    });
  };

  const saveProduct = (product: Product) => {
    const isExistingProduct = products.some((currentProduct) => currentProduct.id === product.id);

    setProducts((currentProducts) => {
      if (isExistingProduct) {
        return currentProducts.map((currentProduct) =>
          currentProduct.id === product.id ? product : currentProduct,
        );
      }

      return [...currentProducts, product];
    });

    if (!isExistingProduct) {
      const targetOutlets = product.source === 'outlet' && product.outletId
        ? outlets.filter((outlet) => outlet.id === product.outletId)
        : outlets;

      setOutletProducts((currentOutletProducts) => [
        ...currentOutletProducts,
        ...targetOutlets
          .filter(
            (outlet) =>
              !currentOutletProducts.some(
                (outletProduct) =>
                  outletProduct.outletId === outlet.id && outletProduct.productId === product.id,
              ),
          )
          .map((outlet) => ({
            id: `${outlet.id}-${product.id}`,
            outletId: outlet.id,
            productId: product.id,
            active: true,
          })),
      ]);
    }

    setSelectedProduct(product);
    setScreen('admin-products');
  };

  const saveCategory = (category: ProductCategory) => {
    setCategories((currentCategories) => {
      const exists = currentCategories.some((currentCategory) => currentCategory.id === category.id);
      return exists
        ? currentCategories.map((currentCategory) =>
            currentCategory.id === category.id ? category : currentCategory,
          )
        : [...currentCategories, category];
    });

    setSelectedCategory(category);
    setScreen('admin-categories');
  };

  const importAppData = (importData: AppDataImport) => {
    setCategories((currentCategories) =>
      mergeByKey(currentCategories, importData.categories ?? [], (category) => category.codePrefix),
    );
    setOutlets((currentOutlets) =>
      mergeByKey(currentOutlets, importData.outlets ?? [], (outlet) => outlet.shortCode),
    );
    setProducts((currentProducts) =>
      mergeByKey(currentProducts, importData.products ?? [], (product) => product.productCode),
    );
    setOutletProducts((currentOutletProducts) =>
      mergeByKey(
        currentOutletProducts,
        importData.outletProducts ?? [],
        (outletProduct) => `${outletProduct.outletId}:${outletProduct.productId}`,
      ),
    );
    setPrintJobs((currentPrintJobs) =>
      mergeByKey(currentPrintJobs, importData.printJobs ?? [], (printJob) => printJob.id),
    );
  };

  if (screen === 'outlets' || !selectedOutlet) {
    return (
      <OutletSelectionScreen
        outlets={outlets}
        onSelectOutlet={(outlet) => {
          setSelectedOutlet(outlet);
          setSelectedProductCategoryId('all');
          setScreen('product-categories');
        }}
      />
    );
  }

  if (screen === 'product-categories') {
    return (
      <CategorySelectionScreen
        outlet={selectedOutlet}
        products={visibleProducts}
        categories={categories}
        onChangeOutlet={() => {
          setSelectedOutlet(null);
          setSelectedProductCategoryId('all');
          setScreen('outlets');
        }}
        onSelectCategory={(categoryId) => {
          setSelectedProductCategoryId(categoryId);
          setScreen('products');
        }}
        onOpenTimestamp={() => setScreen('timestamp-print')}
        onOpenHistory={() => setScreen('history')}
        onOpenAdmin={() => setScreen('admin-pin')}
      />
    );
  }

  if (screen === 'timestamp-print') {
    return (
      <TimestampPrintScreen
        outlet={selectedOutlet}
        onPrint={(printJob) => setPrintJobs((currentPrintJobs) => [printJob, ...currentPrintJobs])}
        onBack={() => setScreen('product-categories')}
      />
    );
  }

  if (screen === 'product-detail' && selectedProduct) {
    return (
      <ProductDetailScreen
        outlet={selectedOutlet}
        product={selectedProduct}
        quantity={quantity}
        labelMode={productLabelMode}
        onChangeQuantity={setQuantity}
        onChangeLabelMode={setProductLabelMode}
        onPrint={(printJob) => setPrintJobs((currentPrintJobs) => [printJob, ...currentPrintJobs])}
        onBack={() => setScreen('products')}
      />
    );
  }

  if (screen === 'history') {
    return <PrintHistoryScreen printJobs={printJobs} onBack={() => setScreen('products')} />;
  }

  if (screen === 'admin-pin') {
    return (
      <AdminPinScreen
        pin={adminPin}
        onChangePin={setAdminPin}
        onCancel={() => {
          setAdminPin('');
          setScreen('products');
        }}
        onSuccess={() => {
          setAdminPin('');
          setScreen('admin-home');
        }}
      />
    );
  }

  if (screen === 'admin-home') {
    return (
      <AdminHomeScreen
        onBack={() => setScreen('products')}
        onOpenBackupExport={() => setScreen('admin-backup-export')}
        onOpenCategories={() => setScreen('admin-categories')}
        onOpenOutletProducts={() => setScreen('admin-outlet-products')}
        onOpenOutlets={() => setScreen('admin-outlets')}
        onOpenPrinters={() => setScreen('admin-printers')}
        onOpenProducts={() => setScreen('admin-products')}
      />
    );
  }

  if (screen === 'admin-printers') {
    return <AdminPrinterScreen onBack={() => setScreen('admin-home')} />;
  }

  if (screen === 'admin-backup-export') {
    return (
      <AdminBackupExportScreen
        outlets={outlets}
        categories={categories}
        products={products}
        outletProducts={outletProducts}
        printJobs={printJobs}
        onImportData={importAppData}
        onBack={() => setScreen('admin-home')}
      />
    );
  }

  if (screen === 'admin-outlets') {
    return (
      <AdminOutletListScreen
        outlets={outlets}
        categories={categories}
        onBack={() => setScreen('admin-home')}
        onAddOutlet={() => {
          setAdminSelectedOutlet(null);
          setScreen('admin-outlet-detail');
        }}
        onSelectOutlet={(outlet) => {
          setAdminSelectedOutlet(outlet);
          setScreen('admin-outlet-detail');
        }}
      />
    );
  }

  if (screen === 'admin-outlet-detail') {
    return (
      <AdminOutletDetailScreen
        outlet={adminSelectedOutlet ?? undefined}
        outlets={outlets}
        categories={categories}
        products={products}
        onBack={() => setScreen('admin-outlets')}
        onSave={saveOutlet}
        onDelete={adminSelectedOutlet ? () => deleteOutlet(adminSelectedOutlet.id) : undefined}
      />
    );
  }

  if (screen === 'admin-outlet-products') {
    return (
      <AdminOutletProductListScreen
        outlets={outlets}
        products={products}
        outletProducts={outletProducts}
        onBack={() => setScreen('admin-home')}
        onSelectOutlet={(outlet) => {
          setAdminSelectedOutlet(outlet);
          setScreen('admin-outlet-product-detail');
        }}
      />
    );
  }

  if (screen === 'admin-outlet-product-detail' && adminSelectedOutlet) {
    return (
      <AdminOutletProductDetailScreen
        outlet={adminSelectedOutlet}
        products={products}
        categories={categories}
        outletProducts={outletProducts}
        onBack={() => setScreen('admin-outlet-products')}
        onToggleProduct={toggleOutletProduct}
      />
    );
  }

  if (screen === 'admin-categories') {
    return (
      <AdminCategoryListScreen
        categories={categories}
        products={products}
        onBack={() => setScreen('admin-home')}
        onAddCategory={() => {
          setSelectedCategory(null);
          setScreen('admin-category-detail');
        }}
        onSelectCategory={(category) => {
          setSelectedCategory(category);
          setScreen('admin-category-detail');
        }}
      />
    );
  }

  if (screen === 'admin-category-detail') {
    return (
      <AdminCategoryDetailScreen
        category={selectedCategory ?? undefined}
        categories={categories}
        products={products}
        onSave={saveCategory}
        onBack={() => setScreen('admin-categories')}
      />
    );
  }

  if (screen === 'admin-products') {
    return (
      <AdminProductListScreen
        categories={categories}
        products={products}
        onBack={() => setScreen('admin-home')}
        onAddProduct={() => {
          setSelectedProduct(null);
          setScreen('admin-product-detail');
        }}
        onSelectProduct={(product) => {
          setSelectedProduct(product);
          setScreen('admin-product-detail');
        }}
      />
    );
  }

  if (screen === 'admin-product-detail') {
    return (
      <AdminProductDetailScreen
        product={selectedProduct ?? undefined}
        categories={categories}
        products={products}
        outlets={outlets}
        onSave={saveProduct}
        onBack={() => setScreen('admin-products')}
      />
    );
  }

  return (
    <ProductGridScreen
      outlet={selectedOutlet}
      products={categoryProducts}
      categoryName={selectedProductCategoryLabel}
      categoryColor={selectedProductCategoryColor}
      viewMode={productViewMode}
      onChangeViewMode={setProductViewMode}
      onOpenAdmin={() => setScreen('admin-pin')}
      onOpenHistory={() => setScreen('history')}
      onChangeOutlet={() => {
        setSelectedOutlet(null);
        setSelectedProductCategoryId('all');
        setScreen('outlets');
      }}
      onChangeCategory={() => setScreen('product-categories')}
      onSelectProduct={(product) => {
        setSelectedProduct(product);
        setQuantity(1);
        setScreen('product-detail');
      }}
    />
  );
}

function mergeByKey<T>(currentItems: T[], importedItems: T[], getKey: (item: T) => string) {
  if (importedItems.length === 0) {
    return currentItems;
  }

  const mergedItems = [...currentItems];

  importedItems.forEach((importedItem) => {
    const importedKey = getKey(importedItem);
    const existingIndex = mergedItems.findIndex((currentItem) => getKey(currentItem) === importedKey);

    if (existingIndex >= 0) {
      mergedItems[existingIndex] = importedItem;
      return;
    }

    mergedItems.push(importedItem);
  });

  return mergedItems;
}
