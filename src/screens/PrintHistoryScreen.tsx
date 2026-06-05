import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { StickyBackHeader } from '../components/StickyBackHeader';
import type { PrintJob } from '../domain/models';
import { formatLabelDate } from '../domain/shelfLife';
import { colors } from '../theme/colors';

type Props = {
  printJobs: PrintJob[];
  onBack: () => void;
};

export function PrintHistoryScreen({ printJobs, onBack }: Props) {
  const sortedPrintJobs = [...printJobs].sort(
    (firstJob, secondJob) =>
      new Date(secondJob.printedAt).getTime() - new Date(firstJob.printedAt).getTime(),
  );
  const totalLabels = printJobs.reduce((total, printJob) => total + printJob.quantity, 0);

  return (
    <View style={styles.container}>
      <StickyBackHeader label="< Products" onPress={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Print History</Text>
          <Text style={styles.subtitle}>
            {printJobs.length} jobs | {totalLabels} labels
          </Text>
        </View>
        {sortedPrintJobs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No prints yet</Text>
            <Text style={styles.emptyText}>Printed labels will appear here with time and quantity.</Text>
          </View>
        ) : (
          sortedPrintJobs.map((printJob) => (
            <View key={printJob.id} style={styles.row}>
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
              </View>
            </View>
          ))
        )}
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
    gap: 10,
    padding: 16,
    paddingTop: 12,
    paddingBottom: 28,
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
});

function getPrintJobExpiryTime(printJob: PrintJob) {
  const legacyPrintJob = printJob as PrintJob & { bestConsumeByAt?: string };
  return printJob.expiresAt ?? legacyPrintJob.bestConsumeByAt ?? printJob.printedAt;
}
