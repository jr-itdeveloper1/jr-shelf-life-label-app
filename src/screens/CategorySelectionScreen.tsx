import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '../components/AppIcon';
import { LanguageToggle } from '../components/LanguageToggle';
import { getCategoryColor } from '../domain/categoryColors';
import type { Outlet, Product, ProductCategory } from '../domain/models';
import { useLanguage } from '../i18n/LanguageContext';
import { colors } from '../theme/colors';

type CategoryVectorIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type Props = {
  outlet: Outlet;
  products: Product[];
  categories: ProductCategory[];
  canChangeOutlet: boolean;
  onSelectCategory: (categoryId: string) => void;
  onChangeOutlet: () => void;
  onOpenTimestamp: () => void;
  onOpenAdmin: () => void;
  onOpenHistory: () => void;
  onSignOut: () => void;
};

export function CategorySelectionScreen({
  outlet,
  products,
  categories,
  canChangeOutlet,
  onSelectCategory,
  onChangeOutlet,
  onOpenTimestamp,
  onOpenAdmin,
  onOpenHistory,
  onSignOut,
}: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const categoryCounts = products.reduce((counts, product) => {
    counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());
  const customProductCount = products.filter((product) => product.source === 'outlet').length;
  const visibleCategories = products.length === 0
    ? categories
    : categories.filter((category) => categoryCounts.has(category.id));
  const categoryOptions = [
    { id: 'all', name: t('allProducts'), color: getCategoryColor('all'), count: products.length, icon: 'view-grid' as CategoryVectorIconName },
    ...visibleCategories.map((category) => ({
      id: category.id,
      name: category.name,
      color: getCategoryColor(category),
      count: categoryCounts.get(category.id) ?? 0,
      icon: getCategoryIcon(category.id, category.name),
    })),
    ...(customProductCount > 0
      ? [{ id: 'custom', name: t('custom'), color: getCategoryColor('custom'), count: customProductCount, icon: 'store-outline' as CategoryVectorIconName }]
      : []),
  ];
  const categoryGridItems: Array<(typeof categoryOptions)[number] | null> =
    categoryOptions.length % 2 === 0 ? categoryOptions : [...categoryOptions, null];

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top + 12, 34) }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.outletLabel}>{t('currentOutlet')}</Text>
          <Text style={styles.outlet}>{outlet.name}</Text>
        </View>
        <View style={styles.headerActions}>
          <LanguageToggle />
          {canChangeOutlet ? (
            <Pressable style={styles.changeButton} onPress={onChangeOutlet}>
              <AppIcon name="change" size={16} color={colors.primary} />
              <Text style={styles.changeText}>{t('change')}</Text>
            </Pressable>
          ) : null}
          <Pressable style={styles.timestampButton} onPress={onOpenTimestamp}>
            <AppIcon name="history" size={16} color={colors.surface} />
            <Text style={styles.timestampText}>{t('timestamp')}</Text>
          </Pressable>
        </View>
      </View>
      <Text style={styles.title}>{t('chooseCategory')}</Text>
      <FlatList
        key="category-columns"
        data={categoryGridItems}
        keyExtractor={(category, index) => category?.id ?? `empty-${index}`}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.categoryCell}>
            {item ? (
              <Pressable
                style={[
                  styles.categoryRow,
                  {
                    backgroundColor: toPastelBackground(item.color),
                    borderColor: toPastelBorder(item.color),
                  },
                ]}
                onPress={() => onSelectCategory(item.id)}
                android_ripple={{ color: toPastelBorder(item.color), borderless: false }}
              >
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: toRgba(item.color, 0.18),
                      borderColor: toPastelBorder(item.color),
                    },
                  ]}
                >
                  <MaterialCommunityIcons name={item.icon} size={26} color={getReadableIconColor(item.color)} />
                </View>
                <View style={styles.categoryText}>
                  <Text style={styles.categoryName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.categoryMeta}>{t('productCount', { count: item.count })}</Text>
                </View>
              </Pressable>
            ) : null}
          </View>
        )}
      />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 12,
    marginBottom: 10,
    elevation: 1,
  },
  outletLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  outlet: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  headerActions: {
    alignItems: 'flex-end',
    gap: 7,
  },
  changeText: {
    color: colors.primary,
    fontWeight: '900',
  },
  timestampButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 8,
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  timestampText: {
    color: colors.surface,
    fontWeight: '900',
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
  },
  list: {
    gap: 6,
    paddingBottom: 92,
  },
  gridRow: {
    gap: 6,
    marginBottom: 6,
  },
  categoryRow: {
    flex: 1,
    height: 66,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  categoryCell: {
    flex: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryText: {
    flex: 1,
    justifyContent: 'center',
  },
  categoryName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  categoryMeta: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
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

function toPastelBackground(hexColor: string) {
  return toRgba(hexColor, 0.16);
}

function toPastelBorder(hexColor: string) {
  if (hexColor.toLowerCase() === '#ffffff') {
    return colors.textMuted;
  }

  return toRgba(hexColor, 0.34);
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

function getReadableIconColor(hexColor: string) {
  return hexColor.toLowerCase() === '#ffffff' ? colors.text : hexColor;
}

function getCategoryIcon(categoryId: string, categoryName: string): CategoryVectorIconName {
  const normalizedName = categoryName.toLowerCase();

  if (categoryId === 'eg' || normalizedName.includes('egg')) {
    return 'egg-outline';
  }

  if (categoryId === 'dy' || normalizedName.includes('dairy') || normalizedName.includes('milk')) {
    return 'baby-bottle-outline';
  }

  if (categoryId === 'se' || normalizedName.includes('sauce') || normalizedName.includes('dressing')) {
    return 'bottle-soda-classic-outline';
  }

  if (categoryId === 'bs' || normalizedName.includes('bread') || normalizedName.includes('spread')) {
    return 'bread-slice-outline';
  }

  if (categoryId === 'bv' || normalizedName.includes('beverage') || normalizedName.includes('drink')) {
    return 'cup-water';
  }

  if (categoryId === 'ff' || normalizedName.includes('frozen')) {
    return 'snowflake';
  }

  if (categoryId === 'dp' || normalizedName.includes('dried') || normalizedName.includes('dry')) {
    return 'white-balance-sunny';
  }

  if (categoryId === 'bk' || normalizedName.includes('bakery') || normalizedName.includes('cake')) {
    return 'food-croissant';
  }

  if (categoryId === 'ms' || normalizedName.includes('meat') || normalizedName.includes('seafood')) {
    return 'food-steak';
  }

  if (categoryId === 'veg' || normalizedName.includes('vegetable') || normalizedName.includes('veg')) {
    return 'leaf';
  }

  if (categoryId === 'rte' || normalizedName.includes('ready') || normalizedName.includes('meal')) {
    return 'food-takeout-box-outline';
  }

  return 'tag-outline';
}
