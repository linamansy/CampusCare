import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Input } from '../../src/components/Input';
import { Screen } from '../../src/components/Screen';
import { useAuth } from '../../src/state/auth-context';
import { Fonts, Spacing, TypeScale, useTheme } from '../../src/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      await signIn(email, password);
      router.replace('/');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <View style={styles.hero}>
          <View style={[styles.brand, { backgroundColor: colors.primaryContainer }]}>
            <Text style={[styles.brandMark, { color: colors.onPrimary }]}>CampusCare</Text>
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Sign In</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Access your campus facilities dashboard</Text>
        </View>
        <Card style={styles.card}>
          <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry />
          {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
          <Button title={submitting ? 'Signing In...' : 'Login'} onPress={handleSubmit} disabled={submitting} />
          <View style={styles.links}>
            <Link href="/(auth)/forgot-password" style={[styles.link, { color: colors.primary }]}>
              Forgot password?
            </Link>
            <Link href="/(auth)/register" style={[styles.link, { color: colors.primary }]}>
              Create account
            </Link>
          </View>
        </Card>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  hero: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  brand: {
    width: 96,
    height: 96,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  brandMark: {
    fontFamily: Fonts.display,
    fontSize: 18,
  },
  title: {
    fontFamily: Fonts.headline,
    fontSize: TypeScale.headline,
  },
  subtitle: {
    marginTop: Spacing.xs,
    fontFamily: Fonts.body,
    fontSize: TypeScale.bodySmall,
  },
  card: {
    padding: Spacing.lg,
  },
  error: {
    marginBottom: Spacing.md,
    fontFamily: Fonts.label,
    fontSize: TypeScale.label,
  },
  links: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  link: {
    fontFamily: Fonts.labelBold,
    fontSize: TypeScale.bodySmall,
    textAlign: 'center',
  },
});
