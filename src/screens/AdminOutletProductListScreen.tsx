import { FlatList, StyleSheet, Text, View } from 'react-native';

import { AdminListRow } from '../components/AdminListRow';
import type { Outlet, OutletProduct, Product } from '../domain/models';
import { colors } from '../theme/colors';

type Props = {
  outlets: Outlet[];
  products: Product[];
  outletProducts: OutletProduct[];
  onSelectOutlet: (outlet: Outlet) => void;
  onBack: () => void;
};

export function AdminOutletProductListScreen({
  outlets,
  products,
  outletProducts,
  onSelectOutlet,
  onBack,
}: Props) {
  const getProductCounts = (outlet: Outlet) => {
    const eligibleProducts = products.filter(
      (product) => product.source === 'company' || product.outletId === outlet.id,
    );
    const visibleProducts = eligibleProducts.filter((product) => {
      const setting = outletProducts.find(
        (outletProduct) =>
          outletProduct.outletId === outlet.id && outletProduct.productId === product.id,
      );
      return setting?.active ?? true;
    });

    return `${visibleProducts.length}/${eligibleProducts.length} visible`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.back} onPress={onBack}>
        {'< Admin'}
      </Text>
      <Text style={styles.title}>Outlet Product Lists</Text>
      <Text style={styles.subtitle}>Choose which products each outlet can see on the print screen.</Text>
      <FlatList
        data={outlets}
        keyExtractor={(outlet) => outlet.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <AdminListRow
            title={item.name}
            subtitle={`Short code ${item.shortCode}`}
            badge={getProductCounts(item)}
            onPress={() => onSelectOutlet(item)}
          />
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
  back: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  title: {
    marginTop: 18,
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 6,
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  list: {
    gap: 10,
    paddingTop: 18,
    paddingBottom: 24,
  },
});
