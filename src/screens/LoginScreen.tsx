import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { getCloudApiBaseUrl } from '../services/cloudApi';
import { colors } from '../theme/colors';

type Props = {
  isLoading?: boolean;
  errorMessage?: string;
  onLogin: (email: string, password: string) => Promise<void>;
};

export function LoginScreen({ isLoading = false, errorMessage, onLogin }: Props) {
  const [email, setEmail] = useState('hueying@jrgroup.com.sg');
  const [password, setPassword] = useState('ChangeMe123!');
  const [localError, setLocalError] = useState('');

  const submit = async () => {
    setLocalError('');
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setLocalError('Enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters.');
      return;
    }
    await onLogin(normalizedEmail, password);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>JR Label Cloud</Text>
        <Text style={styles.title}>Shelf Life Label Printing</Text>
        <Text style={styles.subtitle}>
          Sign in to sync product shelf life rules, print labels, and keep outlet print history up to date.
        </Text>
        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            style={styles.input}
            value={email}
            editable={!isLoading}
            onChangeText={setEmail}
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            secureTextEntry
            style={styles.input}
            value={password}
            editable={!isLoading}
            onChangeText={setPassword}
          />
          {localError || errorMessage ? <Text style={styles.error}>{localError || errorMessage}</Text> : null}
          <Pressable style={[styles.button, isLoading && styles.buttonDisabled]} disabled={isLoading} onPress={() => void submit()}>
            <Text style={styles.buttonText}>{isLoading ? 'Signing in...' : 'Sign in'}</Text>
          </Pressable>
        </View>
        <Text style={styles.footer}>API: {getCloudApiBaseUrl()}</Text>
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
  footer: {
    marginTop: 14,
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
});