import { Camera, CameraView } from 'expo-camera';
import type { BarcodeType } from 'expo-camera';
import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '../components/AppIcon';
import { ProductTile } from '../components/ProductTile';
import type { Outlet, Product } from '../domain/models';
import { colors } from '../theme/colors';

export type ProductViewMode = 'compact' | 'regular';

type Props = {
  outlet: Outlet;
  products: Product[];
  categoryName: string;
  categoryColor: string;
  viewMode: ProductViewMode;
  onChangeViewMode: (viewMode: ProductViewMode) => void;
  onSelectProduct: (product: Product) => void;
  onChangeCategory: () => void;
  onChangeOutlet: () => void;
  onOpenAdmin: () => void;
  onOpenHistory: () => void;
};

export function ProductGridScreen({
  outlet,
  products,
  categoryName,
  categoryColor,
  viewMode,
  onChangeViewMode,
  onSelectProduct,
  onChangeCategory,
  onChangeOutlet,
  onOpenAdmin,
  onOpenHistory,
}: Props) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const productColumns = 2;

  const filteredProducts = products.filter((product) => matchesSearch(product, searchQuery));
  const productCountText =
    searchQuery.trim().length > 0 ? `${filteredProducts.length} of ${products.length} products` : `${products.length} products`;
  const productGridItems: Array<Product | null> =
    filteredProducts.length % productColumns === 0 ? filteredProducts : [...filteredProducts, null];
  const toolbarTint = getReadableButtonColor(categoryColor);
  const toolbarSoftBackground = toRgba(categoryColor, 0.12);
  const toolbarBorder = toRgba(categoryColor, 0.32);
  const toolbarRipple = toRgba(categoryColor, 0.2);
  const handleScan = async () => {
    const permission = await Camera.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Camera Permission Needed', 'Please allow camera access to scan product codes.');
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

        Alert.alert('Product Not Found', `No visible product matched scanned code: ${event.data}`);
      });

      await CameraView.launchScanner({ barcodeTypes });
    } catch (error) {
      subscription?.remove();
      Alert.alert('Scan Error', error instanceof Error ? error.message : 'Unable to open scanner.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top + 12, 34) }]}>
      <View style={styles.topBar}>
        <Pressable style={styles.outletBlock} onLongPress={onOpenAdmin} delayLongPress={1200}>
          <Text style={styles.outletLabel}>Outlet</Text>
          <Text style={styles.outletLine} numberOfLines={1}>
            {outlet.name}
          </Text>
        </Pressable>
        <Pressable style={styles.changeOutletButton} onPress={onChangeOutlet}>
          <AppIcon name="change" size={14} color={colors.primaryDark} />
          <Text style={styles.changeText}>Outlet</Text>
        </Pressable>
      </View>

      <View style={styles.categoryBar}>
        <View style={styles.categoryTextBlock}>
          <Text style={styles.categoryLabel}>Category</Text>
          <Text style={[styles.categoryName, { color: toolbarTint }]} numberOfLines={1}>
            {categoryName}
          </Text>
          <Text style={styles.categoryMeta}>{productCountText}</Text>
        </View>
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
          <Text style={[styles.categoryButtonText, { color: toolbarTint }]}>Change</Text>
        </Pressable>
      </View>

      <View style={styles.controlBar}>
        <View style={styles.modeSwitch}>
          <Pressable
            style={[
              styles.modeOption,
              viewMode === 'compact' ? styles.modeOptionActive : styles.modeOptionInactive,
            ]}
            onPress={() => onChangeViewMode('compact')}
            android_ripple={{ color: 'rgba(15, 118, 110, 0.16)', borderless: false }}
          >
            <Text style={viewMode === 'compact' ? styles.modeOptionTextActive : styles.modeOptionTextInactive}>
              Compact
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.modeOption,
              viewMode === 'regular' ? styles.modeOptionActive : styles.modeOptionInactive,
            ]}
            onPress={() => onChangeViewMode('regular')}
            android_ripple={{ color: 'rgba(15, 118, 110, 0.16)', borderless: false }}
          >
            <Text style={viewMode === 'regular' ? styles.modeOptionTextActive : styles.modeOptionTextInactive}>
              Regular
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
          placeholder="Search name or code"
        />
        <Pressable
          style={styles.scanButton}
          onPress={handleScan}
          android_ripple={{ color: 'rgba(255, 255, 255, 0.18)', borderless: false }}
        >
          <View style={styles.scanIconBox}>
            <AppIcon name="scan" size={14} color={colors.surface} />
          </View>
          <Text style={styles.scanText}>Scan</Text>
        </Pressable>
      </View>

      {filteredProducts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No products found</Text>
          <Text style={styles.emptyText}>Try another search or change category.</Text>
        </View>
      ) : (
        <FlatList
          key={viewMode}
          data={productGridItems}
          keyExtractor={(product, index) => product?.id ?? `empty-${index}`}
          numColumns={productColumns}
          columnWrapperStyle={styles.productRow}
          contentContainerStyle={styles.productGrid}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.productCell}>
              {item ? (
                <ProductTile product={item} mode={viewMode} onPress={() => onSelectProduct(item)} />
              ) : null}
            </View>
          )}
        />
      )}

      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable style={[styles.navItem, styles.navItemSelected]}>
          <AppIcon name="grid" size={19} color={colors.primary} />
          <Text style={styles.navItemActive}>Products</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={onOpenHistory}>
          <AppIcon name="history" size={19} color={colors.textMuted} />
          <Text style={styles.navItemText}>History</Text>
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
  outletBlock: {
    flex: 1,
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
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  changeText: {
    color: colors.primaryDark,
    fontSize: 12,
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
  changeOutletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  categoryButton: {
    minWidth: 78,
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
    width: '50%',
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
