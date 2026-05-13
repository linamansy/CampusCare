import { Text } from 'react-native';
import { AppShell } from '../../../src/components/AppShell';
import { Button } from '../../../src/components/Button';
import { Card } from '../../../src/components/Card';
import { InfoBanner } from '../../../src/components/InfoBanner';
import { useAuth } from '../../../src/state/auth-context';
import { Colors, Fonts, Spacing, TypeScale } from '../../../src/theme';

export default function AdminProfileScreen() {
  const { user, signOut } = useAuth();

  return (
    <AppShell title="Profile" subtitle="Administrative controls and known backend gaps.">
      <Card>
        <Text style={{ fontFamily: Fonts.headline, fontSize: TypeScale.headline, color: Colors.textPrimary }}>{user?.name}</Text>
        <Text style={{ marginTop: Spacing.sm, fontFamily: Fonts.body, fontSize: TypeScale.body, color: Colors.textSecondary }}>{user?.email}</Text>
        <Text style={{ marginTop: Spacing.sm, fontFamily: Fonts.body, fontSize: TypeScale.body, color: Colors.textSecondary }}>Role: {user?.role}</Text>
      </Card>
      <InfoBanner
        title="Category management"
        message="The backend currently has no admin category-management endpoint. This profile screen calls that out directly instead of faking unavailable controls."
      />
      <Button title="Logout" variant="outline" onPress={signOut} />
    </AppShell>
  );
}
