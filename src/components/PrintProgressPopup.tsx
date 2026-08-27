import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { useLanguage } from '../i18n/LanguageContext';
import { AppIcon } from './AppIcon';

export type PrintProgressStatus = 'printing' | 'success' | 'warning' | null;

type Props = {
  status: PrintProgressStatus;
};

export function PrintProgressPopup({ status }: Props) {
  const { t } = useLanguage();
  const isVisible = status !== null;
  const isSuccess = status === 'success';
  const isWarning = status === 'warning';
  const label = status === 'printing'
    ? t('printing')
    : isSuccess
      ? t('printed')
      : t('printFailed');

  return (
    <Modal transparent visible={isVisible} animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View
            style={[
              styles.iconShell,
              isSuccess && styles.successShell,
              isWarning && styles.warningShell,
            ]}
          >
            {status === 'printing' ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <AppIcon
                name={isSuccess ? 'save' : 'warning'}
                size={34}
                color={isSuccess ? colors.primary : colors.warning}
              />
            )}
          </View>
          <Text style={styles.label}>{label}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(24, 33, 29, 0.28)',
    padding: 24,
  },
  panel: {
    minWidth: 152,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 22,
    paddingVertical: 20,
    elevation: 8,
  },
  iconShell: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 29,
    backgroundColor: colors.primarySoft,
  },
  successShell: {
    backgroundColor: colors.primarySoft,
  },
  warningShell: {
    backgroundColor: '#fff3d7',
  },
  label: {
    marginTop: 12,
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
});
