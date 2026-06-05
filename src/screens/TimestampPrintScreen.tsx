import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '../components/AppIcon';
import { StickyBackHeader } from '../components/StickyBackHeader';
import { TimestampLabelPreview } from '../components/TimestampLabelPreview';
import type { Outlet, PrintJob } from '../domain/models';
import { formatLabelDate } from '../domain/shelfLife';
import { captureLabelBitmap, timestampLabelBitmapSpec } from '../services/labelBitmap';
import { printLabelBitmap } from '../services/printerService';
import { colors } from '../theme/colors';

type Props = {
  outlet: Outlet;
  onPrint: (printJob: PrintJob) => void;
  onBack: () => void;
};

export function TimestampPrintScreen({ outlet, onPrint, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const labelPreviewRef = useRef<View | null>(null);
  const [timestamp, setTimestamp] = useState(() => new Date());
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [printError, setPrintError] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setTimestamp(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const savePrintJob = async () => {
    setPrintError('');
    setIsPreparingPrint(true);
    const printedAt = new Date();
    setTimestamp(printedAt);

    try {
      await new Promise((resolve) => setTimeout(resolve, 80));
      const bitmap = await captureLabelBitmap(labelPreviewRef, timestampLabelBitmapSpec);
      const printResult = await printLabelBitmap({ bitmap, quantity: 1 });

      onPrint({
        id: `timestamp-${printedAt.getTime()}`,
        labelType: 'timestamp',
        outletId: outlet.id,
        outletName: outlet.name,
        productId: 'timestamp',
        productCode: 'TIME',
        productNameEn: `Timestamp ${formatLabelDate(printedAt)}`,
        productNameZh: '',
        quantity: 1,
        printedAt: printedAt.toISOString(),
        expiresAt: printedAt.toISOString(),
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

    void savePrintJob().catch((error: unknown) => {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Could not send the timestamp to the Bluetooth printer. Check pairing and try again.';
      setPrintError(errorMessage);
    });
  };

  return (
    <View style={styles.container}>
      <StickyBackHeader label="< Categories" onPress={onBack} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.summary}>
          <Text style={styles.label}>Current Outlet</Text>
          <Text style={styles.outletName}>{outlet.name}</Text>
          <Text style={styles.note}>This label prints the current time only.</Text>
        </View>
        <TimestampLabelPreview labelRef={labelPreviewRef} timestamp={timestamp} />
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 28) }]}>
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
          <Text style={styles.printText}>{isPreparingPrint ? 'Preparing...' : 'Print Timestamp'}</Text>
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
    gap: 14,
    padding: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  summary: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
  },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  outletName: {
    marginTop: 2,
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  note: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  errorBanner: {
    borderRadius: 8,
    backgroundColor: '#dc2626',
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
  printButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 8,
    backgroundColor: colors.primary,
    paddingVertical: 16,
  },
  printButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  printText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '900',
  },
});
