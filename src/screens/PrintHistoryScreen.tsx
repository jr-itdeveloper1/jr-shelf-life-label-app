import { memo, useCallback, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ListRenderItemInfo, StyleProp, TextStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '../components/AppIcon';
import type { PrintJob } from '../domain/models';
import { formatLabelDate } from '../domain/shelfLife';
import { colors } from '../theme/colors';

type Props = {
  printJobs: PrintJob[];
  onOpenProducts: () => void;
  onOpenAdmin: () => void;
  onSignOut: () => void;
};

export function PrintHistoryScreen({ printJobs, onOpenProducts, onOpenAdmin, onSignOut }: Props) {
  const insets = useSafeAreaInsets();
  const sortedPrintJobs = useMemo(
    () =>
      [...printJobs].sort(
        (firstJob, secondJob) =>
          new Date(secondJob.printedAt).getTime() - new Date(firstJob.printedAt).getTime(),
      ),
    [printJobs],
  );
  const totalLabels = useMemo(
    () => printJobs.reduce((total, printJob) => total + printJob.quantity, 0),
    [printJobs],
  );
  const pendingSyncCount = useMemo(
    () => printJobs.filter((printJob) => getPrintJobSyncStatus(printJob) !== 'synced').length,
    [printJobs],
  );
  const failedSyncCount = useMemo(
    () => printJobs.filter((printJob) => getPrintJobSyncStatus(printJob) === 'failed').length,
    [printJobs],
  );
  const syncSummary = failedSyncCount > 0
    ? `${failedSyncCount} sync failed`
    : pendingSyncCount > 0
      ? `${pendingSyncCount} pending sync`
      : 'All synced';
  const listHeader = useMemo(
    () => (
      <View style={styles.titleBlock}>
        <Text style={styles.title}>Print History</Text>
        <Text style={styles.subtitle}>
          {printJobs.length} jobs | {totalLabels} labels | {syncSummary}
        </Text>
      </View>
    ),
    [printJobs.length, syncSummary, totalLabels],
  );
  const listEmpty = useMemo(
    () => (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No prints yet</Text>
        <Text style={styles.emptyText}>Printed labels will appear here with time and quantity.</Text>
      </View>
    ),
    [],
  );
  const keyExtractor = useCallback((printJob: PrintJob) => printJob.id, []);
  const renderPrintJob = useCallback(
    ({ item }: ListRenderItemInfo<PrintJob>) => <PrintHistoryRow printJob={item} />,
    [],
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedPrintJobs}
        keyExtractor={keyExtractor}
        renderItem={renderPrintJob}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={styles.content}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        removeClippedSubviews
        showsVerticalScrollIndicator={false}
        updateCellsBatchingPeriod={40}
        windowSize={7}
      />
      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable style={styles.navItem} onPress={onOpenProducts}>
          <AppIcon name="grid" size={19} color={colors.textMuted} />
          <Text style={styles.navItemText}>Products</Text>
        </Pressable>
        <Pressable style={[styles.navItem, styles.navItemSelected]}>
          <AppIcon name="history" size={19} color={colors.primary} />
          <Text style={styles.navItemActive}>History</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={onOpenAdmin}>
          <AppIcon name="admin" size={19} color={colors.textMuted} />
          <Text style={styles.navItemText}>Manage</Text>
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
    gap: 10,
    padding: 16,
    paddingTop: 12,
    paddingBottom: 112,
  },
  titleBlock: {
    marginBottom: 2,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  emptyState: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  emptyText: {
    marginTop: 6,
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  row: {
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 12,
    elevation: 1,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  productText: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  nameZh: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '800',
  },
  quantity: {
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    color: colors.primaryDark,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 13,
    fontWeight: '900',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  value: {
    flex: 1,
    color: colors.text,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '900',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    paddingTop: 3,
  },
  code: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '900',
  },
  outlet: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  status: {
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: colors.surfaceMuted,
    color: colors.textMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 11,
    fontWeight: '900',
  },
  syncStatus: {
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 11,
    fontWeight: '900',
  },
  syncStatus_pending: {
    backgroundColor: colors.surfaceMuted,
    color: colors.textMuted,
  },
  syncStatus_syncing: {
    backgroundColor: colors.primarySoft,
    color: colors.primaryDark,
  },
  syncStatus_synced: {
    backgroundColor: colors.primarySoft,
    color: colors.primaryDark,
  },
  syncStatus_failed: {
    backgroundColor: colors.danger,
    color: colors.surface,
  },
  syncDetail: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
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

type PrintHistoryRowProps = {
  printJob: PrintJob;
};

const PrintHistoryRow = memo(function PrintHistoryRow({ printJob }: PrintHistoryRowProps) {
  const syncStatus = getPrintJobSyncStatus(printJob);
  const syncStatusMeta = getPrintJobSyncStatusMeta(printJob);

  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <View style={styles.productText}>
          <Text style={styles.name}>{printJob.productNameEn}</Text>
          <Text style={styles.nameZh}>{printJob.productNameZh}</Text>
        </View>
        <Text style={styles.quantity}>Qty {printJob.quantity}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.label}>Printed</Text>
        <Text style={styles.value}>{formatLabelDate(new Date(printJob.printedAt))}</Text>
      </View>
      {printJob.labelType === 'timestamp' ? null : (
        <View style={styles.detailRow}>
          <Text style={styles.label}>Use By</Text>
          <Text style={styles.value}>{formatLabelDate(new Date(getPrintJobExpiryTime(printJob)))}</Text>
        </View>
      )}
      <View style={styles.metaRow}>
        <Text style={styles.code}>{printJob.productCode}</Text>
        <Text style={styles.outlet}>{printJob.outletName}</Text>
        {printJob.printerName ? <Text style={styles.outlet}>{printJob.printerName}</Text> : null}
        <Text style={styles.status}>{printJob.status === 'printed' ? 'Printed' : 'Saved'}</Text>
        <Text style={[styles.syncStatus, getPrintJobSyncStatusStyle(syncStatus)]}>{syncStatusMeta.label}</Text>
      </View>
      {syncStatusMeta.detail ? <Text style={styles.syncDetail}>{syncStatusMeta.detail}</Text> : null}
    </View>
  );
});

function getPrintJobExpiryTime(printJob: PrintJob) {
  const legacyPrintJob = printJob as PrintJob & { bestConsumeByAt?: string };
  return printJob.expiresAt ?? legacyPrintJob.bestConsumeByAt ?? printJob.printedAt;
}

function getPrintJobSyncStatus(printJob: PrintJob) {
  return printJob.syncStatus ?? 'pending';
}

function getPrintJobSyncStatusStyle(syncStatus: ReturnType<typeof getPrintJobSyncStatus>): StyleProp<TextStyle> {
  if (syncStatus === 'synced') {
    return styles.syncStatus_synced;
  }

  if (syncStatus === 'syncing') {
    return styles.syncStatus_syncing;
  }

  if (syncStatus === 'failed') {
    return styles.syncStatus_failed;
  }

  return styles.syncStatus_pending;
}

function getPrintJobSyncStatusMeta(printJob: PrintJob) {
  const syncStatus = getPrintJobSyncStatus(printJob);

  if (syncStatus === 'synced') {
    return {
      label: 'Synced',
      detail: printJob.syncedAt ? `Synced ${formatLabelDate(new Date(printJob.syncedAt))}` : '',
    };
  }

  if (syncStatus === 'syncing') {
    return { label: 'Syncing', detail: '' };
  }

  if (syncStatus === 'failed') {
    return { label: 'Sync Failed', detail: printJob.syncError ?? 'Will retry on next sync.' };
  }

  return { label: 'Pending Sync', detail: '' };
}
