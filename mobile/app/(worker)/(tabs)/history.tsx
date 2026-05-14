import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text } from 'react-native';
import { fetchAssignedIssues } from '../../../src/api/worker';
import type { Issue } from '../../../src/api/types';
import { AppShell } from '../../../src/components/AppShell';
import { Card } from '../../../src/components/Card';
import { EmptyState } from '../../../src/components/EmptyState';
import { ErrorState } from '../../../src/components/ErrorState';
import { LoadingState } from '../../../src/components/LoadingState';
import { StatusPill } from '../../../src/components/StatusPill';
import { useAuth } from '../../../src/state/auth-context';
import { Fonts, Spacing, TypeScale, useTheme } from '../../../src/theme';

export default function WorkerHistoryScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      setIssues(await fetchAssignedIssues(user?.id || 0));
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not load task history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(true);
  };

  if (loading) return <LoadingState label="Loading task history..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const history = issues.filter((i) =>
    ['Completed', 'Under Review', 'Resolved', 'Rejected'].includes(i.status)
  );

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <AppShell title="Task History" subtitle="Review closed or submitted work history.">
        {history.length === 0 ? (
          <EmptyState title="No completed history" subtitle="Completed assignments will be listed here." />
        ) : (
          history.map((issue) => (
            <Card key={issue.id} style={styles.card}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>{issue.title}</Text>
              <Text style={[styles.body, { color: colors.textSecondary }]}>
                {issue.completionNote || issue.description}
              </Text>
              <Text style={[styles.meta, { color: colors.textMuted }]}>{issue.location}</Text>
              {issue.resolvedAt ? (
                <Text style={[styles.meta, { color: colors.textMuted }]}>
                  Resolved: {new Date(issue.resolvedAt).toLocaleDateString()}
                </Text>
              ) : null}
              <StatusPill label={issue.status} tone={issue.status === 'Resolved' ? 'secondary' : 'primary'} />
            </Card>
          ))
        )}
      </AppShell>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1 },
  card: { marginBottom: Spacing.md },
  title: { fontFamily: Fonts.title, fontSize: TypeScale.title },
  body: { marginTop: Spacing.xs, fontFamily: Fonts.body, fontSize: TypeScale.bodySmall },
  meta: { marginTop: Spacing.sm, fontFamily: Fonts.label, fontSize: TypeScale.label },
});
