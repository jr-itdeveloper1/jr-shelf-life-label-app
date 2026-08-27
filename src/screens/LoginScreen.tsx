import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { getCloudApiBaseUrl } from '../services/cloudApi';
import { colors } from '../theme/colors';
import { LanguageToggle } from '../components/LanguageToggle';
import { useLanguage } from '../i18n/LanguageContext';

const privacyPolicyUrl = 'https://labelprinter.jrgroup.com.sg/privacy-policy';

type Props = {
  isLoading?: boolean;
  errorMessage?: string;
  onLogin: (email: string, password: string) => Promise<void>;
};

export function LoginScreen({ isLoading = false, errorMessage, onLogin }: Props) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('hueying@jrgroup.com.sg');
  const [password, setPassword] = useState('ChangeMe123!');
  const [localError, setLocalError] = useState('');

  const submit = async () => {
    setLocalError('');
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setLocalError(t('invalidEmail'));
      return;
    }
    if (password.length < 8) {
      setLocalError(t('passwordTooShort'));
      return;
    }
    await onLogin(normalizedEmail, password);
  };

  return (
    <View style={styles.container}>
      <View style={styles.languageRow}><LanguageToggle /></View>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>{t('jrLabelCloud')}</Text>
        <Text style={styles.title}>{t('shelfLifeLabelPrinting')}</Text>
        <Text style={styles.subtitle}>{t('loginSubtitle')}</Text>
        <View style={styles.form}>
          <Text style={styles.label}>{t('email')}</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            style={styles.input}
            value={email}
            editable={!isLoading}
            onChangeText={setEmail}
          />
          <Text style={styles.label}>{t('password')}</Text>
          <TextInput
            secureTextEntry
            style={styles.input}
            value={password}
            editable={!isLoading}
            onChangeText={setPassword}
          />
          {localError || errorMessage ? <Text style={styles.error}>{localError || errorMessage}</Text> : null}
          <Pressable style={[styles.button, isLoading && styles.buttonDisabled]} disabled={isLoading} onPress={() => void submit()}>
            <Text style={styles.buttonText}>{isLoading ? t('signingIn') : t('signIn')}</Text>
          </Pressable>
        </View>
        <Pressable
          style={styles.privacyLink}
          onPress={() => void Linking.openURL(privacyPolicyUrl)}
          accessibilityRole="link"
        >
          <Text style={styles.privacyLinkText}>{t('privacyPolicy')}</Text>
        </Pressable>
        <Text style={styles.footer}>{t('apiLabel', { url: getCloudApiBaseUrl() })}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 18,
  },
  languageRow: { position: 'absolute', top: 48, right: 18, zIndex: 2 },
  card: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 18,
    elevation: 2,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 8,
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  form: {
    marginTop: 18,
    gap: 8,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '700',
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  button: {
    marginTop: 6,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.primary,
    paddingVertical: 13,
  },
  buttonDisabled: {
    backgroundColor: colors.disabled,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '900',
  },
  privacyLink: {
    marginTop: 14,
    alignSelf: 'flex-start',
  },
  privacyLinkText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
  footer: {
    marginTop: 14,
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
});
