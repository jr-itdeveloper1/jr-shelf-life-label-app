import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { ProductTile } from '../components/ProductTile';
import type { Outlet, Product } from '../domain/models';
import { colors } from '../theme/colors';

type Props = {
  outlet: Outlet;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onChangeOutlet: () => void;
};

export function ProductGridScreen({ outlet, products, onSelectProduct, onChangeOutlet }: Props) {
  const { width } = useWindowDimensions();
  const columns = width >= 430 ? 3 : 2;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onChangeOutlet}>
          <Text style={styles.outlet}>{outlet.name}</Text>
        </Pressable>
        <Pressable style={styles.scanButton}>
          <Text style={styles.scanText}>Scan</Text>
        </Pressable>
      </View>
      <View style={styles.searchBox}>
        <Text style={styles.searchText}>Search product or code</Text>
      </View>
      <View style={styles.chips}>
        {['All', 'Dairy', 'Nuts', 'Sauce', 'Custom'].map((chip, index) => (
          <View key={chip} style={[styles.chip, index === 0 && styles.chipActive]}>
            <Text style={[styles.chipText, index === 0 && styles.chipTextActive]}>{chip}</Text>
          </View>
        ))}
      </View>
      <FlatList
        key={columns}
        data={products}
        keyExtractor={(product) => product.id}
        numColumns={columns}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <ProductTile product={item} onPress={() => onSelectProduct(item)} />
        )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  outlet: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  scanButton: {
    borderRadius: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  scanText: {
    color: colors.surface,
    fontWeight: '800',
  },
  searchBox: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
  },
  searchText: {
    color: colors.textMuted,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 14,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  chipText: {
    color: colors.text,
    fontWeight: '800',
  },
  chipTextActive: {
    color: colors.surface,
  },
  grid: {
    gap: 12,
    paddingBottom: 24,
  },
  gridRow: {
    gap: 12,
    marginBottom: 12,
  },
});
