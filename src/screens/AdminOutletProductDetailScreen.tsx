import { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { AppIcon } from '../components/AppIcon';
import { getProductImageSource } from '../data/productImages';
import { getCategoryColor } from '../domain/categoryColors';
import type { Outlet, OutletProduct, Product, ProductCategory } from '../domain/models';
import { colors } from '../theme/colors';

type Props = {
  outlet: Outlet;
  products: Product[];
  categories: ProductCategory[];
  outletProducts: OutletProduct[];
  onToggleProduct: (outletId: string, productId: string, active: boolean) => void;
  onBack: () => void;
};

export function AdminOutletProductDetailScreen({
  outlet,
  products,
  categories,
  outletProducts,
  onToggleProduct,
  onBack,
}: Props) {
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const eligibleProducts = products.filter(
    (product) => product.source === 'company' || product.outletId === outlet.id,
  );

  const isVisible = (product: Product) => {
    const setting = outletProducts.find(
      (outletProduct) =>
        outletProduct.outletId === outlet.id && outletProduct.productId === product.id,
    );
    return setting?.active ?? true;
  };

  const visibleCount = eligibleProducts.filter(isVisible).length;

  const getCategoryName = (product: Product) =>
    categories.find((category) => category.id === product.categoryId)?.name ?? 'Uncategorized';

  const categoryCounts = useMemo(
    () =>
      eligibleProducts.reduce((counts, product) => {
        counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1);
        return counts;
      }, new Map<string, number>()),
    [eligibleProducts],
  );
  const categoryChips = useMemo(
    () =>
      categories
        .filter((category) => categoryCounts.has(category.id))
        .map((category) => ({
          id: category.id,
          label: category.name,
          count: categoryCounts.get(category.id) ?? 0,
          color: getCategoryColor(category),
        })),
    [categories, categoryCounts],
  );
  const customProductCount = eligibleProducts.filter((product) => product.source === 'outlet').length;
  const allChip = { id: 'all', label: 'All', count: eligibleProducts.length, color: getCategoryColor('all') };
  const chips = [
    allChip,
    ...categoryChips,
    ...(customProductCount > 0 ? [{ id: 'custom', label: 'Custom', count: customProductCount, color: getCategoryColor('custom') }] : []),
  ];
  const selectedChip = chips.find((chip) => chip.id === selectedCategoryId) ?? allChip;
  const quickCategoryChips = [...categoryChips].sort((left, right) => right.count - left.count).slice(0, 2);
  const visibleChipMap = new Map<string, typeof allChip>();
  [allChip, selectedChip, ...quickCategoryChips].forEach((chip) => {
    if (!visibleChipMap.has(chip.id) && visibleChipMap.size < 3) {
      visibleChipMap.set(chip.id, chip);
    }
  });
  const visibleChips = Array.from(visibleChipMap.values());
  const visibleChipIds = new Set(visibleChips.map((chip) => chip.id));
  const hiddenChipCount = chips.filter((chip) => !visibleChipIds.has(chip.id)).length;
  const filteredProducts = eligibleProducts.filter((product) => {
    if (!matchesSearch(product, searchQuery)) {
      return false;
    }

    if (selectedCategoryId === 'all') {
      return true;
    }

    if (selectedCategoryId === 'custom') {
      return product.source === 'outlet';
    }

    return product.categoryId === selectedCategoryId;
  });

  return (
    <View style={styles.container}>
      <Text style={styles.back} onPress={onBack}>
        {'< Outlet Product Lists'}
      </Text>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>{outlet.shortCode}</Text>
          <Text style={styles.title}>{outlet.name}</Text>
          <Text style={styles.subtitle}>{visibleCount} products visible on this outlet</Text>
        </View>
        <Text style={styles.countBadge}>{`${visibleCount}/${eligibleProducts.length}`}</Text>
      </View>
      <TextInput
        style={styles.searchBox}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search product or code"
      />
      <View style={styles.filterArea}>
        <View style={styles.filterRow}>
          <View style={styles.chips}>
            {visibleChips.map((chip) => {
              const isActive = chip.id === selectedCategoryId;
              return (
                <Pressable
                  key={chip.id}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: toPastelBackground(chip.color, isActive),
                      borderColor: toPastelBorder(chip.color, isActive),
                    },
                  ]}
                  onPress={() => {
                    setSelectedCategoryId(chip.id);
                    setFiltersExpanded(false);
                  }}
                >
                  <Text numberOfLines={1} style={styles.chipText}>
                    {chip.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {filtersExpanded || hiddenChipCount > 0 ? (
            <Pressable
              accessibilityLabel={filtersExpanded ? 'Close filters' : 'Open filters'}
              style={[styles.filterButton, filtersExpanded && styles.filterButtonActive]}
              onPress={() => setFiltersExpanded((currentValue) => !currentValue)}
            >
              <AppIcon name="filter" size={18} color={filtersExpanded ? colors.surface : colors.primaryDark} />
              {!filtersExpanded && hiddenChipCount > 0 ? (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{hiddenChipCount}</Text>
                </View>
              ) : null}
            </Pressable>
          ) : null}
        </View>
        {filtersExpanded ? (
          <View style={styles.filterPanel}>
            <View style={styles.filterPanelHeader}>
              <Text style={styles.filterPanelTitle}>Category</Text>
              <Text style={styles.filterPanelMeta}>{filteredProducts.length} shown</Text>
            </View>
            <View style={styles.filterOptions}>
              {chips.map((chip) => {
                const isActive = chip.id === selectedCategoryId;
                return (
                  <Pressable
                    key={chip.id}
                    style={[
                      styles.filterOption,
                      {
                        backgroundColor: toPastelBackground(chip.color, isActive),
                        borderColor: toPastelBorder(chip.color, isActive),
                      },
                    ]}
                    onPress={() => {
                      setSelectedCategoryId(chip.id);
                      setFiltersExpanded(false);
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      style={styles.filterOptionText}
                    >
                      {chip.label}
                    </Text>
                    <Text style={styles.filterOptionCount}>
                      {chip.count}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}
      </View>
      <FlatList
        data={filteredProducts}
        keyExtractor={(product) => product.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptyText}>Try another category or search term.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const visible = isVisible(item);
          const imageSource = getProductImageSource(item.imageUri);
          return (
            <Pressable
              style={[styles.productRow, !visible && styles.productRowHidden]}
              onPress={() => onToggleProduct(outlet.id, item.id, !visible)}
            >
              <View style={styles.thumb}>
                {imageSource ? (
                  <Image source={imageSource} style={styles.thumbImage} />
                ) : (
                  <Text style={styles.thumbText} numberOfLines={2}>
                    {item.nameEn}
                  </Text>
                )}
              </View>
              <View style={styles.productText}>
                <Text style={styles.productName}>{item.nameEn}</Text>
                <Text style={styles.productNameZh}>{item.nameZh}</Text>
                <Text style={styles.productMeta}>
                  {item.productCode} | {getCategoryName(item)}
                </Text>
                <Text style={styles.productMeta}>
                  {item.source === 'outlet' ? 'Outlet custom' : 'Company product'}
                </Text>
              </View>
              <View style={styles.switchBlock}>
                <Switch
                  value={visible}
                  onValueChange={(nextValue) => onToggleProduct(outlet.id, item.id, nextValue)}
                  trackColor={{ false: colors.border, true: '#9ed9c2' }}
                  thumbColor={visible ? colors.primary : colors.disabled}
                />
                <Text style={[styles.statusText, !visible && styles.statusTextHidden]}>
                  {visible ? 'Show' : 'Hide'}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
    paddingTop: 56,
  },
  back: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 4,
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  countBadge: {
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: '#dff3ea',
    color: colors.primaryDark,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    fontWeight: '900',
  },
  searchBox: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    padding: 14,
  },
  filterArea: {
    marginTop: 12,
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chips: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    maxWidth: 160,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: {
    flexShrink: 1,
    color: colors.text,
    fontWeight: '800',
    textAlign: 'center',
  },
  filterButton: {
    width: 42,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#e7f4ee',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -6,
    right: -5,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: colors.warning,
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: '900',
  },
  filterPanel: {
    marginTop: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 10,
  },
  filterPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  filterPanelTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  filterPanelMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  filterOptions: {
    gap: 8,
  },
  filterOption: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  filterOptionText: {
    flex: 1,
    color: colors.text,
    fontWeight: '800',
  },
  filterOptionCount: {
    marginLeft: 8,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '900',
  },
  list: {
    gap: 10,
    paddingBottom: 24,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 12,
  },
  productRowHidden: {
    opacity: 0.58,
  },
  thumb: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.surfaceMuted,
    marginRight: 12,
  },
  thumbText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '900',
    paddingHorizontal: 4,
    textAlign: 'center',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    resizeMode: 'contain',
  },
  productText: {
    flex: 1,
    paddingRight: 10,
  },
  productName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  productNameZh: {
    marginTop: 2,
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  productMeta: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  switchBlock: {
    alignItems: 'center',
    gap: 4,
    minWidth: 54,
  },
  statusText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '900',
  },
  statusTextHidden: {
    color: colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 20,
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
  },
});

function matchesSearch(product: Product, searchQuery: string) {
  const query = searchQuery.trim().toLowerCase();

  if (!query) {
    return true;
  }

  return [product.nameEn, product.nameZh, product.productCode, product.storageMethod.en, product.storageMethod.zh]
    .some((value) => value.toLowerCase().includes(query));
}

function toPastelBackground(hexColor: string, isActive: boolean) {
  return toRgba(hexColor, isActive ? 0.32 : 0.2);
}

function toPastelBorder(hexColor: string, isActive: boolean) {
  if (hexColor.toLowerCase() === '#ffffff') {
    return isActive ? colors.text : colors.textMuted;
  }

  return toRgba(hexColor, isActive ? 0.72 : 0.42);
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
