import { StyleSheet, Text, View } from 'react-native';
import { AppShell } from '../../../src/components/AppShell';
import { Button } from '../../../src/components/Button';
import { Card } from '../../../src/components/Card';
import { useAuth } from '../../../src/state/auth-context';
import { Fonts, Spacing, TypeScale, useTheme } from '../../../src/theme';

export default function MemberProfileScreen() {
  const { user, signOut } = useAuth();
  const { colors, mode, setMode } = useTheme();

  return (
    <AppShell title="Profile" subtitle="Your account, contributions, and settings.">
      {/* User info */}
      <Card style={styles.card}>
        <View style={[styles.avatar, { backgroundColor: colors.primaryContainer }]}>
          <Text style={[styles.avatarText, { color: colors.onPrimary }]}>
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={[styles.name, { color: colors.textPrimary }]}>{user?.name}</Text>
        <Text style={[styles.email, { color: colors.textMuted }]}>{user?.email}</Text>
        <Text style={[styles.role, { color: colors.primary }]}>{user?.role}</Text>
      </Card>

      {/* Stats */}
      <Card style={styles.card}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>CONTRIBUTIONS</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{user?.actsOfServicePoints || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Acts of Service</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.surfaceHigh }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{user?.points || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Points</Text>
          </View>
        </View>
      </Card>

      {/* Appearance */}
      <Card style={styles.card}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>APPEARANCE</Text>
        <View style={styles.themeRow}>
          {(['light', 'dark', 'system'] as const).map((m) => (
            <Button
              key={m}
              title={m.charAt(0).toUpperCase() + m.slice(1)}
              variant={mode === m ? 'primary' : 'ghost'}
              onPress={() => setMode(m)}
              style={styles.themeButton}
            />
          ))}
        </View>
      </Card>

      <Button title="Logout" variant="outline" onPress={signOut} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.md },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontFamily: Fonts.headline,
    fontSize: TypeScale.headline,
  },
  name: {
    fontFamily: Fonts.headline,
    fontSize: TypeScale.headline,
    textAlign: 'center',
  },
  email: {
    marginTop: 4,
    fontFamily: Fonts.body,
    fontSize: TypeScale.bodySmall,
    textAlign: 'center',
  },
  role: {
    marginTop: 4,
    fontFamily: Fonts.label,
    fontSize: TypeScale.label,
    textAlign: 'center',
  },
  sectionLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  statValue: {
    fontFamily: Fonts.headline,
    fontSize: TypeScale.headline,
  },
  statLabel: {
    marginTop: 4,
    fontFamily: Fonts.label,
    fontSize: TypeScale.label,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  themeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  themeButton: {
    flex: 1,
  },
});
