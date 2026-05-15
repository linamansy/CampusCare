import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Input } from '../../src/components/Input';
import { Screen } from '../../src/components/Screen';
import { useAuth } from '../../src/state/auth-context';
import { Fonts, Spacing, TypeScale, useTheme } from '../../src/theme';

type SelectableRole = 'Community Member' | 'Worker';

const ROLES: { value: SelectableRole; label: string; description: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  {
    value: 'Community Member',
    label: 'Community Member',
    description: 'Report issues and track progress',
    icon: 'person-circle-outline',
  },
  {
    value: 'Worker',
    label: 'Facility Worker',
    description: 'Receive tasks and resolve issues',
    icon: 'construct-outline',
  },
];

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<SelectableRole>('Community Member');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      await register(name, email, password, role);
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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.hero}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Use your university email to join CampusCare
            </Text>
          </View>
          <Card style={styles.card}>
            <Input label="Full Name" value={name} onChangeText={setName} />
            <Input
              label="University Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry />

            <Text style={[styles.roleLabel, { color: colors.textSecondary }]}>I am a...</Text>
            <View style={styles.roleGrid}>
              {ROLES.map((r) => {
                const selected = role === r.value;
                return (
                  <Pressable
                    key={r.value}
                    onPress={() => setRole(r.value)}
                    style={[
                      styles.roleCard,
                      {
                        borderColor: selected ? colors.primary : colors.surfaceHigh,
                        backgroundColor: selected ? colors.primaryContainer : colors.surfaceLowest,
                      },
                    ]}
                  >
                    <View style={[styles.roleIcon, { backgroundColor: selected ? colors.primary : colors.surfaceHigh }]}>
                      <Ionicons name={r.icon} size={22} color={selected ? '#fff' : colors.textSecondary} />
                    </View>
                    <Text style={[styles.roleCardLabel, { color: selected ? colors.primary : colors.textPrimary }]}>
                      {r.label}
                    </Text>
                    <Text style={[styles.roleCardDesc, { color: colors.textMuted }]}>{r.description}</Text>
                    {selected ? (
                      <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
                        <Ionicons name="checkmark" size={12} color="#fff" />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
            <Button
              title={submitting ? 'Creating Account...' : 'Register'}
              onPress={handleSubmit}
              disabled={submitting}
            />
            <Link href="/(auth)/login" style={[styles.link, { color: colors.primary }]}>
              Already have an account? Sign in
            </Link>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {},
  container: { flex: 1 },
  scroll: { padding: Spacing.marginMobile, paddingBottom: Spacing.xl * 2 },
  hero: { marginBottom: Spacing.xl, marginTop: Spacing.xl },
  title: { fontFamily: Fonts.headline, fontSize: TypeScale.headline },
  subtitle: { marginTop: Spacing.xs, fontFamily: Fonts.body, fontSize: TypeScale.bodySmall },
  card: { padding: Spacing.lg, gap: Spacing.md },
  roleLabel: { fontFamily: Fonts.title, fontSize: TypeScale.body, marginTop: Spacing.sm },
  roleGrid: { flexDirection: 'row', gap: Spacing.md },
  roleCard: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 16,
    padding: Spacing.md,
    gap: 6,
    position: 'relative',
  },
  roleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  roleCardLabel: { fontFamily: Fonts.title, fontSize: TypeScale.bodySmall },
  roleCardDesc: { fontFamily: Fonts.body, fontSize: 11 },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: { fontFamily: Fonts.label, fontSize: TypeScale.label },
  link: {
    marginTop: Spacing.sm,
    fontFamily: Fonts.labelBold,
    fontSize: TypeScale.bodySmall,
    textAlign: 'center',
  },
});
