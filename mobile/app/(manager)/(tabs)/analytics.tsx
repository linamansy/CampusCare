import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { fetchManagerAnalytics, type ManagerAnalyticsResponse } from '../../../src/api/manager';
import { AppShell } from '../../../src/components/AppShell';
import { ErrorState } from '../../../src/components/ErrorState';
import { LoadingState } from '../../../src/components/LoadingState';
import { MetricCard } from '../../../src/components/MetricCard';

export default function ManagerAnalyticsScreen() {
  const [analytics, setAnalytics] = useState<ManagerAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchManagerAnalytics()
      .then(setAnalytics)
      .catch((err) => setError(err?.response?.data?.error || 'Could not load analytics data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingState label="Loading analytics..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => {}} />;
  }

  const summary = analytics?.summary;

  return (
    <AppShell title="Analytics" subtitle="Derived from live manager issue data.">
      <View style={styles.row}>
        <MetricCard label="Resolved" value={summary?.resolvedIssues || 0} />
        <MetricCard label="Rejected" value={summary?.rejectedIssues || 0} tone="secondary" />
      </View>
      <View style={styles.row}>
        <MetricCard label="Assigned" value={summary?.assignedIssues || 0} />
        <MetricCard label="Unassigned" value={summary?.unassignedIssues || 0} tone="secondary" />
      </View>
      <View style={styles.row}>
        <MetricCard label="Under Review" value={summary?.underReviewIssues || 0} />
        <MetricCard label="Active Workers" value={summary?.activeWorkers || 0} tone="secondary" />
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 16,
  },
});
