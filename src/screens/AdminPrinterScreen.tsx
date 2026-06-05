import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '../components/AppIcon';
import { StickyBackHeader } from '../components/StickyBackHeader';
import {
  getPairedBluetoothPrinters,
  getPreferredBluetoothPrinter,
  setPreferredBluetoothPrinter,
  type BluetoothPrinterDevice,
} from '../services/printerService';
import { colors } from '../theme/colors';

type Props = {
  onBack: () => void;
};

export function AdminPrinterScreen({ onBack }: Props) {
  const [printers, setPrinters] = useState<BluetoothPrinterDevice[]>([]);
  const [selectedPrinterAddress, setSelectedPrinterAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadPrinters = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const [pairedPrinters, preferredPrinter] = await Promise.all([
        getPairedBluetoothPrinters(),
        getPreferredBluetoothPrinter(),
      ]);
      setPrinters(pairedPrinters);
      setSelectedPrinterAddress(preferredPrinter?.address ?? '');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not load supported Bluetooth printers.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPrinters();
  }, []);

  const choosePrinter = async (printer: BluetoothPrinterDevice) => {
    setSelectedPrinterAddress(printer.address);

    try {
      await setPreferredBluetoothPrinter(printer);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not save selected printer.');
    }
  };

  const selectedPrinter = printers.find((printer) => printer.address === selectedPrinterAddress);

  return (
    <View style={styles.container}>
      <StickyBackHeader label="< Admin" onPress={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.eyebrow}>Bluetooth</Text>
            <Text style={styles.title}>Printers</Text>
            <Text style={styles.subtitle}>The app only shows supported paired label printers.</Text>
          </View>
          <Pressable
            style={[styles.refreshButton, isLoading && styles.refreshButtonDisabled]}
            onPress={() => void loadPrinters()}
            disabled={isLoading}
          >
            <Text style={styles.refreshText}>{isLoading ? 'Loading' : 'Refresh'}</Text>
          </Pressable>
        </View>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Printer Check Failed</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.helpBox}>
          <Text style={styles.helpTitle}>{selectedPrinter ? 'Selected Printer' : 'Before printing'}</Text>
          <Text style={styles.helpText}>
            {selectedPrinter
              ? `${selectedPrinter.name || 'Bluetooth Printer'} will be used for label printing.`
              : 'Pair the printer in Android Bluetooth settings first. Non-printer accessories are hidden from this list.'}
          </Text>
        </View>

        <View style={styles.list}>
          {printers.length === 0 && !isLoading ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No label printers found</Text>
              <Text style={styles.emptyText}>Open Android Bluetooth settings, pair the label printer, then return here and tap Refresh.</Text>
            </View>
          ) : null}

          {printers.map((printer) => {
            const isSelected = printer.address === selectedPrinterAddress;

            return (
            <Pressable
              key={printer.id || printer.address}
              style={[styles.printerRow, isSelected && styles.printerRowSelected]}
              onPress={() => void choosePrinter(printer)}
            >
              <View style={styles.iconBox}>
                <AppIcon name="printer" size={22} color={colors.primaryDark} />
              </View>
              <View style={styles.printerText}>
                <Text style={styles.printerName}>{printer.name || 'Bluetooth Printer'}</Text>
                <Text style={styles.printerAddress}>{printer.address}</Text>
              </View>
              <Text style={[styles.pairedBadge, isSelected && styles.selectedBadge]}>
                {isSelected ? 'Selected' : 'Use'}
              </Text>
            </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingTop: 14,
    paddingBottom: 28,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleBlock: {
    flex: 1,
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 3,
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  refreshButton: {
    borderRadius: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  refreshButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  refreshText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '900',
  },
  errorBox: {
    marginTop: 14,
    borderRadius: 8,
    backgroundColor: colors.danger,
    padding: 12,
  },
  errorTitle: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '900',
  },
  errorText: {
    marginTop: 4,
    color: colors.surface,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  helpBox: {
    marginTop: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 12,
    elevation: 1,
  },
  helpTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  helpText: {
    marginTop: 5,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  list: {
    marginTop: 14,
    gap: 10,
  },
  emptyBox: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  emptyText: {
    marginTop: 5,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  printerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 13,
    elevation: 1,
  },
  printerRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  iconBox: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
  },
  printerText: {
    flex: 1,
  },
  printerName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  printerAddress: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  pairedBadge: {
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    color: colors.primaryDark,
    paddingHorizontal: 9,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '900',
  },
  selectedBadge: {
    backgroundColor: colors.primary,
    color: colors.surface,
  },
});
