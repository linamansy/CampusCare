import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { fetchManagerIssues, fetchWorkers } from '../../../src/api/manager';
import type { Issue, UserProfile } from '../../../src/api/types';
import { AppShell } from '../../../src/components/AppShell';
import { ErrorState } from '../../../src/components/ErrorState';
import { LoadingState } from '../../../src/components/LoadingState';
import { MetricCard } from '../../../src/components/MetricCard';
import { SectionHeader } from '../../../src/components/SectionHeader';

export default function ManagerDashboardScreen() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [workers, setWorkers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchManagerIssues(), fetchWorkers()])
      .then(([issueData, workerData]) => {
        setIssues(issueData);
        setWorkers(workerData);
      })
      .catch((err) => setError(err?.response?.data?.error || 'Could not load manager dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingState label="Loading manager dashboard..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => {}} />;
  }

  const urgent = issues.filter((issue) => issue.priority === 'Urgent' || issue.priority === 'High').length;
  const underReview = issues.filter((issue) => issue.status === 'Under Review').length;
  const activeWorkers = workers.filter((worker) => worker.isActive).length;

  return (
    <AppShell title="Manager Dashboard" subtitle="Live issue operations backed by the verified manager API.">
      <View style={styles.row}>
        <MetricCard label="Total Issues" value={issues.length} />
        <MetricCard label="Urgent/High" value={urgent} tone="secondary" />
      </View>
      <View style={styles.row}>
        <MetricCard label="Under Review" value={underReview} />
        <MetricCard label="Active Workers" value={activeWorkers} tone="secondary" />
      </View>
      <SectionHeader title="Operational Notes" subtitle="Use the Issues tab to assign, rework, resolve, and reject tickets." />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 16,
  },
});
