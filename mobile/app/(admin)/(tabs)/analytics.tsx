import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { fetchAdminAnalytics, type AdminAnalyticsResponse } from '../../../src/api/admin';
import { AppShell } from '../../../src/components/AppShell';
import { ErrorState } from '../../../src/components/ErrorState';
import { LoadingState } from '../../../src/components/LoadingState';
import { MetricCard } from '../../../src/components/MetricCard';

export default function AdminAnalyticsScreen() {
  const [analytics, setAnalytics] = useState<AdminAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminAnalytics()
      .then(setAnalytics)
      .catch((err) => setError(err?.response?.data?.error || 'Could not load admin analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingState label="Loading admin analytics..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => {}} />;
  }

  const summary = analytics?.summary;

  return (
    <AppShell title="Analytics" subtitle="Derived from live user and issue datasets.">
      <View style={styles.row}>
        <MetricCard label="Users" value={summary?.totalUsers || 0} />
        <MetricCard label="Issues" value={summary?.totalIssues || 0} tone="secondary" />
      </View>
      <View style={styles.row}>
        <MetricCard
          label="Verified"
          value={summary?.verifiedUsers || 0}
        />
        <MetricCard
          label="Inactive"
          value={summary?.inactiveUsers || 0}
          tone="secondary"
        />
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
