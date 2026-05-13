import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { addIssueComment } from '../../../src/api/issues';
import { fetchAssignedIssues, markIssueCompleted, markIssueInProgress, uploadCompletionPhoto } from '../../../src/api/worker';
import type { Issue } from '../../../src/api/types';
import { AppShell } from '../../../src/components/AppShell';
import { Button } from '../../../src/components/Button';
import { Card } from '../../../src/components/Card';
import { EmptyState } from '../../../src/components/EmptyState';
import { ErrorState } from '../../../src/components/ErrorState';
import { Input } from '../../../src/components/Input';
import { LoadingState } from '../../../src/components/LoadingState';
import { StatusPill } from '../../../src/components/StatusPill';
import { useAuth } from '../../../src/state/auth-context';
import { Colors, Fonts, Spacing, TypeScale } from '../../../src/theme';

export default function WorkerTasksScreen() {
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  const [completionNotes, setCompletionNotes] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setIssues(await fetchAssignedIssues(user?.id || 0));
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not load assigned tasks');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const uploadProof = async (issueId: number) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Photo access is required to upload completion proof.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled || !result.assets[0]) {
      return;
    }

    const asset = result.assets[0];
    await uploadCompletionPhoto({
      issueId,
      workerId: user?.id || 0,
      photoUri: asset.uri,
      fileName: asset.fileName || 'completion.jpg',
      fileType: asset.mimeType || 'image/jpeg',
      note: completionNotes[issueId] || 'Completed from the mobile worker console.',
    });
    await load();
  };

  if (loading) {
    return <LoadingState label="Loading assigned tasks..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  return (
    <AppShell title="My Tasks" subtitle="Pick up assigned work, update status, and submit proof.">
      {issues.length === 0 ? (
        <EmptyState title="No assigned tasks" subtitle="Assignments from facility managers will appear here." />
      ) : (
        issues.map((issue) => (
          <Card key={issue.id} style={styles.card}>
            <Text style={styles.title}>{issue.title}</Text>
            <Text style={styles.meta}>{issue.location}</Text>
            <StatusPill label={issue.status} tone={issue.status === 'Under Review' ? 'tertiary' : 'secondary'} />
            <Text style={styles.body}>{issue.description}</Text>
            <Input
              label="Worker Comment"
              value={commentDrafts[issue.id] || ''}
              onChangeText={(value) => setCommentDrafts((current) => ({ ...current, [issue.id]: value }))}
              placeholder="Add a progress update"
              multiline
            />
            <Button title="Add Comment" variant="ghost" onPress={async () => {
              const text = commentDrafts[issue.id]?.trim();
              if (!text) {
                return;
              }
              await addIssueComment(issue.id, text);
              setCommentDrafts((current) => ({ ...current, [issue.id]: '' }));
              await load();
            }} style={styles.action} />
            {issue.status === 'Assigned' || issue.status === 'Submitted/Pending' ? (
              <Button title="Start Work" onPress={async () => {
                await markIssueInProgress(issue.id, user?.id || 0);
                await load();
              }} style={styles.action} />
            ) : null}
            {issue.status === 'In Progress' ? (
              <>
                <Input
                  label="Completion Note"
                  value={completionNotes[issue.id] || ''}
                  onChangeText={(value) => setCompletionNotes((current) => ({ ...current, [issue.id]: value }))}
                  placeholder="Describe what was fixed"
                  multiline
                />
                <Button title="Upload Completion Proof" variant="outline" onPress={() => uploadProof(issue.id)} style={styles.action} />
                <Button title="Mark Completed" onPress={async () => {
                  await markIssueCompleted(issue.id, user?.id || 0);
                  await load();
                }} style={styles.action} />
              </>
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
