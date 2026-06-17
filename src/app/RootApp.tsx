import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { AdminPrinterScreen } from '../screens/AdminPrinterScreen';
import { AdminProductDetailScreen } from '../screens/AdminProductDetailScreen';
import { AdminProductListScreen } from '../screens/AdminProductListScreen';
import { CategorySelectionScreen } from '../screens/CategorySelectionScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { OutletSelectionScreen } from '../screens/OutletSelectionScreen';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { ProductGridScreen, type ProductViewMode } from '../screens/ProductGridScreen';
import { PrintHistoryScreen } from '../screens/PrintHistoryScreen';
import { TimestampPrintScreen } from '../screens/TimestampPrintScreen';
import {
  clearCloudSession,
  cloudLogin,
  fetchCloudBootstrap,
  loadCloudSession,
  uploadPrintJobs,
  type CloudSession,
} from '../services/cloudApi';
import {
  loadLocalAppData,
  replaceLocalAppData,
  replaceLocalMasterData,
  replaceLocalPrintJobs,
  type LocalAppData,
} from '../services/localAppDataStore';

const adminDataStorageKey = `jr-shelf-life-admin-data-${seedDataVersion}`;
const legacyCategoryStorageKey = `jr-shelf-life-categories-${seedDataVersion}`;
const productLabelModeStorageKey = 'jr-shelf-life-product-label-mode-v1';
const printHistoryAutoSyncIntervalMs = 30 * 60 * 1000;
const localAdminDataSaveDelayMs = 600;
const localPrintJobsSaveDelayMs = 250;

type Screen =
  | 'outlets'
  | 'product-categories'
  | 'products'
  | 'product-detail'
  | 'timestamp-print'
  | 'history'
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

type TimestampReturnScreen = 'product-categories' | 'products';

export function RootApp() {
  const [screen, setScreen] = useState<Screen>('outlets');
  const [timestampReturnScreen, setTimestampReturnScreen] = useState<TimestampReturnScreen>('product-categories');
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
  const [initialUrl, setInitialUrl] = useState<string | null>(null);
  const [cloudSession, setCloudSession] = useState<CloudSession | null>(null);
  const [hasLoadedCloudSession, setHasLoadedCloudSession] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [syncMessage, setSyncMessage] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const cloudSessionRef = useRef<CloudSession | null>(null);
  const printJobsRef = useRef<PrintJob[]>([]);
  const isAutoSyncingPrintHistoryRef = useRef(false);

  const applyCloudData = useCallback((cloudData: {
    categories: ProductCategory[];
    outlets: Outlet[];
    products: Product[];
    outletProducts: OutletProduct[];
  }) => {
    setCategories(cloudData.categories);
    setOutlets(cloudData.outlets);
    setProducts(cloudData.products);
    setOutletProducts(cloudData.outletProducts);
    setSelectedOutlet((currentOutlet) => {
      if (!currentOutlet) return null;
      return cloudData.outlets.find((outlet) => outlet.id === currentOutlet.id) ?? null;
    });
    setSelectedProduct(null);
    setSelectedProductCategoryId('all');
  }, []);

  const syncFromCloud = useCallback(async (session: CloudSession) => {
    setIsSyncing(true);
    try {
      const cloudData = await fetchCloudBootstrap(session);
      applyCloudData(cloudData);
      const productImageCount = cloudData.products.filter((product) => Boolean(product.imageUri)).length;
      setSyncMessage(`Synced ${cloudData.outlets.length} outlet(s), ${cloudData.categories.length} category(s), and ${cloudData.products.length} product(s), including ${productImageCount} image(s).`);
      return cloudData;
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : 'Cloud sync failed. Cached data remains available.');
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [applyCloudData]);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsSigningIn(true);
    setLoginError('');
    try {
      const session = await cloudLogin(email, password);
      setCloudSession(session);
      await syncFromCloud(session);
      setScreen('outlets');
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Unable to sign in.');
    } finally {
      setIsSigningIn(false);
    }
  }, [syncFromCloud]);

  const signOut = useCallback(async () => {
    await clearCloudSession();
    setCloudSession(null);
    setSelectedOutlet(null);
    setSelectedProduct(null);
    setAdminSelectedOutlet(null);
    setSyncMessage('');
    setScreen('outlets');
  }, []);

  const uploadPendingPrintJobs = useCallback(async (session: CloudSession) => {
    if (isAutoSyncingPrintHistoryRef.current) {
      return { attempted: 0, uploaded: 0, message: 'Print history sync already running' };
    }

    const pendingPrintJobs = getPrintJobsForSync(printJobsRef.current);

    if (pendingPrintJobs.length === 0) {
      return { attempted: 0, uploaded: 0, message: 'Print history already synced' };
    }

    const pendingPrintJobIds = new Set(pendingPrintJobs.map((printJob) => printJob.id));
    isAutoSyncingPrintHistoryRef.current = true;
    setPrintJobs((currentPrintJobs) =>
      currentPrintJobs.map((printJob) =>
        pendingPrintJobIds.has(printJob.id)
          ? { ...printJob, syncStatus: 'syncing', syncError: undefined }
          : printJob,
      ),
    );

    try {
      const result = await uploadPrintJobs(session, pendingPrintJobs);
      const syncedAt = new Date().toISOString();

      setPrintJobs((currentPrintJobs) =>
        currentPrintJobs.map((printJob) =>
          pendingPrintJobIds.has(printJob.id)
            ? { ...printJob, syncStatus: 'synced', syncedAt, syncError: undefined }
            : printJob,
        ),
      );

      return {
        attempted: pendingPrintJobs.length,
        uploaded: result.uploaded,
        message: result.message,
      };
    } catch (error) {
      const syncError = error instanceof Error ? error.message : 'Print history sync failed.';

      setPrintJobs((currentPrintJobs) =>
        currentPrintJobs.map((printJob) =>
          pendingPrintJobIds.has(printJob.id)
            ? { ...printJob, syncStatus: 'failed', syncError }
            : printJob,
        ),
      );

      throw error;
    } finally {
      isAutoSyncingPrintHistoryRef.current = false;
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (!cloudSession) return;
    try {
      const cloudData = await syncFromCloud(cloudSession);
      const productImageCount = cloudData.products.filter((product) => Boolean(product.imageUri)).length;
      try {
        const result = await uploadPendingPrintJobs(cloudSession);
        const historyMessage = result.attempted > 0 ? result.message : 'Print history already synced';
        setSyncMessage(`${historyMessage}. Master data refreshed with ${productImageCount} product image(s).`);
      } catch (error) {
        setSyncMessage(`Master data refreshed with ${productImageCount} product image(s). Print history upload failed: ${error instanceof Error ? error.message : 'try again later.'}`);
      }
    } catch {
      // syncFromCloud already set the user-facing message.
    }
  }, [cloudSession, syncFromCloud, uploadPendingPrintJobs]);

  useEffect(() => {
    cloudSessionRef.current = cloudSession;
  }, [cloudSession]);

  useEffect(() => {
    printJobsRef.current = printJobs;
  }, [printJobs]);

  useEffect(() => {
    if (!hasLoadedAdminData || !hasLoadedCloudSession || !cloudSession) {
      return;
    }

    let cancelled = false;

    const syncPrintHistory = async () => {
      const currentSession = cloudSessionRef.current;
      const pendingPrintJobs = getPrintJobsForSync(printJobsRef.current);

      if (!currentSession || pendingPrintJobs.length === 0) {
        return;
      }

      try {
        const result = await uploadPendingPrintJobs(currentSession);

        if (!cancelled && result.attempted > 0) {
          setSyncMessage(`${result.message}. Print history auto-synced.`);
        }
      } catch (error) {
        if (!cancelled) {
          setSyncMessage(error instanceof Error ? error.message : 'Print history auto-sync failed.');
        }
      }
    };

    const intervalId = setInterval(() => {
      void syncPrintHistory();
    }, printHistoryAutoSyncIntervalMs);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [cloudSession, hasLoadedAdminData, hasLoadedCloudSession, uploadPendingPrintJobs]);

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
      setScreen('admin-home');
      return;
    }

    if (shortcutTarget === 'history') {
      setScreen('history');
      return;
    }

    if (shortcutTarget === 'timestamp') {
      setTimestampReturnScreen('products');
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

        const localAppData = await loadLocalAppData();

        if (cancelled) {
          return;
        }

        if (localAppData) {
          setCategories(localAppData.categories.length > 0 ? localAppData.categories : seedCategories);
          setOutlets(localAppData.outlets.length > 0 ? localAppData.outlets : seedOutlets);
          setProducts(localAppData.products.length > 0 ? localAppData.products : seedProducts);
          setOutletProducts(localAppData.outletProducts.length > 0 ? localAppData.outletProducts : seedOutletProducts);
          setPrintJobs(normalizeStoredPrintJobs(localAppData.printJobs));
          return;
        }

        const storedAdminData = await SecureStore.getItemAsync(adminDataStorageKey);

        if (cancelled) {
          return;
        }

        if (storedAdminData) {
          const parsedData = JSON.parse(storedAdminData) as Partial<LocalAppData>;
          const migratedData: LocalAppData = {
            categories: Array.isArray(parsedData.categories) ? parsedData.categories : seedCategories,
            outlets: Array.isArray(parsedData.outlets) ? parsedData.outlets : seedOutlets,
            products: Array.isArray(parsedData.products) ? parsedData.products : seedProducts,
            outletProducts: Array.isArray(parsedData.outletProducts) ? parsedData.outletProducts : seedOutletProducts,
            printJobs: Array.isArray(parsedData.printJobs) ? normalizeStoredPrintJobs(parsedData.printJobs) : [],
          };

          setCategories(migratedData.categories);
          setOutlets(migratedData.outlets);
          setProducts(migratedData.products);
          setOutletProducts(migratedData.outletProducts);
          setPrintJobs(migratedData.printJobs);
          replaceLocalAppData(migratedData).catch(() => undefined);
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
    let cancelled = false;

    async function loadSession() {
      try {
        const storedSession = await loadCloudSession();
        if (cancelled) return;
        setCloudSession(storedSession);
        if (storedSession) {
          syncFromCloud(storedSession).catch(() => undefined);
        }
      } finally {
        if (!cancelled) {
          setHasLoadedCloudSession(true);
        }
      }
    }

    if (!hasLoadedAdminData) {
      return () => {
        cancelled = true;
      };
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [hasLoadedAdminData, syncFromCloud]);

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

    const saveTimeoutId = setTimeout(() => {
      void replaceLocalMasterData({
        categories,
        outlets,
        products,
        outletProducts,
      }).catch(() => undefined);
    }, localAdminDataSaveDelayMs);

    return () => clearTimeout(saveTimeoutId);
  }, [categories, hasLoadedAdminData, outletProducts, outlets, products]);

  useEffect(() => {
    if (!hasLoadedAdminData) {
      return;
    }

    const saveTimeoutId = setTimeout(() => {
      void replaceLocalPrintJobs(printJobs).catch(() => undefined);
    }, localPrintJobsSaveDelayMs);

    return () => clearTimeout(saveTimeoutId);
  }, [hasLoadedAdminData, printJobs]);

  useEffect(() => {
    if (!hasLoadedAdminData || !hasLoadedCloudSession || !cloudSession || isSyncing) {
      return;
    }

    const singleOutlet = outlets[0];

    if (screen !== 'outlets' || selectedOutlet || outlets.length !== 1 || !singleOutlet) {
      return;
    }

    setSelectedOutlet(singleOutlet);
    setSelectedProductCategoryId('all');
    setScreen('product-categories');
  }, [cloudSession, hasLoadedAdminData, hasLoadedCloudSession, isSyncing, outlets, screen, selectedOutlet]);

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

  const availableProductCategoryIds = useMemo(() => {
    const categoryCounts = visibleProducts.reduce((counts, product) => {
      counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1);
      return counts;
    }, new Map<string, number>());

    const visibleCategoryIds = visibleProducts.length === 0
      ? categories.map((category) => category.id)
      : categories
          .filter((category) => categoryCounts.has(category.id))
          .map((category) => category.id);
    const hasCustomProducts = visibleProducts.some((product) => product.source === 'outlet');

    return [
      ...visibleCategoryIds,
      ...(hasCustomProducts ? ['custom'] : []),
    ];
  }, [categories, visibleProducts]);

  useEffect(() => {
    const singleCategoryId = availableProductCategoryIds[0];

    if (
      screen !== 'product-categories'
      || !selectedOutlet
      || availableProductCategoryIds.length !== 1
      || !singleCategoryId
    ) {
      return;
    }

    setSelectedProduct(null);
    setSelectedProductCategoryId(singleCategoryId);
    setScreen('products');
  }, [availableProductCategoryIds, screen, selectedOutlet]);

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
      mergeByKey(currentPrintJobs, normalizeStoredPrintJobs(importData.printJobs ?? []), (printJob) => printJob.id),
    );
  };

  const addPrintJob = useCallback((printJob: PrintJob) => {
    setPrintJobs((currentPrintJobs) => [
      {
        ...printJob,
        syncStatus: 'pending',
        syncedAt: undefined,
        syncError: undefined,
      },
      ...currentPrintJobs,
    ]);
  }, []);

  if (!hasLoadedAdminData || !hasLoadedCloudSession) {
    return <LoginScreen isLoading onLogin={signIn} errorMessage="Loading saved login..." />;
  }

  if (!cloudSession) {
    return <LoginScreen isLoading={isSigningIn} onLogin={signIn} errorMessage={loginError} />;
  }

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
        canChangeOutlet={outlets.length > 1}
        onChangeOutlet={() => {
          setSelectedOutlet(null);
          setSelectedProductCategoryId('all');
          setScreen('outlets');
        }}
        onSelectCategory={(categoryId) => {
          setSelectedProductCategoryId(categoryId);
          setScreen('products');
        }}
        onOpenTimestamp={() => {
          setTimestampReturnScreen('product-categories');
          setScreen('timestamp-print');
        }}
        onOpenHistory={() => setScreen('history')}
        onOpenAdmin={() => setScreen('admin-home')}
        onSignOut={() => void signOut()}
      />
    );
  }

  if (screen === 'timestamp-print') {
    return (
      <TimestampPrintScreen
        outlet={selectedOutlet}
        onPrint={addPrintJob}
        backLabel={timestampReturnScreen === 'products' ? '< Products' : '< Categories'}
        onBack={() => setScreen(timestampReturnScreen)}
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
        onPrint={addPrintJob}
        onBack={() => setScreen('products')}
      />
    );
  }

  if (screen === 'history') {
    return (
      <PrintHistoryScreen
        printJobs={printJobs}
        onOpenProducts={() => setScreen('products')}
        onOpenAdmin={() => setScreen('admin-home')}
        onSignOut={() => void signOut()}
      />
    );
  }

  if (screen === 'admin-home') {
    return (
      <AdminHomeScreen
        canManageData={cloudSession.user.role === 'COMPANY_ADMIN'}
        syncMessage={syncMessage}
        isSyncing={isSyncing}
        onSyncNow={() => void syncNow()}
        onOpenProductPage={() => setScreen('products')}
        onOpenHistory={() => setScreen('history')}
        onSignOut={() => void signOut()}
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
    return <AdminPrinterScreen session={cloudSession} outlet={selectedOutlet} onBack={() => setScreen('admin-home')} />;
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
      canChangeOutlet={outlets.length > 1}
      canChangeCategory={availableProductCategoryIds.length > 1}
      onChangeViewMode={setProductViewMode}
      onOpenAdmin={() => setScreen('admin-home')}
      onOpenHistory={() => setScreen('history')}
      onOpenTimestamp={() => {
        setTimestampReturnScreen('products');
        setScreen('timestamp-print');
      }}
      onChangeOutlet={() => {
        setSelectedOutlet(null);
        setSelectedProduct(null);
        setSelectedProductCategoryId('all');
        setScreen('outlets');
      }}
      onChangeCategory={() => setScreen('product-categories')}
      onSignOut={() => void signOut()}
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

function getPrintJobsForSync(printJobs: PrintJob[]) {
  return printJobs.filter((printJob) => printJob.syncStatus !== 'synced');
}

function normalizeStoredPrintJobs(printJobs: PrintJob[]) {
  return printJobs.map((printJob) => ({
    ...printJob,
    syncStatus: printJob.syncStatus === 'syncing' ? 'pending' : printJob.syncStatus,
  }));
}
