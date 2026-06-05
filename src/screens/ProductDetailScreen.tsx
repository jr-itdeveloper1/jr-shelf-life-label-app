import { useRef, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '../components/AppIcon';
import { LabelPreview, type ProductLabelMode } from '../components/LabelPreview';
import { QuantitySelector } from '../components/QuantitySelector';
import { StickyBackHeader } from '../components/StickyBackHeader';
import { getProductImageSource } from '../data/productImages';
import type { Outlet, PrintJob, Product } from '../domain/models';
import { calculateExpiry } from '../domain/shelfLife';
import { captureLabelBitmap, compactProductLabelBitmapSpec, labelBitmapSpec } from '../services/labelBitmap';
import { printLabelBitmap } from '../services/printerService';
import { colors } from '../theme/colors';

type Props = {
  outlet: Outlet;
  product: Product;
  quantity: number;
  labelMode: ProductLabelMode;
  onChangeQuantity: (quantity: number) => void;
  onChangeLabelMode: (labelMode: ProductLabelMode) => void;
  onPrint: (printJob: PrintJob) => void;
  onBack: () => void;
};

export function ProductDetailScreen({
  outlet,
  product,
  quantity,
  labelMode,
  onChangeQuantity,
  onChangeLabelMode,
  onPrint,
  onBack,
}: Props) {
  const insets = useSafeAreaInsets();
  const labelPreviewRef = useRef<View | null>(null);
  const [openedAt] = useState(() => new Date());
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [printError, setPrintError] = useState('');
  const imageSource = getProductImageSource(product.imageUri);
  const shelfLifeText = `${product.daysToExpire} day(s) ${product.hoursToExpire} hour(s)`;

  const savePrintJob = async () => {
    setPrintError('');
    setIsPreparingPrint(true);
    const now = new Date();

    try {
      const expiresAt = calculateExpiry(openedAt, product.daysToExpire, product.hoursToExpire);
      const bitmap = await captureLabelBitmap(
        labelPreviewRef,
        labelMode === 'compact' ? compactProductLabelBitmapSpec : labelBitmapSpec,
      );
      const printResult = await printLabelBitmap({ bitmap, quantity });

      onPrint({
        id: `${product.id}-${now.getTime()}`,
        labelType: 'product',
        outletId: outlet.id,
        outletName: outlet.name,
        productId: product.id,
        productCode: product.productCode,
        productNameEn: product.nameEn,
        productNameZh: product.nameZh,
        quantity,
        printedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        labelBitmapUri: printResult.bitmapUri,
        labelBitmapWidthPx: bitmap.widthPx,
        labelBitmapHeightPx: bitmap.heightPx,
        printerName: printResult.printerName,
        printerAddress: printResult.printerAddress,
        status: printResult.status,
      });
    } finally {
      setIsPreparingPrint(false);
    }
  };

  const handlePrint = () => {
    if (isPreparingPrint) {
      return;
    }

    if (quantity > 5) {
      Alert.alert('Confirm Quantity', `Print ${quantity} labels for ${product.nameEn}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: `Print ${quantity}`, onPress: () => void savePrintJob().catch(handlePrintError) },
      ]);
      return;
    }

    void savePrintJob().catch(handlePrintError);
  };

  const handlePrintError = (error: unknown) => {
    const errorMessage = error instanceof Error
      ? error.message
      : 'Could not send the label to the Bluetooth printer. Check pairing and try again.';
    setPrintError(errorMessage);
  };

  return (
    <View style={styles.container}>
      <StickyBackHeader label="< Products" onPress={onBack} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 112 }]}
      >
        <View style={[styles.summary, !imageSource && styles.summaryNoImage]}>
          {imageSource ? (
            <View style={styles.imageBox}>
              <Image source={imageSource} style={styles.productImage} />
            </View>
          ) : null}
          <View style={styles.summaryText}>
            <Text style={[styles.name, !imageSource && styles.nameNoImage]}>{product.nameEn}</Text>
            <Text style={[styles.nameZh, !imageSource && styles.nameZhNoImage]}>{product.nameZh}</Text>
            <View style={styles.productFacts}>
              <Text style={styles.storageBadge}>
                {product.storageMethod.en} {product.storageMethod.zh}
              </Text>
              <Text style={styles.shelfLife}>Shelf life: {shelfLifeText}</Text>
            </View>
          </View>
        </View>
        <LabelPreview
          labelRef={labelPreviewRef}
          product={product}
          openedAt={openedAt}
          mode={labelMode}
          onChangeMode={onChangeLabelMode}
        />
        <QuantitySelector quantity={quantity} onChange={onChangeQuantity} />
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {printError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorTitle}>Print Error</Text>
            <Text style={styles.errorText}>{printError}</Text>
          </View>
        ) : null}
        <Pressable
          disabled={isPreparingPrint}
          style={[styles.printButton, isPreparingPrint && styles.printButtonDisabled]}
          onPress={handlePrint}
        >
          <AppIcon name="print" size={20} color={colors.surface} />
          <Text style={styles.printText}>{isPreparingPrint ? 'Preparing...' : 'Print'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    gap: 12,
    padding: 16,
    paddingTop: 12,
  },
  back: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  summary: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 12,
    elevation: 1,
  },
  summaryNoImage: {
    padding: 16,
  },
  imageBox: {
    width: 82,
    height: 82,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  summaryText: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '900',
  },
  nameNoImage: {
    fontSize: 30,
  },
  nameZh: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 17,
    fontWeight: '700',
  },
  nameZhNoImage: {
    fontSize: 24,
  },
  productFacts: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  storageBadge: {
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    color: colors.primaryDark,
    paddingHorizontal: 9,
    paddingVertical: 5,
    fontSize: 13,
    fontWeight: '900',
  },
  shelfLife: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  printButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 8,
    backgroundColor: colors.primary,
    minHeight: 54,
    paddingVertical: 14,
  },
  printButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingTop: 10,
    elevation: 4,
  },
  errorBanner: {
    borderRadius: 8,
    backgroundColor: colors.danger,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  errorTitle: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '900',
  },
  errorText: {
    marginTop: 2,
    color: colors.surface,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  printText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '900',
  },
});
