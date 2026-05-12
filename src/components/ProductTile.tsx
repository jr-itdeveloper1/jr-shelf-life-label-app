import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Product } from '../domain/models';
import { colors } from '../theme/colors';

type Props = {
  product: Product;
  onPress: () => void;
};

export function ProductTile({ product, onPress }: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.imageFallback}>
        <Text style={styles.fallbackName} numberOfLines={2}>
          {product.nameEn}
        </Text>
        <Text style={styles.fallbackNameZh} numberOfLines={1}>
          {product.nameZh}
        </Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {product.nameEn}
        </Text>
        <Text style={styles.nameZh} numberOfLines={1}>
          {product.nameZh}
        </Text>
        <Text style={styles.tag} numberOfLines={1}>
          {product.storageMethod.en} {product.storageMethod.zh}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 148,
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  imageFallback: {
    minHeight: 104,
    justifyContent: 'center',
    padding: 12,
    backgroundColor: colors.surfaceMuted,
  },
  fallbackName: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  fallbackNameZh: {
    marginTop: 6,
    color: colors.textMuted,
    fontSize: 18,
    fontWeight: '600',
  },
  body: {
    padding: 10,
    gap: 3,
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  nameZh: {
    color: colors.textMuted,
    fontSize: 14,
  },
  tag: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
    color: colors.primaryDark,
    backgroundColor: '#dff3ea',
    fontSize: 12,
    fontWeight: '700',
  },
});
