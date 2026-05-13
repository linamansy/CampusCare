import { Text } from 'react-native';
import { AppShell } from '../../../src/components/AppShell';
import { Button } from '../../../src/components/Button';
import { Card } from '../../../src/components/Card';
import { useAuth } from '../../../src/state/auth-context';
import { Colors, Fonts, Spacing, TypeScale } from '../../../src/theme';

export default function WorkerProfileScreen() {
  const { user, signOut } = useAuth();

  return (
    <AppShell title="Profile" subtitle="Worker account details and session controls.">
      <Card>
        <Text style={{ fontFamily: Fonts.headline, fontSize: TypeScale.headline, color: Colors.textPrimary }}>{user?.name}</Text>
        <Text style={{ marginTop: Spacing.sm, fontFamily: Fonts.body, fontSize: TypeScale.body, color: Colors.textSecondary }}>{user?.email}</Text>
        <Text style={{ marginTop: Spacing.sm, fontFamily: Fonts.body, fontSize: TypeScale.body, color: Colors.textSecondary }}>Points: {user?.points || 0}</Text>
      </Card>
      <Button title="Logout" variant="outline" onPress={signOut} />
    </AppShell>
  );
}
