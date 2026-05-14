import { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchMyIssues, verifyResolution } from '../../../src/api/issues';
import type { Issue } from '../../../src/api/types';
import { AppShell } from '../../../src/components/AppShell';
import { Button } from '../../../src/components/Button';
import { Card } from '../../../src/components/Card';
import { EmptyState } from '../../../src/components/EmptyState';
import { ErrorState } from '../../../src/components/ErrorState';
import { LoadingState } from '../../../src/components/LoadingState';
import { StatusPill } from '../../../src/components/StatusPill';
import { Fonts, Spacing, TypeScale, useTheme } from '../../../src/theme';

export default function MemberIssuesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  const load = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      setIssues(await fetchMyIssues());
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not load issue history');
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

  const handleVerify = (issue: Issue) => {
    Alert.alert(
      'Verify Resolution',
      `Confirm that issue "${issue.title}" has been properly resolved?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Verify',
          style: 'default',
          onPress: async () => {
            try {
              setVerifyingId(issue.id);
              await verifyResolution(issue.id);
              await load(true);
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.error || 'Could not verify resolution');
            } finally {
              setVerifyingId(null);
            }
          },
        },
      ]
    );
  };

  if (loading) return <LoadingState label="Loading issue history..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <AppShell title="Issue History" subtitle="Review status, proof uploads, and final verification.">
        {issues.length === 0 ? (
          <EmptyState title="No submitted issues" subtitle="Your reported issues will appear here." />
        ) : (
          issues.map((issue) => (
            <Card
              key={issue.id}
              style={styles.card}
            >
              <Text
                style={[styles.title, { color: colors.textPrimary }]}
                onPress={() => router.push(`/(member)/issue/${issue.id}` as any)}
              >
                {issue.title}
              </Text>
              <Text style={[styles.meta, { color: colors.textMuted }]}>
                #{issue.id} · {issue.building} Floor {issue.floor} · {issue.category}
              </Text>
              <StatusPill label={issue.status} tone={issue.status === 'Resolved' ? 'secondary' : 'primary'} />
              {issue.completionNote ? (
                <Text style={[styles.note, { color: colors.textSecondary }]}>
                  Completion note: {issue.completionNote}
                </Text>
              ) : null}
              {issue.rejectionReason ? (
                <Text style={[styles.note, { color: colors.error }]}>
                  {issue.status === 'Rejected' ? 'Rejection reason' : 'Rework requested'}: {issue.rejectionReason}
                </Text>
              ) : null}
              {issue.status === 'Resolved' && !issue.verifiedBy ? (
                <Button
                  title={verifyingId === issue.id ? 'Verifying...' : 'Verify Resolution'}
                  onPress={() => handleVerify(issue)}
                  disabled={verifyingId === issue.id}
                  style={styles.button}
                />
              ) : null}
              {issue.status === 'Resolved' && issue.verifiedBy ? (
                <Text style={[styles.verified, { color: colors.tertiary ?? colors.primary }]}>
                  ✓ Resolution verified
                </Text>
              ) : null}
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
  title: {
    fontFamily: Fonts.title,
    fontSize: TypeScale.title,
  },
  meta: {
    marginTop: 4,
    fontFamily: Fonts.label,
    fontSize: TypeScale.label,
  },
  note: {
    marginTop: Spacing.sm,
    fontFamily: Fonts.body,
    fontSize: TypeScale.bodySmall,
  },
  verified: {
    marginTop: Spacing.sm,
    fontFamily: Fonts.label,
    fontSize: TypeScale.label,
  },
  button: { marginTop: Spacing.md },
});
