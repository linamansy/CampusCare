import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Input } from '../../src/components/Input';
import { Screen } from '../../src/components/Screen';
import { useAuth } from '../../src/state/auth-context';
import { Fonts, Spacing, TypeScale, useTheme } from '../../src/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { forgotPassword } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const token = await forgotPassword(email);
      setResetToken(token);
      if (token) {
        router.push({ pathname: '/(auth)/reset-password', params: { token } });
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not generate reset token');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen style={styles.screen}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Forgot Password?</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Enter your university email to generate a reset token.</Text>
      <Card style={styles.card}>
        <Input label="University Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
        {resetToken ? <Text style={[styles.token, { color: colors.secondary }]}>Reset token: {resetToken}</Text> : null}
        <Button title={submitting ? 'Sending...' : 'Send Reset Link'} onPress={handleSubmit} disabled={submitting} />
        <Link href="/(auth)/login" style={[styles.link, { color: colors.primary }]}>
          Back to login
        </Link>
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
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: TypeScale.bodySmall,
    marginBottom: Spacing.lg,
  },
  card: {
    padding: Spacing.lg,
  },
  error: {
    marginBottom: Spacing.md,
    fontFamily: Fonts.label,
    fontSize: TypeScale.label,
  },
  token: {
    marginBottom: Spacing.md,
    fontFamily: Fonts.labelBold,
    fontSize: TypeScale.bodySmall,
  },
  link: {
    marginTop: Spacing.md,
    fontFamily: Fonts.labelBold,
    fontSize: TypeScale.bodySmall,
    textAlign: 'center',
  },
});
