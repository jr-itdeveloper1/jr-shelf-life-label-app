import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  type PrinterReadinessState,
  usePrinterReadiness,
} from '../hooks/usePrinterReadiness';
import { colors } from '../theme/colors';
import { useLanguage } from '../i18n/LanguageContext';

type Props = {
  readiness?: PrinterReadinessState;
  onRefresh?: () => void | Promise<void>;
};

export function PrinterReadinessBadge({ readiness: providedReadiness, onRefresh }: Props) {
  const { t } = useLanguage();
  const internalReadiness = usePrinterReadiness(!providedReadiness);
  const readiness = providedReadiness ?? internalReadiness.readiness;
  const refreshReadiness = onRefresh ?? internalReadiness.refreshReadiness;

  return (
    <Pressable
      style={[styles.badge, styles[`badge_${readiness.status}`]]}
      onPress={refreshReadiness}
      hitSlop={8}
    >
      <View style={[styles.dot, styles[`dot_${readiness.status}`]]} />
      <Text style={[styles.label, styles[`label_${readiness.status}`]]} numberOfLines={1}>
        {t(readiness.status === 'checking' ? 'checking' : readiness.status === 'ready' ? 'printerReady' : readiness.status === 'missing' ? 'noPrinter' : readiness.status === 'offline' ? 'printerOffline' : 'checkPrinter')}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 118,
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  badge_checking: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  badge_ready: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  badge_missing: {
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  badge_offline: {
    borderColor: colors.warning,
    backgroundColor: '#fff3d7',
  },
  badge_error: {
    borderColor: colors.danger,
    backgroundColor: '#fee2e2',
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  dot_checking: {
    backgroundColor: colors.textSoft,
  },
  dot_ready: {
    backgroundColor: colors.primary,
  },
  dot_missing: {
    backgroundColor: colors.textSoft,
  },
  dot_offline: {
    backgroundColor: colors.warning,
  },
  dot_error: {
    backgroundColor: colors.danger,
  },
  label: {
    flexShrink: 1,
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  label_checking: {
    color: colors.textMuted,
  },
  label_ready: {
    color: colors.primaryDark,
  },
  label_missing: {
    color: colors.textMuted,
  },
  label_offline: {
    color: colors.warning,
  },
  label_error: {
    color: colors.danger,
  },
});

