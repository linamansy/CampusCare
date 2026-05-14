import { useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { fetchManagerIssues, fetchWorkers } from '../../../src/api/manager';
import type { Issue, UserProfile } from '../../../src/api/types';
import { AppShell } from '../../../src/components/AppShell';
import { Card } from '../../../src/components/Card';
import { ErrorState } from '../../../src/components/ErrorState';
import { LoadingState } from '../../../src/components/LoadingState';
import { MetricCard } from '../../../src/components/MetricCard';
import { SectionHeader } from '../../../src/components/SectionHeader';
import { Fonts, Spacing, TypeScale, useTheme } from '../../../src/theme';

export default function ManagerDashboardScreen() {
  const { colors } = useTheme();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [workers, setWorkers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const [issueData, workerData] = await Promise.all([fetchManagerIssues(), fetchWorkers()]);
      setIssues(issueData);
      setWorkers(workerData);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not load manager dashboard');
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

  if (loading) return <LoadingState label="Loading manager dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const urgent = issues.filter((i) => i.priority === 'Urgent' || i.priority === 'High').length;
  const underReview = issues.filter((i) => i.status === 'Under Review').length;
  const activeWorkers = workers.filter((w) => w.isActive).length;
  const unassigned = issues.filter((i) => !i.assignedTo).length;
  const pending = issues.filter((i) => i.status === 'Submitted/Pending').length;
  const resolved = issues.filter((i) => i.status === 'Resolved').length;

  const recentIssues = [...issues]
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
    .slice(0, 3);

  return (
    <AppShell
      title="Manager Dashboard"
      subtitle="Live campus issue operations at a glance."
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
        <View style={styles.row}>
          <MetricCard label="Total Issues" value={issues.length} tone="primary" icon="list" />
          <MetricCard label="Urgent / High" value={urgent} tone="error" icon="alert-circle" />
        </View>
        <View style={styles.row}>
          <MetricCard label="Under Review" value={underReview} tone="secondary" icon="eye" />
          <MetricCard label="Active Workers" value={activeWorkers} tone="tertiary" icon="people" />
        </View>
        <View style={styles.row}>
          <MetricCard label="Pending" value={pending} tone="warning" icon="time" />
          <MetricCard label="Unassigned" value={unassigned} tone="warning" icon="person-add" />
        </View>
        <View style={styles.row}>
          <MetricCard label="Resolved" value={resolved} tone="success" icon="checkmark-circle" />
        </View>

        {recentIssues.length > 0 ? (
          <>
            <SectionHeader title="Recent Submissions" subtitle="Latest issues requiring attention." />
            {recentIssues.map((issue) => (
              <Card key={issue.id} style={styles.recentCard}>
                <View style={styles.recentHeader}>
                  <Text style={[styles.recentTitle, { color: colors.textPrimary }]}>{issue.title}</Text>
                  <Text style={[styles.recentId, { color: colors.textMuted }]}>#{issue.id}</Text>
                </View>
                <Text style={[styles.recentMeta, { color: colors.textMuted }]}>
                  {issue.status} · {issue.priority} · {issue.category}
                </Text>
              </Card>
            ))}
          </>
        ) : null}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: 2,
  },
  recentCard: {
    marginBottom: Spacing.sm,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  recentTitle: {
    flex: 1,
    fontFamily: Fonts.title,
    fontSize: TypeScale.body,
    marginRight: Spacing.sm,
  },
  recentId: {
    fontFamily: Fonts.label,
    fontSize: TypeScale.label,
  },
  recentMeta: {
    marginTop: 4,
    fontFamily: Fonts.label,
    fontSize: TypeScale.label,
  },
});
