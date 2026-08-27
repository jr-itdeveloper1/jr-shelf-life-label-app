import { FlatList, StyleSheet, Text, View } from 'react-native';

import { AdminListRow } from '../components/AdminListRow';
import { LanguageToggle } from '../components/LanguageToggle';
import type { Outlet, OutletProduct, Product } from '../domain/models';
import { useLanguage } from '../i18n/LanguageContext';
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
  const { t } = useLanguage();
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

    return t('visibleCount', { visible: visibleProducts.length, total: eligibleProducts.length });
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}><Text style={styles.back} onPress={onBack}>{`‹ ${t('admin')}`}</Text><LanguageToggle /></View>
      <Text style={styles.title}>{t('outletProductLists')}</Text>
      <Text style={styles.subtitle}>{t('outletProductListsSubtitle')}</Text>
      <FlatList
        data={outlets}
        keyExtractor={(outlet) => outlet.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <AdminListRow
            title={item.name}
            subtitle={t('shortCodeValue', { code: item.shortCode })}
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
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
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
