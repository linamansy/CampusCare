import { StyleSheet, Text } from 'react-native';
import { AppShell } from '../../../src/components/AppShell';
import { Button } from '../../../src/components/Button';
import { Card } from '../../../src/components/Card';
import { InfoBanner } from '../../../src/components/InfoBanner';
import { useAuth } from '../../../src/state/auth-context';
import { Colors, Fonts, Spacing, TypeScale } from '../../../src/theme';

export default function MemberProfileScreen() {
  const { user, signOut } = useAuth();

  return (
    <AppShell title="Profile" subtitle="Your account, contributions, and logout controls.">
      <Card>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.meta}>{user?.email}</Text>
        <Text style={styles.meta}>Role: {user?.role}</Text>
        <Text style={styles.meta}>Acts of Service: {user?.actsOfServicePoints || 0}</Text>
        <Text style={styles.meta}>Worker Points: {user?.points || 0}</Text>
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
    color: Colors.textPrimary,
  },
  meta: {
    marginTop: Spacing.sm,
    fontFamily: Fonts.body,
    fontSize: TypeScale.body,
    color: Colors.textSecondary,
  },
});
