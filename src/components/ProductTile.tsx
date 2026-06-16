import { memo, useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { getProductImageSource } from '../data/productImages';
import type { Product } from '../domain/models';
import { colors } from '../theme/colors';

type Props = {
  product: Product;
  onPress: () => void;
  mode?: 'compact' | 'regular';
};

export const ProductTile = memo(function ProductTile({ product, onPress, mode = 'compact' }: Props) {
  const imageSource = useMemo(() => getProductImageSource(product.imageUri), [product.imageUri]);

  if (mode === 'regular') {
    return (
      <Pressable
        style={styles.regularCard}
        onPress={onPress}
        android_ripple={{ color: colors.surfacePressed, borderless: false }}
      >
        {imageSource ? (
          <View style={styles.imageBox}>
            <Image source={imageSource} style={styles.productImage} />
          </View>
        ) : (
          <View style={styles.imageFallback}>
            <Text style={styles.fallbackName} numberOfLines={2}>
              {product.nameEn}
            </Text>
            <Text style={styles.fallbackNameZh} numberOfLines={1}>
              {product.nameZh}
            </Text>
          </View>
        )}
        <View style={styles.regularBody}>
          <Text style={styles.regularName} numberOfLines={1}>
            {product.nameEn}
          </Text>
          <Text style={styles.regularNameZh} numberOfLines={1}>
            {product.nameZh}
          </Text>
          <View style={styles.regularMetaRow}>
            <Text style={styles.storageBadge} numberOfLines={1}>
              {product.storageMethod.en}
            </Text>
            <Text style={styles.regularCode} numberOfLines={1}>
              {product.productCode}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={styles.compactCard}
      onPress={onPress}
      android_ripple={{ color: colors.surfacePressed, borderless: false }}
    >
      <View style={styles.compactBody}>
        <Text style={styles.name} numberOfLines={2}>
          {product.nameEn}
        </Text>
        <Text style={styles.nameZh} numberOfLines={1}>
          {product.nameZh}
        </Text>
      </View>
      <Text style={styles.code} numberOfLines={1}>
        {product.productCode}
      </Text>
      <View style={styles.tapHint} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  compactCard: {
    flex: 1,
    height: 74,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
    elevation: 1,
  },
  compactBody: {
    gap: 4,
    paddingRight: 58,
  },
  name: {
    color: colors.text,
    fontSize: 13.5,
    fontWeight: '900',
    lineHeight: 17,
  },
  nameZh: {
    color: colors.textMuted,
    fontSize: 12.5,
    fontWeight: '800',
  },
  tapHint: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 3,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: colors.primarySoft,
  },
  code: {
    position: 'absolute',
    top: 8,
    right: 8,
    maxWidth: 56,
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: colors.surfaceMuted,
    color: colors.textMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 9,
    fontWeight: '900',
    textAlign: 'center',
  },
  regularCard: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
  },
  imageBox: {
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  imageFallback: {
    height: 84,
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
    padding: 10,
  },
  fallbackName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  fallbackNameZh: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '800',
  },
  regularBody: {
    padding: 9,
  },
  regularName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  regularNameZh: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  regularMetaRow: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  storageBadge: {
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    color: colors.primaryDark,
    paddingHorizontal: 7,
    paddingVertical: 2,
    fontSize: 10,
    fontWeight: '900',
  },
  regularCode: {
    flexShrink: 1,
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'right',
  },
});
