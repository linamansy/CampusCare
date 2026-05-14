import { StyleSheet, Text, View } from 'react-native';
import { AppShell } from '../../../src/components/AppShell';
import { Button } from '../../../src/components/Button';
import { Card } from '../../../src/components/Card';
import { useAuth } from '../../../src/state/auth-context';
import { Fonts, Spacing, TypeScale, useTheme } from '../../../src/theme';

export default function ManagerProfileScreen() {
  const { user, signOut } = useAuth();
  const { colors, mode, setMode } = useTheme();

  return (
    <AppShell title="Profile" subtitle="Facility manager account controls.">
      <Card>
        <Text style={{ fontFamily: Fonts.headline, fontSize: TypeScale.headline, color: colors.textPrimary }}>{user?.name}</Text>
        <Text style={{ marginTop: Spacing.sm, fontFamily: Fonts.body, fontSize: TypeScale.body, color: colors.textSecondary }}>{user?.email}</Text>
        <Text style={{ marginTop: Spacing.sm, fontFamily: Fonts.body, fontSize: TypeScale.body, color: colors.textSecondary }}>Role: {user?.role}</Text>
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
      <Button title="Logout" variant="outline" onPress={signOut} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
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
