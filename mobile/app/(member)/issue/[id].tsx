import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { addIssueComment, fetchIssueById, fetchIssueComments, verifyResolution } from '../../../src/api/issues';
import type { Issue, IssueComment } from '../../../src/api/types';
import { Button } from '../../../src/components/Button';
import { Card } from '../../../src/components/Card';
import { ErrorState } from '../../../src/components/ErrorState';
import { LoadingState } from '../../../src/components/LoadingState';
import { StatusPill } from '../../../src/components/StatusPill';
import { useAuth } from '../../../src/state/auth-context';
import { Fonts, Shadows, Spacing, TypeScale, useTheme } from '../../../src/theme';

const PRIORITY_COLORS: Record<string, string> = {
  Urgent: '#EF4444',
  High: '#F59E0B',
  Normal: '#0EA5E9',
  Low: '#64748B',
};

export default function IssueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [issue, setIssue] = useState<Issue | null>(null);
  const [comments, setComments] = useState<IssueComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const issueId = parseInt(id || '0', 10);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [issueData, commentsData] = await Promise.all([
        fetchIssueById(issueId),
        fetchIssueComments(issueId),
      ]);
      setIssue(issueData);
      setComments(commentsData);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not load issue details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [issueId]);

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      setSubmittingComment(true);
      await addIssueComment(issueId, commentText.trim());
      setCommentText('');
      await load();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Could not add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleVerify = () => {
    if (!issue) return;
    Alert.alert(
      'Verify Resolution',
      'Confirm this issue has been properly resolved?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setVerifying(true);
              await verifyResolution(issueId);
              await load();
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.error || 'Could not verify resolution');
            } finally {
              setVerifying(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) return <LoadingState label="Loading issue details..." />;
  if (error || !issue) return <ErrorState message={error || 'Issue not found'} onRetry={load} />;

  const priorityColor = PRIORITY_COLORS[issue.priority] || PRIORITY_COLORS.Normal;
  const canVerify = issue.status === 'Resolved' && !issue.verifiedBy && issue.userId === user?.id;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Back header */}
        <Pressable style={[styles.backRow, { backgroundColor: colors.surface }]} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
        </Pressable>

        <View style={styles.content}>
          {/* Header card */}
          <Card style={styles.headerCard}>
            <View style={styles.headerRow}>
              <Text style={[styles.issueId, { color: colors.textMuted }]}>Issue #{issue.id}</Text>
              <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
                <Text style={styles.priorityText}>{issue.priority}</Text>
              </View>
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{issue.title}</Text>
            <View style={styles.statusRow}>
              <StatusPill label={issue.status} tone={issue.status === 'Resolved' ? 'secondary' : 'primary'} />
              {issue.verifiedBy ? (
                <Text style={[styles.verifiedBadge, { color: colors.tertiary ?? colors.primary }]}>✓ Verified</Text>
              ) : null}
            </View>
            <Text style={[styles.meta, { color: colors.textMuted }]}>
              {issue.category} · {issue.building} Floor {issue.floor}, Room {issue.room}
            </Text>
            <Text style={[styles.meta, { color: colors.textMuted }]}>
              Submitted {formatDate(issue.createdAt)}
            </Text>
          </Card>

          {/* Description */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Description</Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>{issue.description}</Text>
          </Card>

          {/* Issue photo */}
          {issue.image ? (
            <Card style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Issue Photo</Text>
              <Image source={{ uri: issue.image }} style={styles.photo} resizeMode="cover" />
            </Card>
          ) : null}

          {/* Completion info */}
          {(issue.completionPhotoUrl || issue.completionNote) ? (
            <Card style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Completion Details</Text>
              {issue.completionNote ? (
                <Text style={[styles.body, { color: colors.textSecondary }]}>{issue.completionNote}</Text>
              ) : null}
              {issue.completionPhotoUrl ? (
                <Image source={{ uri: issue.completionPhotoUrl }} style={styles.photo} resizeMode="cover" />
              ) : null}
            </Card>
          ) : null}

          {/* Rejection / Rework reason */}
          {issue.rejectionReason ? (
            <Card style={[styles.section, { borderColor: colors.error }]}>
              <Text style={[styles.sectionTitle, { color: colors.error }]}>
                {issue.status === 'Rejected' ? 'Rejection Reason' : 'Rework Requested'}
              </Text>
              <Text style={[styles.body, { color: colors.textSecondary }]}>{issue.rejectionReason}</Text>
            </Card>
          ) : null}

          {/* Verify button */}
          {canVerify ? (
            <Button
              title={verifying ? 'Verifying...' : 'Verify Resolution'}
              onPress={handleVerify}
              disabled={verifying}
              style={styles.verifyBtn}
            />
          ) : null}

          {/* Comments */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Comments ({comments.length})
            </Text>
            {comments.length === 0 ? (
              <Text style={[styles.body, { color: colors.textMuted }]}>No comments yet.</Text>
            ) : (
              comments.map((comment) => (
                <View key={comment.id} style={[styles.commentRow, { borderBottomColor: colors.surfaceHigh }]}>
                  <View style={[styles.commentAvatar, { backgroundColor: colors.primaryContainer }]}>
                    <Text style={[styles.commentAvatarText, { color: colors.onPrimary }]}>
                      {(comment.user?.name || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.commentContent}>
                    <View style={styles.commentMeta}>
                      <Text style={[styles.commentAuthor, { color: colors.textPrimary }]}>
                        {comment.user?.name || 'User'}
                      </Text>
                      <Text style={[styles.commentRole, { color: colors.textMuted }]}>
                        {comment.user?.role}
                      </Text>
                    </View>
                    <Text style={[styles.commentText, { color: colors.textSecondary }]}>{comment.text}</Text>
                    {comment.createdAt ? (
                      <Text style={[styles.commentDate, { color: colors.textMuted }]}>{formatDate(comment.createdAt)}</Text>
                    ) : null}
                  </View>
                </View>
              ))
            )}

            {/* Add comment */}
            <View style={styles.commentInputRow}>
              <TextInput
                style={[
                  styles.commentInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.surfaceHigh,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder="Add a comment..."
                placeholderTextColor={colors.textMuted}
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <Pressable
                style={[
                  styles.sendBtn,
                  { backgroundColor: commentText.trim() ? colors.primary : colors.surfaceHigh },
                ]}
                onPress={handleAddComment}
                disabled={submittingComment || !commentText.trim()}
              >
                <Text style={[styles.sendBtnText, { color: commentText.trim() ? colors.onPrimary : colors.textMuted }]}>
                  {submittingComment ? '...' : 'Send'}
                </Text>
              </Pressable>
            </View>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1 },
  backRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  backText: {
    fontFamily: Fonts.title,
    fontSize: TypeScale.body,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  headerCard: { gap: Spacing.sm },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  issueId: {
    fontFamily: Fonts.label,
    fontSize: TypeScale.label,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  priorityText: {
    fontFamily: Fonts.label,
    fontSize: TypeScale.label,
    color: '#fff',
  },
  title: {
    fontFamily: Fonts.headline,
    fontSize: TypeScale.title,
    lineHeight: 26,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  verifiedBadge: {
    fontFamily: Fonts.label,
    fontSize: TypeScale.label,
  },
  meta: {
    fontFamily: Fonts.label,
    fontSize: TypeScale.label,
  },
  section: { gap: Spacing.sm },
  sectionTitle: {
    fontFamily: Fonts.headline,
    fontSize: TypeScale.body,
  },
  body: {
    fontFamily: Fonts.body,
    fontSize: TypeScale.bodySmall,
    lineHeight: 20,
  },
  photo: {
    width: '100%',
    height: 220,
    borderRadius: 14,
  },
  verifyBtn: { marginTop: 4 },
  commentRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  commentAvatarText: {
    fontFamily: Fonts.title,
    fontSize: TypeScale.body,
  },
  commentContent: { flex: 1 },
  commentMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  commentAuthor: {
    fontFamily: Fonts.title,
    fontSize: TypeScale.bodySmall,
  },
  commentRole: {
    fontFamily: Fonts.label,
    fontSize: TypeScale.label,
  },
  commentText: {
    fontFamily: Fonts.body,
    fontSize: TypeScale.bodySmall,
    marginTop: 2,
  },
  commentDate: {
    fontFamily: Fonts.label,
    fontSize: TypeScale.label,
    marginTop: 2,
  },
  commentInputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    alignItems: 'flex-end',
  },
  commentInput: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontFamily: Fonts.body,
    fontSize: TypeScale.bodySmall,
    minHeight: 44,
    maxHeight: 100,
  },
  sendBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 56,
  },
  sendBtnText: {
    fontFamily: Fonts.title,
    fontSize: TypeScale.bodySmall,
  },
});
