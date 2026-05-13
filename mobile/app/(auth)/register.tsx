import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Input } from '../../src/components/Input';
import { Screen } from '../../src/components/Screen';
import { useAuth } from '../../src/state/auth-context';
import { Colors, Fonts, Spacing, TypeScale } from '../../src/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      await register(name, email, password);
      router.replace('/(auth)/login');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.title}>Register</Text>
          <Text style={styles.subtitle}>Use your university email to create a CampusCare account</Text>
        </View>
        <Card style={styles.card}>
          <Input label="Full Name" value={name} onChangeText={setName} />
          <Input label="University Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title={submitting ? 'Creating Account...' : 'Register'} onPress={handleSubmit} disabled={submitting} />
          <Link href="/(auth)/login" style={styles.link}>
            Back to login
          </Link>
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
  },
  title: {
    fontFamily: Fonts.headline,
    fontSize: TypeScale.headline,
    color: Colors.textPrimary,
  },
  subtitle: {
    marginTop: Spacing.xs,
    fontFamily: Fonts.body,
    fontSize: TypeScale.bodySmall,
    color: Colors.textSecondary,
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
  link: {
    marginTop: Spacing.md,
    color: Colors.primary,
    fontFamily: Fonts.labelBold,
    fontSize: TypeScale.bodySmall,
    textAlign: 'center',
  },
});
