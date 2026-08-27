import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AdminListRow } from '../components/AdminListRow';
import { AppIcon } from '../components/AppIcon';
import { LanguageToggle } from '../components/LanguageToggle';
import { getCategoryColor } from '../domain/categoryColors';
import type { Product, ProductCategory } from '../domain/models';
import { useLanguage } from '../i18n/LanguageContext';
import { colors } from '../theme/colors';

type Props = {
  categories: ProductCategory[];
  products: Product[];
  onSelectCategory: (category: ProductCategory) => void;
  onAddCategory: () => void;
  onBack: () => void;
};

export function AdminCategoryListScreen({
  categories,
  products,
  onSelectCategory,
  onAddCategory,
  onBack,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useLanguage();
  const filteredCategories = categories.filter((category) => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return [category.name, category.codePrefix, category.scope].some((value) => value.toLowerCase().includes(query));
  });

  return (
    <View style={styles.container}>
      <View style={styles.topRow}><Text style={styles.back} onPress={onBack}>{`‹ ${t('admin')}`}</Text><LanguageToggle /></View>
      <View style={styles.header}>
        <Text style={styles.title}>{t('productCategories')}</Text>
        <Pressable style={styles.addButton} onPress={onAddCategory}>
          <AppIcon name="plus" size={22} color={colors.surface} />
        </Pressable>
      </View>
      <TextInput
        style={styles.searchBox}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder={t('searchCategory')}
      />
      <FlatList
        data={filteredCategories}
        keyExtractor={(category) => category.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const count = products.filter((product) => product.categoryId === item.id).length;
          return (
            <AdminListRow
              colorSwatch={getCategoryColor(item)}
              title={item.name}
              subtitle={t('categoryListSubtitle', { count, scope: item.scope === 'outlet' ? t('outletCustom') : t('company') })}
              badge={item.codePrefix}
              onPress={() => onSelectCategory(item)}
            />
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
    flex: 1,
    color: colors.text,
    fontSize: 28,
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
    marginBottom: 12,
  },
  list: {
    gap: 10,
    paddingBottom: 24,
  },
});
