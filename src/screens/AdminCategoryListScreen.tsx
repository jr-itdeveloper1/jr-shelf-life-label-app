import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AdminListRow } from '../components/AdminListRow';
import { AppIcon } from '../components/AppIcon';
import { getCategoryColor } from '../domain/categoryColors';
import type { Product, ProductCategory } from '../domain/models';
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
  const filteredCategories = categories.filter((category) => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return [category.name, category.codePrefix, category.scope].some((value) => value.toLowerCase().includes(query));
  });

  return (
    <View style={styles.container}>
      <Text style={styles.back} onPress={onBack}>
        {'< Admin'}
      </Text>
      <View style={styles.header}>
        <Text style={styles.title}>Product Categories</Text>
        <Pressable style={styles.addButton} onPress={onAddCategory}>
          <AppIcon name="plus" size={22} color={colors.surface} />
        </Pressable>
      </View>
      <TextInput
        style={styles.searchBox}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search category"
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
              subtitle={`${count} products | ${item.scope === 'outlet' ? 'Outlet custom' : 'Company'} | Tap to edit`}
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
