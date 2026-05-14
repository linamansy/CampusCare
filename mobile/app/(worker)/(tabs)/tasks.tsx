import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { fetchAssignedIssues, markIssueCompleted, markIssueInProgress, uploadCompletionPhoto } from '../../../src/api/worker';
import type { Issue } from '../../../src/api/types';
import { AppShell } from '../../../src/components/AppShell';
import { Button } from '../../../src/components/Button';
import { Card } from '../../../src/components/Card';
import { EmptyState } from '../../../src/components/EmptyState';
import { ErrorState } from '../../../src/components/ErrorState';
import { LoadingState } from '../../../src/components/LoadingState';
import { StatusPill } from '../../../src/components/StatusPill';
import { useAuth } from '../../../src/state/auth-context';
import { Fonts, Spacing, TypeScale, useTheme } from '../../../src/theme';

export default function WorkerTasksScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});

  const load = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      setIssues(await fetchAssignedIssues(user?.id || 0));
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not load assigned tasks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load(true);
  };

  useState(() => {
    load();
  });

  const handleStartWork = async (issueId: number) => {
    try {
      setSubmittingId(issueId);
      await markIssueInProgress(issueId, user?.id || 0);
      await load(true);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Could not update status');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleMarkCompleted = async (issueId: number) => {
    try {
      setSubmittingId(issueId);
      await markIssueCompleted(issueId, user?.id || 0);
      await load(true);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Could not mark completed');
    } finally {
      setSubmittingId(null);
    }
  };

  const uploadProof = async (issueId: number) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Photo access is required to upload completion proof.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const note = notes[issueId] || '';

    try {
      setSubmittingId(issueId);
      await uploadCompletionPhoto({
        issueId,
        workerId: user?.id || 0,
        photoUri: asset.uri,
        fileName: asset.fileName || 'completion.jpg',
        fileType: asset.mimeType || 'image/jpeg',
        note,
      });
      setNotes((prev) => ({ ...prev, [issueId]: '' }));
      await load(true);
    } catch (err: any) {
      Alert.alert('Upload failed', err?.response?.data?.error || 'Could not upload photo');
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return <LoadingState label="Loading assigned tasks..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  const activeTasks = issues.filter((i) =>
    ['Assigned', 'Submitted/Pending', 'In Progress'].includes(i.status)
  );

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <AppShell title="My Tasks" subtitle="Pick up assigned work, update status, and submit proof.">
        {activeTasks.length === 0 ? (
          <EmptyState title="No active tasks" subtitle="Assignments from facility managers will appear here." />
        ) : (
          activeTasks.map((issue) => {
            const isBusy = submittingId === issue.id;
            const note = notes[issue.id] || '';

            return (
              <Card key={issue.id} style={styles.card}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>{issue.title}</Text>
                <Text style={[styles.meta, { color: colors.textMuted }]}>{issue.location}</Text>
                <StatusPill label={issue.status} tone={issue.status === 'Under Review' ? 'tertiary' : 'secondary'} />
                <Text style={[styles.body, { color: colors.textSecondary }]}>{issue.description}</Text>

                {(issue.status === 'Assigned' || issue.status === 'Submitted/Pending') ? (
                  <Button
                    title={isBusy ? 'Starting...' : 'Start Work'}
                    onPress={() => handleStartWork(issue.id)}
                    disabled={isBusy}
                    style={styles.action}
                  />
                ) : null}

                {issue.status === 'In Progress' ? (
                  <>
                    <TextInput
                      style={[
                        styles.noteInput,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.surfaceHigh,
                          color: colors.textPrimary,
                        },
                      ]}
                      placeholder="Completion notes (optional)"
                      placeholderTextColor={colors.textMuted}
                      value={note}
                      onChangeText={(t) => setNotes((prev) => ({ ...prev, [issue.id]: t }))}
                      multiline
                      numberOfLines={3}
                    />
                    <Button
                      title={isBusy ? 'Uploading...' : 'Upload Completion Photo'}
                      variant="outline"
                      onPress={() => uploadProof(issue.id)}
                      disabled={isBusy}
                      style={styles.action}
                    />
                    <Button
                      title={isBusy ? 'Completing...' : 'Mark Completed'}
                      onPress={() => handleMarkCompleted(issue.id)}
                      disabled={isBusy}
                      style={styles.action}
                    />
                  </>
                ) : null}
              </Card>
            );
          })
        )}
      </AppShell>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  card: {
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: TypeScale.title,
  },
  meta: {
    marginTop: Spacing.sm,
    fontFamily: Fonts.label,
    fontSize: TypeScale.label,
  },
  body: {
    marginTop: Spacing.sm,
    fontFamily: Fonts.body,
    fontSize: TypeScale.bodySmall,
  },
  noteInput: {
    marginTop: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.md,
    fontFamily: Fonts.body,
    fontSize: TypeScale.bodySmall,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  action: {
    marginTop: Spacing.md,
  },
});
