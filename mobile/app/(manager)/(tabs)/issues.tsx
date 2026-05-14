import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  assignIssue,
  fetchManagerIssues,
  fetchWorkers,
  rejectIssue,
  requestRework,
  resolveIssue,
  updateIssuePriority,
} from '../../../src/api/manager';
import type { Issue, UserProfile } from '../../../src/api/types';
import { AppShell } from '../../../src/components/AppShell';
import { Button } from '../../../src/components/Button';
import { Card } from '../../../src/components/Card';
import { EmptyState } from '../../../src/components/EmptyState';
import { ErrorState } from '../../../src/components/ErrorState';
import { InputModal } from '../../../src/components/InputModal';
import { LoadingState } from '../../../src/components/LoadingState';
import { StatusPill } from '../../../src/components/StatusPill';
import { Fonts, Shadows, Spacing, TypeScale, useTheme } from '../../../src/theme';

const PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'] as const;
type Priority = (typeof PRIORITIES)[number];

const STATUS_FILTERS = ['All', 'Submitted/Pending', 'Assigned', 'In Progress', 'Under Review', 'Completed'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const PRIORITY_COLORS: Record<Priority, string> = {
  Low: '#64748B',
  Normal: '#0EA5E9',
  High: '#F59E0B',
  Urgent: '#EF4444',
};

export default function ManagerIssuesScreen() {
  const { colors } = useTheme();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [workers, setWorkers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<StatusFilter>('All');

  // Modal states
  const [rejectModalIssueId, setRejectModalIssueId] = useState<number | null>(null);
  const [reworkModalIssueId, setReworkModalIssueId] = useState<number | null>(null);
  const [workerPickerIssueId, setWorkerPickerIssueId] = useState<number | null>(null);
  const [priorityPickerIssueId, setPriorityPickerIssueId] = useState<number | null>(null);

  const load = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const [issueData, workerData] = await Promise.all([fetchManagerIssues(), fetchWorkers()]);
      setIssues(issueData);
      setWorkers(workerData.filter((w) => w.isActive));
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not load issues');
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

  const run = async (issueId: number, fn: () => Promise<unknown>) => {
    try {
      setSubmittingId(issueId);
      await fn();
      await load(true);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Action failed');
    } finally {
      setSubmittingId(null);
    }
  };

  const filteredIssues = filter === 'All'
    ? issues
    : issues.filter((i) => i.status === filter);

  if (loading) return <LoadingState label="Loading issue queue..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      {/* Reject Modal */}
      <InputModal
        visible={rejectModalIssueId !== null}
        title="Rejection Reason"
        placeholder="Explain why this issue is being rejected..."
        confirmLabel="Reject"
        onConfirm={(reason) => {
          const id = rejectModalIssueId!;
          setRejectModalIssueId(null);
          run(id, () => rejectIssue(id, reason));
        }}
        onCancel={() => setRejectModalIssueId(null)}
      />

      {/* Rework Modal */}
      <InputModal
        visible={reworkModalIssueId !== null}
        title="Rework Instructions"
        placeholder="Describe what needs to be fixed and resubmitted..."
        confirmLabel="Request Rework"
        onConfirm={(reason) => {
          const id = reworkModalIssueId!;
          setReworkModalIssueId(null);
          run(id, () => requestRework(id, reason));
        }}
        onCancel={() => setReworkModalIssueId(null)}
      />

      {/* Worker Picker Modal */}
      <Modal
        visible={workerPickerIssueId !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setWorkerPickerIssueId(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setWorkerPickerIssueId(null)}>
          <Pressable style={[styles.pickerSheet, { backgroundColor: colors.surfaceLowest, borderColor: colors.surfaceHigh }]}>
            <Text style={[styles.pickerTitle, { color: colors.textPrimary }]}>Assign Worker</Text>
            {workers.length === 0 ? (
              <Text style={[styles.noWorkers, { color: colors.textMuted }]}>No active workers available</Text>
            ) : (
              workers.map((worker) => (
                <Pressable
                  key={worker.id}
                  style={[styles.workerRow, { borderBottomColor: colors.surfaceHigh }]}
                  onPress={() => {
                    const id = workerPickerIssueId!;
                    setWorkerPickerIssueId(null);
                    run(id, () => assignIssue(id, worker.id));
                  }}
                >
                  <View style={[styles.workerAvatar, { backgroundColor: colors.primaryContainer }]}>
                    <Text style={[styles.workerAvatarText, { color: colors.onPrimary }]}>
                      {worker.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.workerInfo}>
                    <Text style={[styles.workerName, { color: colors.textPrimary }]}>{worker.name}</Text>
                    <Text style={[styles.workerMeta, { color: colors.textMuted }]}>{worker.points || 0} pts</Text>
                  </View>
                </Pressable>
              ))
            )}
            <Button title="Cancel" variant="ghost" onPress={() => setWorkerPickerIssueId(null)} style={styles.cancelBtn} />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Priority Picker Modal */}
      <Modal
        visible={priorityPickerIssueId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPriorityPickerIssueId(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setPriorityPickerIssueId(null)}>
          <Pressable style={[styles.pickerSheet, { backgroundColor: colors.surfaceLowest, borderColor: colors.surfaceHigh }]}>
            <Text style={[styles.pickerTitle, { color: colors.textPrimary }]}>Set Priority</Text>
            <View style={styles.priorityGrid}>
              {PRIORITIES.map((p) => (
                <Pressable
                  key={p}
                  style={[styles.priorityChip, { backgroundColor: PRIORITY_COLORS[p] }]}
                  onPress={() => {
                    const id = priorityPickerIssueId!;
                    setPriorityPickerIssueId(null);
                    run(id, () => updateIssuePriority(id, p));
                  }}
                >
                  <Text style={styles.priorityChipText}>{p}</Text>
                </Pressable>
              ))}
            </View>
            <Button title="Cancel" variant="ghost" onPress={() => setPriorityPickerIssueId(null)} style={styles.cancelBtn} />
          </Pressable>
        </Pressable>
      </Modal>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <AppShell title="Issue Management" subtitle="Assign workers and move tickets through the lifecycle.">
          {/* Filter bar */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
            {STATUS_FILTERS.map((s) => (
              <Pressable
                key={s}
                style={[
                  styles.filterChip,
                  { borderColor: colors.surfaceHigh, backgroundColor: filter === s ? colors.primary : colors.surfaceLowest },
                ]}
                onPress={() => setFilter(s)}
              >
                <Text style={[styles.filterChipText, { color: filter === s ? colors.onPrimary : colors.textSecondary }]}>
                  {s === 'Submitted/Pending' ? 'Pending' : s}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {filteredIssues.length === 0 ? (
            <EmptyState title="No issues" subtitle={filter === 'All' ? 'Newly submitted requests will appear here.' : `No issues with status "${filter}".`} />
          ) : (
            filteredIssues.map((issue) => {
              const isBusy = submittingId === issue.id;

              return (
                <Card key={issue.id} style={styles.card}>
                  {/* Header row */}
                  <View style={styles.cardHeader}>
                    <Text style={[styles.issueId, { color: colors.textMuted }]}>#{issue.id}</Text>
                    <StatusPill label={issue.priority} tone={issue.priority === 'Urgent' || issue.priority === 'High' ? 'error' : 'primary'} />
                  </View>

                  <Text style={[styles.title, { color: colors.textPrimary }]}>{issue.title}</Text>
                  <Text style={[styles.meta, { color: colors.textMuted }]}>{issue.building} · Floor {issue.floor} · Room {issue.room}</Text>
                  <Text style={[styles.body, { color: colors.textSecondary }]} numberOfLines={2}>{issue.description}</Text>

                  <View style={styles.statusRow}>
                    <StatusPill label={issue.status} tone="secondary" />
                    {issue.assignedTo ? (
                      <Text style={[styles.assignedLabel, { color: colors.textMuted }]}>
                        Worker #{issue.assignedTo}
                      </Text>
                    ) : (
                      <Text style={[styles.unassignedLabel, { color: colors.error }]}>Unassigned</Text>
                    )}
                  </View>

                  {/* Action buttons */}
                  <View style={styles.actions}>
                    {!issue.assignedTo ? (
                      <Button
                        title={isBusy ? 'Assigning...' : 'Assign Worker'}
                        onPress={() => setWorkerPickerIssueId(issue.id)}
                        disabled={isBusy}
                        style={styles.actionBtn}
                      />
                    ) : null}

                    <Button
                      title="Change Priority"
                      variant="outline"
                      onPress={() => setPriorityPickerIssueId(issue.id)}
                      disabled={isBusy}
                      style={styles.actionBtn}
                    />

                    {(issue.status === 'Under Review' || issue.status === 'Completed') ? (
                      <>
                        <Button
                          title={isBusy ? 'Resolving...' : 'Mark Resolved'}
                          onPress={() => run(issue.id, () => resolveIssue(issue.id))}
                          disabled={isBusy}
                          style={styles.actionBtn}
                        />
                        <Button
                          title="Request Rework"
                          variant="ghost"
                          onPress={() => setReworkModalIssueId(issue.id)}
                          disabled={isBusy}
                          style={styles.actionBtn}
                        />
                      </>
                    ) : null}

                    {(issue.status === 'Submitted/Pending' || issue.status === 'Assigned') ? (
                      <Button
                        title="Reject"
                        variant="danger"
                        onPress={() => setRejectModalIssueId(issue.id)}
                        disabled={isBusy}
                        style={styles.actionBtn}
                      />
                    ) : null}
                  </View>
                </Card>
              );
            })
          )}
        </AppShell>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1 },
  filterScroll: { marginBottom: Spacing.md },
  filterRow: { gap: Spacing.sm, paddingHorizontal: 2, paddingBottom: 4 },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontFamily: Fonts.label,
    fontSize: TypeScale.label,
  },
  card: { marginBottom: Spacing.md },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  issueId: { fontFamily: Fonts.label, fontSize: TypeScale.label },
  title: { fontFamily: Fonts.title, fontSize: TypeScale.title },
  meta: { marginTop: 4, fontFamily: Fonts.label, fontSize: TypeScale.label },
  body: { marginTop: Spacing.sm, fontFamily: Fonts.body, fontSize: TypeScale.bodySmall },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  assignedLabel: { fontFamily: Fonts.label, fontSize: TypeScale.label },
  unassignedLabel: { fontFamily: Fonts.label, fontSize: TypeScale.label, fontWeight: '700' },
  actions: { marginTop: Spacing.md, gap: Spacing.sm },
  actionBtn: {},
  // Modals
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
    ...Shadows.soft,
  },
  pickerTitle: {
    fontFamily: Fonts.headline,
    fontSize: TypeScale.title,
    marginBottom: Spacing.sm,
  },
  noWorkers: { fontFamily: Fonts.body, fontSize: TypeScale.bodySmall },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  workerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workerAvatarText: { fontFamily: Fonts.title, fontSize: TypeScale.title },
  workerInfo: { flex: 1 },
  workerName: { fontFamily: Fonts.title, fontSize: TypeScale.body },
  workerMeta: { fontFamily: Fonts.label, fontSize: TypeScale.label },
  priorityGrid: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  priorityChip: {
    flex: 1,
    minWidth: 80,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  priorityChipText: { fontFamily: Fonts.title, fontSize: TypeScale.bodySmall, color: '#fff' },
  cancelBtn: { marginTop: Spacing.sm },
});
