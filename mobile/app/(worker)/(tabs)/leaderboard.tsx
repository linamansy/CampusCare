import { useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { fetchWorkerLeaderboard, type LeaderboardEntry } from '../../../src/api/users';
import { AppShell } from '../../../src/components/AppShell';
import { Card } from '../../../src/components/Card';
import { ErrorState } from '../../../src/components/ErrorState';
import { LoadingState } from '../../../src/components/LoadingState';
import { useAuth } from '../../../src/state/auth-context';
import { Fonts, Spacing, TypeScale, useTheme } from '../../../src/theme';

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

export default function WorkerLeaderboardScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      setEntries(await fetchWorkerLeaderboard());
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not load leaderboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(true);
  };

  if (loading) return <LoadingState label="Loading leaderboard..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const myRank = entries.findIndex((e) => e.id === user?.id) + 1;

  return (
    <AppShell
      title="Leaderboard"
      subtitle="Worker rankings by completion points."
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
        {/* My score banner */}
        <Card style={[styles.myScoreCard, { backgroundColor: colors.primary }]}>
          <View style={styles.myScoreRow}>
            <View>
              <Text style={[styles.myScoreLabel, { color: 'rgba(255,255,255,0.75)' }]}>Your Score</Text>
              <Text style={[styles.myScoreValue, { color: '#FFFFFF' }]}>
                {user?.points || 0} pts
              </Text>
            </View>
            {myRank > 0 ? (
              <View style={[styles.myRankBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Text style={[styles.myRankText, { color: '#FFFFFF' }]}>
                  Rank #{myRank}
                </Text>
              </View>
            ) : null}
          </View>
        </Card>

        {entries.length === 0 ? (
          <Card>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No worker scores yet. Complete tasks to earn points!
            </Text>
          </Card>
        ) : (
          entries.map((entry, index) => {
            const rank = index + 1;
            const isMe = entry.id === user?.id;
            const medalColor = MEDAL_COLORS[index] ?? null;

            return (
              <Card
                key={entry.id}
                style={[
                  styles.entryCard,
                  isMe && { borderColor: colors.primary, borderWidth: 2 },
                ]}
              >
                <View style={styles.entryRow}>
                  <View style={[styles.rankCircle, { backgroundColor: medalColor ?? colors.surfaceHigh }]}>
                    <Text style={[styles.rankText, { color: medalColor ? '#fff' : colors.textSecondary }]}>
                      {rank}
                    </Text>
                  </View>
                  <View style={[styles.avatarCircle, { backgroundColor: isMe ? colors.primary : colors.secondaryContainer }]}>
                    <Text style={[styles.avatarText, { color: isMe ? '#FFFFFF' : colors.secondary }]}>
                      {entry.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.nameBlock}>
                    <Text style={[styles.entryName, { color: colors.textPrimary }]}>
                      {entry.name}{isMe ? ' (You)' : ''}
                    </Text>
                  </View>
                  <Text style={[styles.entryScore, { color: colors.primary }]}>
                    {entry.points} pts
                  </Text>
                </View>
              </Card>
            );
          })
        )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  myScoreCard: { marginBottom: Spacing.md },
  myScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  myScoreLabel: {
    fontFamily: Fonts.label,
    fontSize: TypeScale.label,
    opacity: 0.85,
  },
  myScoreValue: {
    fontFamily: Fonts.headline,
    fontSize: TypeScale.headline,
  },
  myRankBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  myRankText: {
    fontFamily: Fonts.title,
    fontSize: TypeScale.body,
  },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: TypeScale.bodySmall,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  entryCard: { marginBottom: Spacing.sm },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rankCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontFamily: Fonts.title,
    fontSize: TypeScale.bodySmall,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: Fonts.title,
    fontSize: TypeScale.title,
  },
  nameBlock: { flex: 1 },
  entryName: {
    fontFamily: Fonts.title,
    fontSize: TypeScale.body,
  },
  entryScore: {
    fontFamily: Fonts.headline,
    fontSize: TypeScale.title,
  },
});
