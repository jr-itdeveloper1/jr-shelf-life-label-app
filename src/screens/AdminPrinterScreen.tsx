import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '../components/AppIcon';
import { StickyBackHeader } from '../components/StickyBackHeader';
import {
  getPairedBluetoothPrinters,
  getPreferredBluetoothPrinter,
  clearPreferredBluetoothPrinter,
  hideBluetoothPrinter,
  setPreferredBluetoothPrinter,
  type BluetoothPrinterDevice,
} from '../services/printerService';
import { removeSyncedPrinter, syncSelectedPrinter, type CloudSession } from '../services/cloudApi';
import type { Outlet } from '../domain/models';
import { colors } from '../theme/colors';

type Props = {
  session: CloudSession;
  outlet: Outlet;
  onBack: () => void;
};

export function AdminPrinterScreen({ session, outlet, onBack }: Props) {
  const [printers, setPrinters] = useState<BluetoothPrinterDevice[]>([]);
  const [selectedPrinterAddress, setSelectedPrinterAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncingPrinter, setIsSyncingPrinter] = useState(false);
  const [isRemoveMode, setIsRemoveMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [warningMessage, setWarningMessage] = useState('');

  const loadPrinters = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setWarningMessage('');

    try {
      const [pairedPrinters, preferredPrinter] = await Promise.all([
        getPairedBluetoothPrinters(),
        getPreferredBluetoothPrinter(),
      ]);
      setPrinters(pairedPrinters);
      setSelectedPrinterAddress(preferredPrinter?.address ?? '');
      setIsRemoveMode(false);
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
    if (isRemoveMode) {
      confirmRemovePrinter(printer);
      return;
    }

    setErrorMessage('');
    setWarningMessage('');
    setIsSyncingPrinter(true);
    try {
      await setPreferredBluetoothPrinter(printer);
      setSelectedPrinterAddress(printer.address);
      setIsRemoveMode(false);

      try {
        await syncSelectedPrinter(session, printer, outlet.id);
      } catch (syncError) {
        const message = syncError instanceof Error ? syncError.message : 'Could not sync selected printer online.';
        setWarningMessage(`Printer selected locally. Online sync failed: ${message}`);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not select printer locally.');
    } finally {
      setIsSyncingPrinter(false);
    }
  };

  const unselectPrinter = async () => {
    setErrorMessage('');
    setWarningMessage('');
    setIsSyncingPrinter(true);
    try {
      await clearPreferredBluetoothPrinter();
      setSelectedPrinterAddress('');

      try {
        await removeSyncedPrinter(session);
      } catch (syncError) {
        const message = syncError instanceof Error ? syncError.message : 'Could not unselect printer online.';
        setWarningMessage(`Printer unselected locally. Online sync failed: ${message}`);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not unselect printer locally.');
    } finally {
      setIsSyncingPrinter(false);
    }
  };

  const confirmRemovePrinter = (printer: BluetoothPrinterDevice) => {
    const printerName = printer.name || 'Bluetooth Printer';

    Alert.alert(
      'Remove Printer',
      `Remove ${printerName} from this app's printer list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            void removePrinterFromList(printer);
          },
        },
      ],
    );
  };

  const removePrinterFromList = async (printer: BluetoothPrinterDevice) => {
    setErrorMessage('');
    setWarningMessage('');
    setIsSyncingPrinter(true);

    try {
      const isSelectedPrinter = printer.address === selectedPrinterAddress;

      if (isSelectedPrinter) {
        await clearPreferredBluetoothPrinter();
        setSelectedPrinterAddress('');

        try {
          await removeSyncedPrinter(session);
        } catch (syncError) {
          const message = syncError instanceof Error ? syncError.message : 'Could not remove selected printer online.';
          setWarningMessage(`Printer removed locally. Online sync failed: ${message}`);
        }
      }

      await hideBluetoothPrinter(printer);
      setPrinters((currentPrinters) =>
        currentPrinters.filter((currentPrinter) => currentPrinter.address !== printer.address),
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not remove printer from the list.');
    } finally {
      setIsSyncingPrinter(false);
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
          <View style={styles.headerActions}>
            <Pressable
              style={[styles.refreshButton, isLoading && styles.refreshButtonDisabled]}
              onPress={() => void loadPrinters()}
              disabled={isLoading}
            >
              <Text style={styles.refreshText}>{isLoading ? 'Loading' : 'Refresh'}</Text>
            </Pressable>
            <Pressable
              style={[
                styles.removeModeButton,
                isRemoveMode && styles.removeModeButtonActive,
                (isLoading || isSyncingPrinter) && styles.removeModeButtonDisabled,
              ]}
              onPress={() => setIsRemoveMode((currentValue) => !currentValue)}
              disabled={isLoading || isSyncingPrinter}
            >
              <Text style={[styles.removeModeText, isRemoveMode && styles.removeModeTextActive]}>
                {isRemoveMode ? 'Cancel' : 'Remove'}
              </Text>
            </Pressable>
          </View>
        </View>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Printer Check Failed</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}
        {warningMessage ? (
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>Printer Saved Locally</Text>
            <Text style={styles.warningText}>{warningMessage}</Text>
          </View>
        ) : null}

        <View style={styles.helpBox}>
          <Text style={styles.helpTitle}>{selectedPrinter ? 'Selected Printer' : 'Before printing'}</Text>
          <Text style={styles.helpText}>
            {selectedPrinter
              ? `${selectedPrinter.name || 'Bluetooth Printer'} is stored locally for offline printing. Online sync is attempted when the API is reachable.`
              : 'Pair the printer in Android Bluetooth settings first. Selecting a printer stores it locally for offline printing.'}
          </Text>
          {selectedPrinter ? (
            <Pressable style={[styles.removeButton, isSyncingPrinter && styles.refreshButtonDisabled]} disabled={isSyncingPrinter} onPress={() => void unselectPrinter()}>
              <Text style={styles.removeText}>{isSyncingPrinter ? 'Syncing' : 'Unselect Printer'}</Text>
            </Pressable>
          ) : null}
        </View>

        {isRemoveMode ? (
          <View style={styles.removeHintBox}>
            <Text style={styles.removeHintText}>Tap a printer below to remove it from this app's list.</Text>
          </View>
        ) : null}

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
              style={[
                styles.printerRow,
                isSelected && styles.printerRowSelected,
                isRemoveMode && styles.printerRowRemoveMode,
              ]}
              onPress={() => void choosePrinter(printer)}
              disabled={isSyncingPrinter}
            >
              <View style={styles.iconBox}>
                <AppIcon name="printer" size={22} color={colors.primaryDark} />
              </View>
              <View style={styles.printerText}>
                <Text style={styles.printerName}>{printer.name || 'Bluetooth Printer'}</Text>
                <Text style={styles.printerAddress}>{printer.address}</Text>
              </View>
              <Text style={[
                styles.pairedBadge,
                isSelected && !isRemoveMode && styles.selectedBadge,
                isRemoveMode && styles.removeBadge,
              ]}>
                {isRemoveMode ? 'Remove' : isSelected ? 'Selected' : isSyncingPrinter ? 'Syncing' : 'Use'}
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
  headerActions: {
    alignItems: 'stretch',
    gap: 8,
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
  removeModeButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  removeModeButtonActive: {
    backgroundColor: colors.danger,
  },
  removeModeButtonDisabled: {
    borderColor: colors.disabled,
  },
  removeModeText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  removeModeTextActive: {
    color: colors.surface,
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
  warningBox: {
    marginTop: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warning,
    backgroundColor: '#fff3d7',
    padding: 12,
  },
  warningTitle: {
    color: colors.warning,
    fontSize: 14,
    fontWeight: '900',
  },
  warningText: {
    marginTop: 4,
    color: colors.text,
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
  removeButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  removeText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '900',
  },
  removeHintBox: {
    marginTop: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  removeHintText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '900',
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
  printerRowRemoveMode: {
    borderColor: colors.danger,
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
  removeBadge: {
    backgroundColor: colors.danger,
    color: colors.surface,
  },
});
