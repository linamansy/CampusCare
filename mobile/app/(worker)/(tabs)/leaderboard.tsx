import { Text } from 'react-native';
import { AppShell } from '../../../src/components/AppShell';
import { Card } from '../../../src/components/Card';
import { InfoBanner } from '../../../src/components/InfoBanner';
import { useAuth } from '../../../src/state/auth-context';
import { Fonts, Spacing, TypeScale, useTheme } from '../../../src/theme';

export default function WorkerLeaderboardScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();

  return (
    <AppShell title="Leaderboard" subtitle="Current gamification support comes from backend point totals.">
      <Card>
        <Text style={{ fontFamily: Fonts.headline, fontSize: TypeScale.headline, color: colors.textPrimary }}>
          {user?.points || 0} pts
        </Text>
        <Text style={{ marginTop: Spacing.sm, fontFamily: Fonts.body, fontSize: TypeScale.bodySmall, color: colors.textSecondary }}>
          Your worker score increases when you move tickets through the workflow and submit completion proof.
        </Text>
      </Card>
      <InfoBanner
        title="Leaderboard backend gap"
        message="The API does not provide a global ranking endpoint yet. This screen shows your live score only, based on real backend point totals."
      />
    </AppShell>
  );
}
