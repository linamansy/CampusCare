import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fetchMyIssues } from '../../../src/api/issues';
import { fetchNotifications } from '../../../src/api/notifications';
import type { Issue, NotificationItem } from '../../../src/api/types';
import { AppShell } from '../../../src/components/AppShell';
import { EmptyState } from '../../../src/components/EmptyState';
import { ErrorState } from '../../../src/components/ErrorState';
import { IssueCard } from '../../../src/components/IssueCard';
import { LoadingState } from '../../../src/components/LoadingState';
import { MetricCard } from '../../../src/components/MetricCard';
import { Colors, Fonts, Spacing, TypeScale } from '../../../src/theme';
import { useAuth } from '../../../src/state/auth-context';

export default function MemberHomeScreen() {
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [issueData, notificationData] = await Promise.all([fetchMyIssues(), fetchNotifications()]);
      setIssues(issueData);
      setNotifications(notificationData);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <LoadingState label="Loading dashboard..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => load()} />;
  }

  const openIssues = issues.filter((issue) => !['Resolved', 'Rejected'].includes(issue.status));
  const resolvedIssues = issues.filter((issue) => issue.status === 'Resolved');
  const unreadNotifications = notifications.filter((item) => !item.isRead).length;

  return (
    <AppShell title="Community Dashboard" subtitle="Track requests, points, and live campus updates.">
      <View style={styles.metricsRow}>
        <MetricCard label="Open Issues" value={openIssues.length} />
        <MetricCard label="Resolved" value={resolvedIssues.length} tone="secondary" />
      </View>
      <View style={styles.metricsRow}>
        <MetricCard label="Unread Alerts" value={unreadNotifications} />
        <MetricCard label="Acts of Service" value={user?.actsOfServicePoints || 0} tone="secondary" />
      </View>
      <Text style={styles.sectionTitle}>Recent Requests</Text>
      {issues.length === 0 ? (
        <EmptyState title="No issues yet" subtitle="Submit your first campus maintenance issue from the Report tab." />
      ) : (
        <View>
          {issues.slice(0, 4).map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </View>
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  sectionTitle: {
    marginTop: Spacing.sm,
    fontFamily: Fonts.headline,
    fontSize: TypeScale.title,
    color: Colors.textPrimary,
  },
});
