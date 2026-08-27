import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdminListRow } from '../components/AdminListRow';
import { AppIcon } from '../components/AppIcon';
import { LanguageToggle } from '../components/LanguageToggle';
import { useLanguage } from '../i18n/LanguageContext';
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
  const { t } = useLanguage();
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
        <View style={styles.titleRow}><View><Text style={styles.eyebrow}>{t('cloudAccount')}</Text><Text style={styles.title}>{canManageData ? t('manageAppData') : t('outletTools')}</Text></View><LanguageToggle /></View>
        <Text style={styles.subtitle}>
          {canManageData
            ? t('adminCompanySubtitle')
            : t('adminOutletSubtitle')}
        </Text>
        <View style={styles.actionRow}>
          <Pressable style={[styles.actionButton, isSyncing && styles.actionButtonDisabled]} disabled={isSyncing} onPress={onSyncNow}>
            <Text style={styles.actionText}>{isSyncing ? t('syncing') : t('syncNow')}</Text>
          </Pressable>
        </View>
        {syncMessage ? <Text style={styles.syncMessage}>{syncMessage}</Text> : null}
        <View style={styles.list}>
          {canManageData ? (
            <>
              <AdminListRow
                icon="tag"
                title={t('productCategories')}
                subtitle={t('categoriesCloudSubtitle')}
                onPress={onOpenCategories}
              />
              <AdminListRow
                icon="product"
                title={t('products')}
                subtitle={t('productsCloudSubtitle')}
                onPress={onOpenProducts}
              />
              <AdminListRow icon="store" title={t('outlets')} subtitle={t('outletsCloudSubtitle')} onPress={onOpenOutlets} />
              <AdminListRow
                icon="list"
                title={t('outletProductLists')}
                subtitle={t('availabilityCloudSubtitle')}
                onPress={onOpenOutletProducts}
              />
            </>
          ) : null}
          <AdminListRow
            icon="printer"
            title={t('printers')}
            subtitle={printerNames || t('printerSelectOnline')}
            badge={pairedPrinters.length > 0 ? `${pairedPrinters.length}` : undefined}
            onPress={onOpenPrinters}
          />
          <AdminListRow
            icon="importExport"
            title={t('importExportData')}
            subtitle={t('backupSubtitle')}
            onPress={onOpenBackupExport}
          />
        </View>
      </ScrollView>
      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable style={styles.navItem} onPress={onOpenProductPage}>
          <AppIcon name="grid" size={19} color={colors.textMuted} />
          <Text style={styles.navItemText}>{t('products')}</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={onOpenHistory}>
          <AppIcon name="history" size={19} color={colors.textMuted} />
          <Text style={styles.navItemText}>{t('history')}</Text>
        </Pressable>
        <Pressable style={[styles.navItem, styles.navItemSelected]}>
          <AppIcon name="admin" size={19} color={colors.primary} />
          <Text style={styles.navItemActive}>{t('manage')}</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={onSignOut}>
          <AppIcon name="signOut" size={19} color={colors.textMuted} />
          <Text style={styles.navItemText}>{t('signOut')}</Text>
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
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
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
