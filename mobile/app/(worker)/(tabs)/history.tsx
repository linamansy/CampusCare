import { useEffect, useState } from 'react';
import { Text } from 'react-native';
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignedIssues(user?.id || 0)
      .then(setIssues)
      .catch((err) => setError(err?.response?.data?.error || 'Could not load task history'))
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) {
    return <LoadingState label="Loading task history..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => {}} />;
  }

  const history = issues.filter((issue) => ['Completed', 'Under Review', 'Resolved', 'Rejected'].includes(issue.status));

  return (
    <AppShell title="History" subtitle="Review closed or submitted work history.">
      {history.length === 0 ? (
        <EmptyState title="No completed history" subtitle="Completed assignments will be listed here." />
      ) : (
        history.map((issue) => (
          <Card key={issue.id} style={{ marginBottom: Spacing.md }}>
            <Text style={{ fontFamily: Fonts.title, fontSize: TypeScale.title, color: colors.textPrimary }}>{issue.title}</Text>
            <Text style={{ marginTop: Spacing.xs, fontFamily: Fonts.body, fontSize: TypeScale.bodySmall, color: colors.textSecondary }}>
              {issue.completionNote || issue.description}
            </Text>
            <Text style={{ marginTop: Spacing.sm, fontFamily: Fonts.label, fontSize: TypeScale.label, color: colors.textMuted }}>
              {issue.location}
            </Text>
            <StatusPill label={issue.status} tone="secondary" />
          </Card>
        ))
      )}
    </AppShell>
  );
}
