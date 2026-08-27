import { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppIcon } from '../components/AppIcon';
import { LanguageToggle } from '../components/LanguageToggle';
import { getProductImageSource } from '../data/productImages';
import { getCategoryColor } from '../domain/categoryColors';
import type { Product, ProductCategory } from '../domain/models';
import { useLanguage } from '../i18n/LanguageContext';
import { colors } from '../theme/colors';

type Props = {
  products: Product[];
  categories: ProductCategory[];
  onSelectProduct: (product: Product) => void;
  onAddProduct: () => void;
  onBack: () => void;
};

export function AdminProductListScreen({
  products,
  categories,
  onSelectProduct,
  onAddProduct,
  onBack,
}: Props) {
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const { language, t } = useLanguage();

  const getCategoryName = (product: Product) =>
    categories.find((category) => category.id === product.categoryId)?.name ?? t('uncategorized');

  const categoryCounts = useMemo(
    () =>
      products.reduce((counts, product) => {
        counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1);
        return counts;
      }, new Map<string, number>()),
    [products],
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
  const customProductCount = products.filter((product) => product.source === 'outlet').length;
  const hasCustomProducts = customProductCount > 0;
  const allChip = { id: 'all', label: t('all'), count: products.length, color: getCategoryColor('all') };
  const chips = [
    allChip,
    ...categoryChips,
    ...(hasCustomProducts ? [{ id: 'custom', label: t('custom'), count: customProductCount, color: getCategoryColor('custom') }] : []),
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
  const filteredProducts = products.filter((product) => {
    if (selectedCategoryId === 'all') {
      return matchesSearch(product, searchQuery);
    }

    if (selectedCategoryId === 'custom') {
      return product.source === 'outlet' && matchesSearch(product, searchQuery);
    }

    return product.categoryId === selectedCategoryId && matchesSearch(product, searchQuery);
  });

  return (
    <View style={styles.container}>
      <View style={styles.topRow}><Text style={styles.back} onPress={onBack}>{`‹ ${t('admin')}`}</Text><LanguageToggle /></View>
      <View style={styles.header}>
        <Text style={styles.title}>{t('products')}</Text>
        <Pressable style={styles.addButton} onPress={onAddProduct}>
          <AppIcon name="plus" size={22} color={colors.surface} />
        </Pressable>
      </View>
      <TextInput
        style={styles.searchBox}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder={t('searchProductCode')}
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
              accessibilityLabel={filtersExpanded ? t('closeFilters') : t('openFilters')}
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
              <Text style={styles.filterPanelTitle}>{t('category')}</Text>
              <Text style={styles.filterPanelMeta}>{t('categoryShown', { count: filteredProducts.length })}</Text>
            </View>
            <ScrollView
              style={styles.filterOptionsScroll}
              contentContainerStyle={styles.filterOptions}
              nestedScrollEnabled
              showsVerticalScrollIndicator
            >
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
            </ScrollView>
          </View>
        ) : null}
      </View>
      <FlatList
        data={filteredProducts}
        keyExtractor={(product) => product.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t('noProductsFound')}</Text>
            <Text style={styles.emptyText}>{t('tryCategorySearch')}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const imageSource = getProductImageSource(item.imageUri);
          return (
            <Pressable style={styles.productRow} onPress={() => onSelectProduct(item)}>
              <View style={styles.thumb}>
                {imageSource ? (
                  <Image source={imageSource} style={styles.thumbImage} />
                ) : (
                  <Text style={styles.thumbText} numberOfLines={2}>
                    {language === 'zh-CN' ? item.nameZh : item.nameEn}
                  </Text>
                )}
              </View>
              <View style={styles.productText}>
                <Text style={styles.productName}>{language === 'zh-CN' ? item.nameZh : item.nameEn}</Text>
                <Text style={styles.productMeta}>
                  {item.productCode} | {getCategoryName(item)}
                </Text>
                <Text style={styles.productMeta}>
                  {item.storageMethod.en} {item.storageMethod.zh}
                </Text>
              </View>
              {item.source === 'outlet' ? <Text style={styles.badge}>{t('custom')}</Text> : null}
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
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 14,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
  },
  addButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.primary,
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
  filterOptionsScroll: {
    maxHeight: 220,
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
  thumb: {
    width: 58,
    height: 58,
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
  },
  productName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  productMeta: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  badge: {
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: '#dff3ea',
    color: colors.primaryDark,
    paddingHorizontal: 9,
    paddingVertical: 5,
    fontSize: 12,
    fontWeight: '900',
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
