import { Camera, CameraView } from 'expo-camera';
import type { BarcodeType } from 'expo-camera';
import { memo, useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { ListRenderItemInfo } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '../components/AppIcon';
import { LanguageToggle } from '../components/LanguageToggle';
import { ProductTile } from '../components/ProductTile';
import type { Outlet, Product } from '../domain/models';
import { useLanguage } from '../i18n/LanguageContext';
import { colors } from '../theme/colors';

export type ProductViewMode = 'compact' | 'regular';

type Props = {
  outlet: Outlet;
  products: Product[];
  categoryName: string;
  categoryColor: string;
  viewMode: ProductViewMode;
  canChangeOutlet: boolean;
  canChangeCategory: boolean;
  onChangeViewMode: (viewMode: ProductViewMode) => void;
  onSelectProduct: (product: Product) => void;
  onChangeOutlet: () => void;
  onChangeCategory: () => void;
  onOpenAdmin: () => void;
  onOpenHistory: () => void;
  onOpenTimestamp: () => void;
  onSignOut: () => void;
};

export function ProductGridScreen({
  outlet,
  products,
  categoryName,
  categoryColor,
  viewMode,
  canChangeOutlet,
  canChangeCategory,
  onChangeViewMode,
  onSelectProduct,
  onChangeOutlet,
  onChangeCategory,
  onOpenAdmin,
  onOpenHistory,
  onOpenTimestamp,
  onSignOut,
}: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const productColumns = 2;

  const trimmedSearchQuery = searchQuery.trim();
  const filteredProducts = useMemo(
    () => products.filter((product) => matchesSearch(product, searchQuery)),
    [products, searchQuery],
  );
  const productCountText = useMemo(
    () =>
      trimmedSearchQuery.length > 0
        ? t('productsShown', { shown: filteredProducts.length, total: products.length })
        : t('productCount', { count: products.length }),
    [filteredProducts.length, products.length, t, trimmedSearchQuery.length],
  );
  const productGridItems: Array<Product | null> = useMemo(
    () => (filteredProducts.length % productColumns === 0 ? filteredProducts : [...filteredProducts, null]),
    [filteredProducts],
  );
  const toolbarTint = useMemo(() => getReadableButtonColor(categoryColor), [categoryColor]);
  const toolbarSoftBackground = useMemo(() => toRgba(categoryColor, 0.12), [categoryColor]);
  const toolbarBorder = useMemo(() => toRgba(categoryColor, 0.32), [categoryColor]);
  const toolbarRipple = useMemo(() => toRgba(categoryColor, 0.2), [categoryColor]);
  const keyExtractor = useCallback((product: Product | null, index: number) => product?.id ?? `empty-${index}`, []);
  const renderProductItem = useCallback(
    ({ item }: ListRenderItemInfo<Product | null>) => (
      <ProductGridItem product={item} viewMode={viewMode} onSelectProduct={onSelectProduct} />
    ),
    [onSelectProduct, viewMode],
  );
  const handleCompactModePress = useCallback(() => onChangeViewMode('compact'), [onChangeViewMode]);
  const handleRegularModePress = useCallback(() => onChangeViewMode('regular'), [onChangeViewMode]);
  const handleScan = useCallback(async () => {
    const permission = await Camera.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(t('cameraPermissionTitle'), t('cameraPermissionMessage'));
      return;
    }

    let subscription: { remove: () => void } | null = null;

    try {
      subscription = CameraView.onModernBarcodeScanned((event) => {
        subscription?.remove();
        const scannedCode = event.data.trim().toUpperCase();
        const matchedProduct = products.find((product) => {
          const productCode = product.productCode.toUpperCase();
          return scannedCode === productCode || scannedCode.includes(productCode);
        });

        if (matchedProduct) {
          onSelectProduct(matchedProduct);
          return;
        }

        Alert.alert(t('productNotFound'), t('scannedProductNotFound', { code: event.data }));
      });

      await CameraView.launchScanner({ barcodeTypes });
    } catch (error) {
      subscription?.remove();
      Alert.alert(t('scanError'), t('unableToOpenScanner'));
    }
  }, [onSelectProduct, products, t]);

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top + 12, 34) }]}>
      <View style={styles.topBar}>
        <View style={styles.outletBlock}>
          <Text style={styles.outletLabel}>{t('outlet')}</Text>
          <Text style={styles.outletLine} numberOfLines={1}>
            {outlet.name}
          </Text>
        </View>
        <View style={styles.topBarActions}>
          <LanguageToggle />
        {canChangeOutlet ? (
          <Pressable style={styles.outletChangeButton} onPress={onChangeOutlet}>
            <AppIcon name="change" size={16} color={colors.primary} />
            <Text style={styles.outletChangeText}>{t('change')}</Text>
          </Pressable>
        ) : null}
        </View>
      </View>

      <View style={styles.categoryBar}>
        <View style={styles.categoryTextBlock}>
          <Text style={styles.categoryLabel}>{t('category')}</Text>
          <Text style={[styles.categoryName, { color: toolbarTint }]} numberOfLines={1}>
            {categoryName}
          </Text>
          <Text style={styles.categoryMeta}>{productCountText}</Text>
        </View>
        <View style={styles.categoryActions}>
          {canChangeCategory ? (
            <Pressable
              style={[
                styles.categoryButton,
                {
                  backgroundColor: toolbarSoftBackground,
                  borderColor: toolbarBorder,
                },
              ]}
              onPress={onChangeCategory}
              android_ripple={{ color: toolbarRipple, borderless: false }}
            >
              <Text style={[styles.categoryButtonText, { color: toolbarTint }]}>{t('change')}</Text>
            </Pressable>
          ) : null}
          <Pressable
            style={styles.timestampButton}
            onPress={onOpenTimestamp}
            android_ripple={{ color: 'rgba(255, 255, 255, 0.18)', borderless: false }}
          >
            <AppIcon name="history" size={14} color={colors.surface} />
            <Text style={styles.timestampText}>{t('timestamp')}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.controlBar}>
        <View style={styles.modeSwitch}>
          <Pressable
            style={[
              styles.modeOption,
              viewMode === 'compact' ? styles.modeOptionActive : styles.modeOptionInactive,
            ]}
            onPress={handleCompactModePress}
            android_ripple={{ color: 'rgba(15, 118, 110, 0.16)', borderless: false }}
          >
            <Text style={viewMode === 'compact' ? styles.modeOptionTextActive : styles.modeOptionTextInactive}>
              {t('compact')}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.modeOption,
              viewMode === 'regular' ? styles.modeOptionActive : styles.modeOptionInactive,
            ]}
            onPress={handleRegularModePress}
            android_ripple={{ color: 'rgba(15, 118, 110, 0.16)', borderless: false }}
          >
            <Text style={viewMode === 'regular' ? styles.modeOptionTextActive : styles.modeOptionTextInactive}>
              {t('regular')}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchIcon}>
          <AppIcon name="search" size={16} color={colors.textSoft} />
        </View>
        <TextInput
          style={styles.searchBox}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('searchNameCode')}
        />
        <Pressable
          style={styles.scanButton}
          onPress={handleScan}
          android_ripple={{ color: 'rgba(255, 255, 255, 0.18)', borderless: false }}
        >
          <View style={styles.scanIconBox}>
            <AppIcon name="scan" size={14} color={colors.surface} />
          </View>
          <Text style={styles.scanText}>{t('scan')}</Text>
        </Pressable>
      </View>

      {filteredProducts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{t('noProductsFound')}</Text>
          <Text style={styles.emptyText}>{t('noProductsSearchHint')}</Text>
        </View>
      ) : (
        <FlatList
          key={viewMode}
          data={productGridItems}
          keyExtractor={keyExtractor}
          numColumns={productColumns}
          columnWrapperStyle={styles.productRow}
          contentContainerStyle={styles.productGrid}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews
          showsVerticalScrollIndicator={false}
          updateCellsBatchingPeriod={40}
          windowSize={7}
          renderItem={renderProductItem}
        />
      )}

      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable style={[styles.navItem, styles.navItemSelected]}>
          <AppIcon name="grid" size={19} color={colors.primary} />
          <Text style={styles.navItemActive}>{t('products')}</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={onOpenHistory}>
          <AppIcon name="history" size={19} color={colors.textMuted} />
          <Text style={styles.navItemText}>{t('history')}</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={onOpenAdmin}>
          <AppIcon name="admin" size={19} color={colors.textMuted} />
          <Text style={styles.navItemText}>{t('manage')}</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={onSignOut}>
          <AppIcon name="signOut" size={19} color={colors.textMuted} />
          <Text style={styles.navItemText}>{t('signOut')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  outletBlock: {
    flex: 1,
  },
  outletChangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  outletChangeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  outletLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  outlet: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '900',
  },
  categoryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
  },
  categoryTextBlock: {
    flex: 1,
  },
  outletLine: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  categoryLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  categoryName: {
    marginTop: 2,
    color: colors.primaryDark,
    fontSize: 22,
    fontWeight: '900',
  },
  categoryMeta: {
    marginTop: 1,
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
  },
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  categoryActions: {
    alignItems: 'stretch',
    gap: 7,
  },
  categoryButton: {
    minWidth: 102,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryButtonText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '900',
  },
  timestampButton: {
    minWidth: 102,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 8,
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  timestampText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '900',
  },
  modeSwitch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    padding: 3,
  },
  modeOption: {
    flex: 1,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    paddingHorizontal: 10,
  },
  modeOptionActive: {
    backgroundColor: colors.primary,
  },
  modeOptionInactive: {
    backgroundColor: 'transparent',
  },
  modeOptionTextActive: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '900',
  },
  modeOptionTextInactive: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  searchBox: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    paddingLeft: 34,
    paddingRight: 12,
    paddingVertical: 8,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minWidth: 82,
    height: 42,
    borderRadius: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: 11,
    elevation: 1,
  },
  scanIconBox: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '900',
  },
  productGrid: {
    gap: 6,
    paddingBottom: 92,
  },
  productRow: {
    gap: 6,
    marginBottom: 6,
  },
  productCell: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 20,
    marginTop: 6,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  emptyText: {
    marginTop: 6,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 18,
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  navItem: {
    width: '25%',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingVertical: 7,
  },
  navItemSelected: {
    backgroundColor: colors.primarySoft,
  },
  navItemText: {
    color: colors.textMuted,
    fontWeight: '900',
  },
  navItemActive: {
    color: colors.primary,
    fontWeight: '900',
  },
});

type ProductGridItemProps = {
  product: Product | null;
  viewMode: ProductViewMode;
  onSelectProduct: (product: Product) => void;
};

const ProductGridItem = memo(function ProductGridItem({
  product,
  viewMode,
  onSelectProduct,
}: ProductGridItemProps) {
  const handlePress = useCallback(() => {
    if (product) {
      onSelectProduct(product);
    }
  }, [onSelectProduct, product]);

  return (
    <View style={styles.productCell}>
      {product ? <ProductTile product={product} mode={viewMode} onPress={handlePress} /> : null}
    </View>
  );
});

const barcodeTypes: BarcodeType[] = ['qr', 'code128', 'code39', 'code93', 'ean13', 'ean8', 'upc_a', 'upc_e'];

function matchesSearch(product: Product, searchQuery: string) {
  const query = searchQuery.trim().toLowerCase();

  if (!query) {
    return true;
  }

  return [product.nameEn, product.nameZh, product.productCode, product.storageMethod.en, product.storageMethod.zh]
    .some((value) => value.toLowerCase().includes(query));
}

function getReadableButtonColor(hexColor: string) {
  return hexColor.toLowerCase() === '#ffffff' ? colors.text : hexColor;
}

function toRgba(hexColor: string, alpha: number) {
  const hex = hexColor.replace('#', '');

  if (hex.length !== 6) {
    return colors.border;
  }

  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);

  if ([red, green, blue].some((value) => Number.isNaN(value))) {
    return colors.border;
  }

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
