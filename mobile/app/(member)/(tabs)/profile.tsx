import { StyleSheet, Text, View } from 'react-native';
import { AppShell } from '../../../src/components/AppShell';
import { Button } from '../../../src/components/Button';
import { Card } from '../../../src/components/Card';
import { InfoBanner } from '../../../src/components/InfoBanner';
import { useAuth } from '../../../src/state/auth-context';
import { Fonts, Spacing, TypeScale, useTheme } from '../../../src/theme';

export default function MemberProfileScreen() {
  const { user, signOut } = useAuth();
  const { colors, mode, setMode } = useTheme();

  return (
    <AppShell title="Profile" subtitle="Your account, contributions, and logout controls.">
      <Card>
        <Text style={[styles.name, { color: colors.textPrimary }]}>{user?.name}</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>{user?.email}</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>Role: {user?.role}</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>Acts of Service: {user?.actsOfServicePoints || 0}</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>Worker Points: {user?.points || 0}</Text>
      </Card>
      <Card>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>APPEARANCE</Text>
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
      <InfoBanner
        title="Gamification"
        message="The backend currently awards points and service contributions. A leaderboard endpoint is not available yet, so standings are limited to your own profile stats."
      />
      <Button title="Logout" variant="outline" onPress={signOut} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  name: {
    fontFamily: Fonts.headline,
    fontSize: TypeScale.headline,
  },
  meta: {
    marginTop: Spacing.sm,
    fontFamily: Fonts.body,
    fontSize: TypeScale.body,
  },
  sectionLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  themeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  themeButton: {
    flex: 1,
  },
});
