import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LabelPreview } from '../components/LabelPreview';
import { QuantitySelector } from '../components/QuantitySelector';
import type { Outlet, Product } from '../domain/models';
import { colors } from '../theme/colors';

type Props = {
  outlet: Outlet;
  product: Product;
  quantity: number;
  onChangeQuantity: (quantity: number) => void;
  onBack: () => void;
};

export function ProductDetailScreen({
  outlet,
  product,
  quantity,
  onChangeQuantity,
  onBack,
}: Props) {
  const openedAt = new Date();

  const handlePrint = () => {
    if (quantity > 5) {
      Alert.alert('Confirm Quantity', `Print ${quantity} labels for ${product.nameEn}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: `Print ${quantity}` },
      ]);
      return;
    }

    Alert.alert('Mock Print', `Saved print job for ${quantity} label(s).`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable onPress={onBack}>
        <Text style={styles.back}>{'< Products'}</Text>
      </Pressable>
      <View style={styles.summary}>
        <View style={styles.imageFallback}>
          <Text style={styles.fallbackName}>{product.nameEn}</Text>
          <Text style={styles.fallbackNameZh}>{product.nameZh}</Text>
        </View>
        <View style={styles.summaryText}>
          <Text style={styles.name}>{product.nameEn}</Text>
          <Text style={styles.nameZh}>{product.nameZh}</Text>
          <Text style={styles.meta}>Code: {product.productCode}</Text>
          <Text style={styles.meta}>Outlet: {outlet.shortCode}</Text>
        </View>
      </View>
      <View style={styles.infoPanel}>
        <Text style={styles.infoLine}>
          {product.storageMethod.en} {product.storageMethod.zh}
        </Text>
        <Text style={styles.infoLine}>
          Shelf life: {product.daysToExpire} day(s) {product.hoursToExpire} hour(s)
        </Text>
      </View>
      <LabelPreview product={product} openedAt={openedAt} />
      <QuantitySelector quantity={quantity} onChange={onChangeQuantity} />
      <Pressable style={styles.printButton} onPress={handlePrint}>
        <Text style={styles.printText}>Print</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    gap: 18,
    padding: 16,
    paddingTop: 56,
    paddingBottom: 40,
  },
  back: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  summary: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  imageFallback: {
    width: 112,
    height: 112,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.surfaceMuted,
    padding: 10,
  },
  fallbackName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  fallbackNameZh: {
    marginTop: 6,
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
  summaryText: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  nameZh: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 19,
    fontWeight: '700',
  },
  meta: {
    marginTop: 6,
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  infoPanel: {
    gap: 6,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  infoLine: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  printButton: {
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.primary,
    paddingVertical: 16,
  },
  printText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '900',
  },
});
