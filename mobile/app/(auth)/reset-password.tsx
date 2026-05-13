import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Input } from '../../src/components/Input';
import { Screen } from '../../src/components/Screen';
import { useAuth } from '../../src/state/auth-context';
import { Colors, Fonts, Spacing, TypeScale } from '../../src/theme';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const { resetPassword } = useAuth();
  const [token, setToken] = useState(params.token || '');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      setMessage(null);
      await resetPassword(token, password);
      setMessage('Password reset successful. You can now sign in.');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Password reset failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen style={styles.screen}>
      <Text style={styles.title}>Set New Password</Text>
      <Text style={styles.subtitle}>Use the reset token provided by the backend and choose a new password.</Text>
      <Card style={styles.card}>
        <Input label="Reset Token" value={token} onChangeText={setToken} autoCapitalize="none" />
        <Input label="New Password" value={password} onChangeText={setPassword} secureTextEntry />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {message ? <Text style={styles.success}>{message}</Text> : null}
        <Button title={submitting ? 'Resetting...' : 'Reset Password'} onPress={handleSubmit} disabled={submitting} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'center',
  },
  title: {
    fontFamily: Fonts.headline,
    fontSize: TypeScale.headline,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: TypeScale.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  card: {
    padding: Spacing.lg,
  },
  error: {
    marginBottom: Spacing.md,
    color: Colors.error,
    fontFamily: Fonts.label,
    fontSize: TypeScale.label,
  },
  success: {
    marginBottom: Spacing.md,
    color: Colors.secondary,
    fontFamily: Fonts.labelBold,
    fontSize: TypeScale.bodySmall,
  },
});
