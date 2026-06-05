import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AdminListRow } from '../components/AdminListRow';
import { StickyBackHeader } from '../components/StickyBackHeader';
import { getPairedBluetoothPrinters, type BluetoothPrinterDevice } from '../services/printerService';
import { colors } from '../theme/colors';

type Props = {
  onOpenCategories: () => void;
  onOpenProducts: () => void;
  onOpenOutlets: () => void;
  onOpenOutletProducts: () => void;
  onOpenPrinters: () => void;
  onOpenBackupExport: () => void;
  onBack: () => void;
};

export function AdminHomeScreen({
  onOpenCategories,
  onOpenProducts,
  onOpenOutlets,
  onOpenOutletProducts,
  onOpenPrinters,
  onOpenBackupExport,
  onBack,
}: Props) {
  const [pairedPrinters, setPairedPrinters] = useState<BluetoothPrinterDevice[]>([]);

  useEffect(() => {
    let isMounted = true;

    getPairedBluetoothPrinters()
      .then((printers) => {
        if (isMounted) {
          setPairedPrinters(printers);
        }
      })
      .catch(() => {
        if (isMounted) {
          setPairedPrinters([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const printerNames = getPrinterNames(pairedPrinters);

  return (
    <View style={styles.container}>
      <StickyBackHeader label="< Products" onPress={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>Local Admin</Text>
        <Text style={styles.title}>Manage App Data</Text>
        <Text style={styles.subtitle}>Edit local records used by this device.</Text>
        <View style={styles.list}>
          <AdminListRow
            icon="tag"
            title="Product Categories"
            subtitle="Prefixes, scopes, and custom categories"
            onPress={onOpenCategories}
          />
          <AdminListRow
            icon="product"
            title="Products"
            subtitle="Product details, shelf life, and images"
            onPress={onOpenProducts}
          />
          <AdminListRow icon="store" title="Outlets" subtitle="Outlet records and short codes" onPress={onOpenOutlets} />
          <AdminListRow
            icon="list"
            title="Outlet Product Lists"
            subtitle="Enable products by outlet"
            onPress={onOpenOutletProducts}
          />
          <AdminListRow
            icon="printer"
            title="Printers"
            subtitle={printerNames || 'No label printers found'}
            badge={pairedPrinters.length > 0 ? `${pairedPrinters.length}` : undefined}
            onPress={onOpenPrinters}
          />
          <AdminListRow
            icon="importExport"
            title="Import / Export Data"
            subtitle="Excel import and local JSON backup"
            onPress={onOpenBackupExport}
          />
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
  },
  list: {
    marginTop: 16,
    gap: 10,
  },
});

function getPrinterNames(printers: BluetoothPrinterDevice[]) {
  if (printers.length === 0) {
    return '';
  }

  const names = printers.map((printer) => printer.name || printer.address || 'Bluetooth Printer');
  const visibleNames = names.slice(0, 2).join(', ');
  const extraCount = names.length - 2;

  return extraCount > 0 ? `${visibleNames} +${extraCount} more` : visibleNames;
}
