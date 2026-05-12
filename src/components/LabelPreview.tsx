import { StyleSheet, Text, View } from 'react-native';

import type { Product } from '../domain/models';
import { calculateExpiry, formatLabelDate } from '../domain/shelfLife';
import { colors } from '../theme/colors';

type Props = {
  product: Product;
  openedAt: Date;
};

export function LabelPreview({ product, openedAt }: Props) {
  const expiresAt = calculateExpiry(openedAt, product.daysToExpire, product.hoursToExpire);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Label Preview</Text>
      <View style={styles.label}>
        <Text style={styles.lineStrong} numberOfLines={1}>
          {product.nameEn}
        </Text>
        <Text style={styles.line} numberOfLines={1}>
          {product.nameZh} | {product.storageMethod.en} {product.storageMethod.zh}
        </Text>
        <Text style={styles.line}>OPEN: {formatLabelDate(openedAt)}</Text>
        <Text style={styles.lineStrong}>EXP: {formatLabelDate(expiresAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  label: {
    aspectRatio: 1.5,
    justifyContent: 'center',
    gap: 7,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.surface,
    padding: 14,
  },
  line: {
    color: colors.text,
    fontSize: 15,
  },
  lineStrong: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
});
