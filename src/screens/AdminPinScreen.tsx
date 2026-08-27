import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { LanguageToggle } from '../components/LanguageToggle';
import { useLanguage } from '../i18n/LanguageContext';

type Props = {
  pin: string;
  onChangePin: (pin: string) => void;
  onSuccess: () => void;
  onCancel: () => void;
};

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
const DEMO_PIN = '1234';

export function AdminPinScreen({ pin, onChangePin, onSuccess, onCancel }: Props) {
  const { t } = useLanguage();
  const appendDigit = (digit: string) => {
    const nextPin = `${pin}${digit}`.slice(0, 4);
    onChangePin(nextPin);
    if (nextPin === DEMO_PIN) {
      onSuccess();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}><Pressable onPress={onCancel}><Text style={styles.back}>{`‹ ${t('products')}`}</Text></Pressable><LanguageToggle /></View>
      <View style={styles.header}>
        <Text style={styles.title}>{t('adminAccess')}</Text>
        <Text style={styles.subtitle}>{t('enterAdminPin')}</Text>
      </View>
      <View style={styles.pinBox}>
        <Text style={styles.pinText}>{pin.padEnd(4, '_').replace(/\d/g, '*')}</Text>
        <Text style={styles.hint}>{t('demoPin')}</Text>
      </View>
      <View style={styles.keypad}>
        {keys.map((key) => (
          <Pressable key={key} style={styles.key} onPress={() => appendDigit(key)}>
            <Text style={styles.keyText}>{key}</Text>
          </Pressable>
        ))}
        <Pressable style={styles.keyWide} onPress={() => onChangePin('')}>
          <Text style={styles.keyText}>{t('clear')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
    paddingTop: 56,
  },
  back: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  header: {
    marginTop: 28,
    marginBottom: 24,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '700',
  },
  pinBox: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 24,
  },
  pinText: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 8,
  },
  hint: {
    marginTop: 10,
    color: colors.textMuted,
    fontSize: 13,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginTop: 24,
  },
  key: {
    width: '30%',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 17,
  },
  keyWide: {
    width: '63%',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 17,
  },
  keyText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
});
