import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  assignIssue,
  fetchManagerIssues,
  fetchWorkers,
  filterManagerIssues,
  rejectIssue,
  requestRework,
  resolveIssue,
  searchManagerIssues,
  updateIssuePriority,
} from '../../../src/api/manager';
import type { Issue, UserProfile } from '../../../src/api/types';
import { AppShell } from '../../../src/components/AppShell';
import { Button } from '../../../src/components/Button';
import { Card } from '../../../src/components/Card';
import { EmptyState } from '../../../src/components/EmptyState';
import { ErrorState } from '../../../src/components/ErrorState';
import { Input } from '../../../src/components/Input';
import { LoadingState } from '../../../src/components/LoadingState';
import { StatusPill } from '../../../src/components/StatusPill';
import { Colors, Fonts, Spacing, TypeScale } from '../../../src/theme';

const PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'];
const STATUSES = ['Submitted/Pending', 'Assigned', 'In Progress', 'Under Review', 'Resolved', 'Rejected'];

export default function ManagerIssuesScreen() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [workers, setWorkers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', priority: '', category: '', location: '' });
  const [reasonDrafts, setReasonDrafts] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      setError(null);

      const nextSearch = reset ? '' : search.trim();
      const nextFilters = reset ? { status: '', priority: '', category: '', location: '' } : filters;
      const activeFilters = Object.fromEntries(
        Object.entries(nextFilters).filter(([, value]) => value.trim())
      );
      const issueRequest = nextSearch
        ? searchManagerIssues(nextSearch)
        : Object.keys(activeFilters).length > 0
          ? filterManagerIssues(activeFilters)
          : fetchManagerIssues();

      const [issueData, workerData] = await Promise.all([issueRequest, fetchWorkers()]);
      setIssues(issueData);
      setWorkers(workerData.filter((worker) => worker.isActive));

      if (reset) {
        setSearch('');
        setFilters({ status: '', priority: '', category: '', location: '' });
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not load issues');
    } finally {
      setLoading(false);
    }
  }, [filters, search]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <LoadingState label="Loading issue queue..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => load()} />;
  }

  return (
    <AppShell title="Issue Management" subtitle="Assign workers and move tickets through the lifecycle.">
      <Card style={styles.filters}>
        <Input label="Search" value={search} onChangeText={setSearch} placeholder="Search title, description, or location" />
        <Input label="Location Filter" value={filters.location} onChangeText={(value) => setFilters((current) => ({ ...current, location: value }))} />
        <Input label="Category Filter" value={filters.category} onChangeText={(value) => setFilters((current) => ({ ...current, category: value }))} />

        <Text style={styles.filterLabel}>Status</Text>
        <View style={styles.choiceGrid}>
          {STATUSES.map((status) => (
            <Button
              key={status}
              title={status}
              variant={filters.status === status ? 'primary' : 'ghost'}
              onPress={() => setFilters((current) => ({ ...current, status: current.status === status ? '' : status }))}
              style={styles.choice}
            />
          ))}
        </View>

        <Text style={styles.filterLabel}>Priority</Text>
        <View style={styles.choiceGrid}>
          {PRIORITIES.map((priority) => (
            <Button
              key={priority}
              title={priority}
              variant={filters.priority === priority ? 'primary' : 'ghost'}
              onPress={() => setFilters((current) => ({ ...current, priority: current.priority === priority ? '' : priority }))}
              style={styles.choice}
            />
          ))}
        </View>

        <View style={styles.actions}>
          <Button title="Apply" onPress={() => load()} style={styles.actionButton} />
          <Button title="Clear" variant="outline" onPress={() => load(true)} style={styles.actionButton} />
        </View>
      </Card>

      {issues.length === 0 ? (
        <EmptyState title="No issues in queue" subtitle="Newly submitted requests will appear here." />
      ) : (
        issues.map((issue) => {
          const assignedWorker = workers.find((worker) => worker.id === issue.assignedTo);
          const reason = reasonDrafts[issue.id] || '';

          return (
            <Card key={issue.id} style={styles.card}>
              <Text style={styles.title}>{issue.title}</Text>
              <Text style={styles.meta}>{issue.location}</Text>
              <Text style={styles.meta}>Assigned to: {assignedWorker?.name || 'Unassigned'}</Text>
              <Text style={styles.body}>{issue.description}</Text>
              <StatusPill label={`${issue.priority} - ${issue.status}`} tone="primary" />

              <Text style={styles.filterLabel}>Assign Worker</Text>
              <View style={styles.choiceGrid}>
                {workers.map((worker) => (
                  <Button
                    key={worker.id}
                    title={worker.name}
                    variant={issue.assignedTo === worker.id ? 'secondary' : 'ghost'}
                    onPress={async () => {
                      await assignIssue(issue.id, worker.id);
                      await load();
                    }}
                    style={styles.choice}
                    disabled={issue.assignedTo === worker.id}
                  />
                ))}
              </View>

              <Text style={styles.filterLabel}>Priority</Text>
              <View style={styles.choiceGrid}>
                {PRIORITIES.map((priority) => (
                  <Button
                    key={priority}
                    title={priority}
                    variant={issue.priority === priority ? 'primary' : 'outline'}
                    onPress={async () => {
                      await updateIssuePriority(issue.id, priority);
                      await load();
                    }}
                    style={styles.choice}
                  />
                ))}
              </View>

              {issue.status === 'Under Review' || issue.status === 'Completed' ? (
                <>
                  <Button title="Resolve" onPress={async () => {
                    await resolveIssue(issue.id);
                    await load();
                  }} style={styles.action} />
                  <Input
                    label="Rework Reason"
                    value={reason}
                    onChangeText={(value) => setReasonDrafts((current) => ({ ...current, [issue.id]: value }))}
                    placeholder="Explain what still needs fixing"
                    multiline
                  />
                  <Button title="Request Rework" variant="ghost" onPress={async () => {
                    await requestRework(issue.id, reason || 'Please fix and resubmit from mobile manager console.');
                    await load();
                  }} style={styles.action} />
                </>
              ) : null}

              {issue.status === 'Submitted/Pending' || issue.status === 'Assigned' ? (
                <>
                  <Input
                    label="Rejection Reason"
                    value={reason}
                    onChangeText={(value) => setReasonDrafts((current) => ({ ...current, [issue.id]: value }))}
                    placeholder="Explain why this ticket is rejected"
                    multiline
                  />
                  <Button title="Reject" variant="danger" onPress={async () => {
                    await rejectIssue(issue.id, reason || 'Rejected from mobile manager console.');
                    await load();
                  }} style={styles.action} />
                </>
              ) : null}
            </Card>
          );
        })
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  filters: {
    marginBottom: Spacing.md,
  },
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
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  choice: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  filterLabel: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    fontFamily: Fonts.labelBold,
    fontSize: TypeScale.label,
    color: Colors.textSecondary,
  },
});
