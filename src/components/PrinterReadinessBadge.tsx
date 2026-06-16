import { useEffect, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';

import { checkPreferredBluetoothPrinterReadiness } from '../services/printerService';
import { colors } from '../theme/colors';

type PrinterReadinessStatus = 'checking' | 'ready' | 'missing' | 'offline' | 'error';

type PrinterReadinessState = {
  status: PrinterReadinessStatus;
  label: string;
};

const initialState: PrinterReadinessState = {
  status: 'checking',
  label: 'Checking',
};

export function PrinterReadinessBadge() {
  const [readiness, setReadiness] = useState<PrinterReadinessState>(initialState);

  const refreshReadiness = async () => {
    setReadiness((currentReadiness) => ({
      ...currentReadiness,
      status: 'checking',
      label: currentReadiness.status === 'missing' ? 'No printer' : 'Checking',
    }));

    try {
      const result = await checkPreferredBluetoothPrinterReadiness();

      if (result.status === 'missing') {
        setReadiness({
          status: 'missing',
          label: 'No printer',
        });
        return;
      }

      if (result.status === 'offline') {
        setReadiness({
          status: 'offline',
          label: 'Printer offline',
        });
        return;
      }

      setReadiness({
        status: 'ready',
        label: 'Printer ready',
      });
    } catch (error) {
      setReadiness({
        status: 'error',
        label: 'Check printer',
      });
    }
  };

  useEffect(() => {
    void refreshReadiness();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refreshReadiness();
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <Pressable
      style={[styles.badge, styles[`badge_${readiness.status}`]]}
      onPress={() => void refreshReadiness()}
      hitSlop={8}
    >
      <View style={[styles.dot, styles[`dot_${readiness.status}`]]} />
      <Text style={[styles.label, styles[`label_${readiness.status}`]]} numberOfLines={1}>
        {readiness.label}
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
