import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdminListRow } from '../components/AdminListRow';
import { AppIcon } from '../components/AppIcon';
import { getPairedBluetoothPrinters, type BluetoothPrinterDevice } from '../services/printerService';
import { colors } from '../theme/colors';

type Props = {
  canManageData: boolean;
  syncMessage?: string;
  isSyncing?: boolean;
  onSyncNow: () => void;
  onOpenCategories: () => void;
  onOpenProducts: () => void;
  onOpenOutlets: () => void;
  onOpenOutletProducts: () => void;
  onOpenPrinters: () => void;
  onOpenBackupExport: () => void;
  onOpenProductPage: () => void;
  onOpenHistory: () => void;
  onSignOut: () => void;
};

export function AdminHomeScreen({
  canManageData,
  syncMessage,
  isSyncing,
  onSyncNow,
  onOpenCategories,
  onOpenProducts,
  onOpenOutlets,
  onOpenOutletProducts,
  onOpenPrinters,
  onOpenBackupExport,
  onOpenProductPage,
  onOpenHistory,
  onSignOut,
}: Props) {
  const insets = useSafeAreaInsets();
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
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>Cloud Account</Text>
        <Text style={styles.title}>{canManageData ? 'Manage App Data' : 'Outlet Tools'}</Text>
        <Text style={styles.subtitle}>
          {canManageData
            ? 'Cloud records sync to this device. Printing remains available offline.'
            : 'Outlet users can sync assigned outlet data and manage this device printer.'}
        </Text>
        <View style={styles.actionRow}>
          <Pressable style={[styles.actionButton, isSyncing && styles.actionButtonDisabled]} disabled={isSyncing} onPress={onSyncNow}>
            <Text style={styles.actionText}>{isSyncing ? 'Syncing' : 'Sync Now'}</Text>
          </Pressable>
        </View>
        {syncMessage ? <Text style={styles.syncMessage}>{syncMessage}</Text> : null}
        <View style={styles.list}>
          {canManageData ? (
            <>
              <AdminListRow
                icon="tag"
                title="Product Categories"
                subtitle="Synced from cloud categories"
                onPress={onOpenCategories}
              />
              <AdminListRow
                icon="product"
                title="Products"
                subtitle="Synced product details, shelf life, and images"
                onPress={onOpenProducts}
              />
              <AdminListRow icon="store" title="Outlets" subtitle="Synced outlet records" onPress={onOpenOutlets} />
              <AdminListRow
                icon="list"
                title="Outlet Product Lists"
                subtitle="Cloud availability by outlet"
                onPress={onOpenOutletProducts}
              />
            </>
          ) : null}
          <AdminListRow
            icon="printer"
            title="Printers"
            subtitle={printerNames || 'Select or remove printer while online'}
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
      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable style={styles.navItem} onPress={onOpenProductPage}>
          <AppIcon name="grid" size={19} color={colors.textMuted} />
          <Text style={styles.navItemText}>Products</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={onOpenHistory}>
          <AppIcon name="history" size={19} color={colors.textMuted} />
          <Text style={styles.navItemText}>History</Text>
        </Pressable>
        <Pressable style={[styles.navItem, styles.navItemSelected]}>
          <AppIcon name="admin" size={19} color={colors.primary} />
          <Text style={styles.navItemActive}>Manage</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={onSignOut}>
          <AppIcon name="signOut" size={19} color={colors.textMuted} />
          <Text style={styles.navItemText}>Sign Out</Text>
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
  content: {
    padding: 16,
    paddingTop: 14,
    paddingBottom: 112,
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
  actionRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    borderRadius: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  actionText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '900',
  },
  syncMessage: {
    marginTop: 10,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
  },
  list: {
    marginTop: 16,
    gap: 10,
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  navItem: {
    width: '25%',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingVertical: 7,
  },
  navItemSelected: {
    backgroundColor: colors.primarySoft,
  },
  navItemText: {
    color: colors.textMuted,
    fontWeight: '900',
  },
  navItemActive: {
    color: colors.primary,
    fontWeight: '900',
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
