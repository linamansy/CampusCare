import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { fetchMyIssues, verifyResolution } from '../../../src/api/issues';
import type { Issue } from '../../../src/api/types';
import { AppShell } from '../../../src/components/AppShell';
import { Button } from '../../../src/components/Button';
import { Card } from '../../../src/components/Card';
import { EmptyState } from '../../../src/components/EmptyState';
import { ErrorState } from '../../../src/components/ErrorState';
import { LoadingState } from '../../../src/components/LoadingState';
import { StatusPill } from '../../../src/components/StatusPill';
import { Colors, Fonts, Spacing, TypeScale } from '../../../src/theme';

export default function MemberIssuesScreen() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      setIssues(await fetchMyIssues());
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not load issue history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <LoadingState label="Loading issue history..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  return (
    <AppShell title="Issue History" subtitle="Review status, proof uploads, and final verification.">
      {issues.length === 0 ? (
        <EmptyState title="No submitted issues" subtitle="Your reported issues will appear here." />
      ) : (
        issues.map((issue) => (
          <Card key={issue.id} style={styles.card}>
            <Text style={styles.title}>{issue.title}</Text>
            <Text style={styles.copy}>{issue.description}</Text>
            <Text style={styles.location}>{issue.location}</Text>
            <StatusPill label={issue.status} tone={issue.status === 'Resolved' ? 'secondary' : 'primary'} />
            {issue.completionNote ? <Text style={styles.meta}>Completion note: {issue.completionNote}</Text> : null}
            {issue.rejectionReason ? <Text style={styles.meta}>Rejection/rework note: {issue.rejectionReason}</Text> : null}
            {issue.status === 'Resolved' && !issue.verifiedBy ? (
              <Button title="Verify Resolution" onPress={async () => {
                await verifyResolution(issue.id);
                await load();
              }} style={styles.button} />
            ) : null}
          </Card>
        ))
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
  copy: {
    marginTop: Spacing.xs,
    fontFamily: Fonts.body,
    fontSize: TypeScale.bodySmall,
    color: Colors.textSecondary,
  },
  location: {
    marginTop: Spacing.sm,
    fontFamily: Fonts.label,
    fontSize: TypeScale.label,
    color: Colors.textMuted,
  },
  meta: {
    marginTop: Spacing.sm,
    fontFamily: Fonts.body,
    fontSize: TypeScale.bodySmall,
    color: Colors.textSecondary,
  },
  button: {
    marginTop: Spacing.md,
  },
});
