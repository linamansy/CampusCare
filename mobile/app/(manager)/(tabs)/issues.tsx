import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { assignIssue, fetchManagerIssues, fetchWorkers, rejectIssue, requestRework, resolveIssue, updateIssuePriority } from '../../../src/api/manager';
import type { Issue, UserProfile } from '../../../src/api/types';
import { AppShell } from '../../../src/components/AppShell';
import { Button } from '../../../src/components/Button';
import { Card } from '../../../src/components/Card';
import { EmptyState } from '../../../src/components/EmptyState';
import { ErrorState } from '../../../src/components/ErrorState';
import { LoadingState } from '../../../src/components/LoadingState';
import { StatusPill } from '../../../src/components/StatusPill';
import { Colors, Fonts, Spacing, TypeScale } from '../../../src/theme';

export default function ManagerIssuesScreen() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [workers, setWorkers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [issueData, workerData] = await Promise.all([fetchManagerIssues(), fetchWorkers()]);
      setIssues(issueData);
      setWorkers(workerData.filter((worker) => worker.isActive));
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not load issues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <LoadingState label="Loading issue queue..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  return (
    <AppShell title="Issue Management" subtitle="Assign workers and move tickets through the lifecycle.">
      {issues.length === 0 ? (
        <EmptyState title="No issues in queue" subtitle="Newly submitted requests will appear here." />
      ) : (
        issues.map((issue) => {
          const fallbackWorker = workers[0];

          return (
            <Card key={issue.id} style={styles.card}>
              <Text style={styles.title}>{issue.title}</Text>
              <Text style={styles.meta}>{issue.location}</Text>
              <Text style={styles.body}>{issue.description}</Text>
              <StatusPill label={`${issue.priority} • ${issue.status}`} tone="primary" />
              {!issue.assignedTo && fallbackWorker ? (
                <Button title={`Assign ${fallbackWorker.name}`} onPress={async () => {
                  await assignIssue(issue.id, fallbackWorker.id);
                  await load();
                }} style={styles.action} />
              ) : null}
              <Button title="Set Urgent Priority" variant="outline" onPress={async () => {
                await updateIssuePriority(issue.id, 'Urgent');
                await load();
              }} style={styles.action} />
              {issue.status === 'Under Review' || issue.status === 'Completed' ? (
                <>
                  <Button title="Resolve" onPress={async () => {
                    await resolveIssue(issue.id);
                    await load();
                  }} style={styles.action} />
                  <Button title="Request Rework" variant="ghost" onPress={async () => {
                    await requestRework(issue.id, 'Please fix and resubmit from mobile manager console.');
                    await load();
                  }} style={styles.action} />
                </>
              ) : null}
              {issue.status === 'Submitted/Pending' || issue.status === 'Assigned' ? (
                <Button title="Reject" variant="danger" onPress={async () => {
                  await rejectIssue(issue.id, 'Rejected from mobile manager console.');
                  await load();
                }} style={styles.action} />
              ) : null}
            </Card>
          );
        })
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: TypeScale.title,
    color: Colors.textPrimary,
  },
  meta: {
    marginTop: Spacing.sm,
    fontFamily: Fonts.label,
    fontSize: TypeScale.label,
    color: Colors.textMuted,
  },
  body: {
    marginTop: Spacing.sm,
    fontFamily: Fonts.body,
    fontSize: TypeScale.bodySmall,
    color: Colors.textSecondary,
  },
  action: {
    marginTop: Spacing.md,
  },
});
