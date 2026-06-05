import type { Ref } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Product } from '../domain/models';
import { calculateExpiry, formatLabelDate, formatLabelDateNumeric, formatLabelTimeNumeric } from '../domain/shelfLife';
import { compactProductLabelBitmapSpec, labelBitmapSpec } from '../services/labelBitmap';
import { colors } from '../theme/colors';

const chineseFontFamily = Platform.select({
  ios: 'Heiti SC',
  android: 'sans-serif',
  default: 'sans-serif',
});

const englishFontFamily = Platform.select({
  ios: 'Noto Sans',
  android: 'Noto Sans',
  default: 'Noto Sans',
});

export type ProductLabelMode = 'full' | 'compact';

type Props = {
  product: Product;
  openedAt: Date;
  mode?: ProductLabelMode;
  onChangeMode?: (mode: ProductLabelMode) => void;
  labelRef?: Ref<View>;
};

export function LabelPreview({ product, openedAt, mode = 'full', onChangeMode, labelRef }: Props) {
  const expiresAt = calculateExpiry(openedAt, product.daysToExpire, product.hoursToExpire);
  const previewSpec = mode === 'compact' ? compactProductLabelBitmapSpec : labelBitmapSpec;
  const compactOpenLine = `OPEN  : ${formatLabelDateNumeric(openedAt)} ${formatLabelTimeNumeric(openedAt)}`;
  const compactUseByLine = `USE BY: ${formatLabelDateNumeric(expiresAt)} ${formatLabelTimeNumeric(expiresAt)}`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Label Preview</Text>
          <Text style={styles.sizeHint}>({previewSpec.widthMm} x {previewSpec.heightMm})</Text>
        </View>
        {onChangeMode ? (
          <View style={styles.modeSwitch}>
            <Pressable
              style={[styles.modeButton, mode === 'full' && styles.modeButtonActive]}
              onPress={() => onChangeMode('full')}
            >
              <Text style={mode === 'full' ? styles.modeTextActive : styles.modeText}>Normal</Text>
            </Pressable>
            <Pressable
              style={[styles.modeButton, mode === 'compact' && styles.modeButtonActive]}
              onPress={() => onChangeMode('compact')}
            >
              <Text style={mode === 'compact' ? styles.modeTextActive : styles.modeText}>Compact</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
      <View
        style={[
          styles.previewFrame,
          mode === 'compact' && styles.compactPreviewFrame,
          { aspectRatio: previewSpec.widthMm / previewSpec.heightMm },
        ]}
      >
        <View
          ref={labelRef}
          collapsable={false}
          style={[
            styles.label,
            mode === 'compact' && styles.compactLabel,
            { aspectRatio: previewSpec.widthMm / previewSpec.heightMm },
          ]}
        >
          {mode === 'compact' ? (
            <View style={styles.compactContent}>
              <Text style={styles.compactLine} numberOfLines={1} ellipsizeMode="clip" allowFontScaling={false}>
                {compactOpenLine}
              </Text>
              <Text style={styles.compactLine} numberOfLines={1} ellipsizeMode="clip" allowFontScaling={false}>
                {compactUseByLine}
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.productName} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.62}>
                {product.nameEn}
              </Text>
              <Text style={styles.productChinese} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.62}>
                {product.nameZh}
              </Text>
              <Text style={styles.storageLine} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
                <Text style={styles.storageEnglish}>{product.storageMethod.en}</Text>
                <Text style={styles.storageChinese}> {product.storageMethod.zh}</Text>
              </Text>
              <Text style={styles.dateLine} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
                OPEN: {formatLabelDate(openedAt)}
              </Text>
              <Text style={styles.expiryLine} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
                USE BY: {formatLabelDate(expiresAt)}
              </Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  sizeHint: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  modeSwitch: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 3,
  },
  modeButton: {
    minWidth: 68,
    alignItems: 'center',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  modeButtonActive: {
    backgroundColor: colors.primary,
  },
  modeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  modeTextActive: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '900',
  },
  previewFrame: {
    alignSelf: 'center',
    width: '100%',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  compactPreviewFrame: {
    width: '72%',
  },
  label: {
    width: '100%',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 4,
    justifyContent: 'center',
    gap: 4,
  },
  compactLabel: {
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  compactContent: {
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 4,
  },
  compactLine: {
    width: '100%',
    color: '#000000',
    fontFamily: englishFontFamily,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    textAlign: 'left',
  },
  productName: {
    color: '#000000',
    fontFamily: englishFontFamily,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 25,
  },
  productChinese: {
    color: '#000000',
    fontFamily: chineseFontFamily,
    fontSize: 21,
    fontWeight: '400',
    lineHeight: 24,
  },
  storageLine: {
    color: '#000000',
    fontSize: 14,
    lineHeight: 16,
  },
  storageEnglish: {
    fontFamily: englishFontFamily,
    fontWeight: '700',
  },
  storageChinese: {
    fontFamily: chineseFontFamily,
    fontWeight: '400',
  },
  dateLine: {
    color: '#000000',
    fontFamily: englishFontFamily,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  expiryLine: {
    color: '#000000',
    fontFamily: englishFontFamily,
    fontSize: 19,
    fontWeight: '700',
    lineHeight: 22,
  },
});
