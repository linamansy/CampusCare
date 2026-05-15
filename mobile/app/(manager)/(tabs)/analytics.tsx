import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { fetchManagerAnalytics, type ManagerAnalyticsResponse } from '../../../src/api/manager';
import { AppShell } from '../../../src/components/AppShell';
import { Card } from '../../../src/components/Card';
import { ErrorState } from '../../../src/components/ErrorState';
import { LoadingState } from '../../../src/components/LoadingState';
import { MetricCard } from '../../../src/components/MetricCard';
import { SectionHeader } from '../../../src/components/SectionHeader';
import { Fonts, Spacing, TypeScale, useTheme } from '../../../src/theme';

// ── Inline bar chart ─────────────────────────────────────────────────────────

function BarChart({ data, maxValue }: { data: { label: string; value: number; color?: string }[]; maxValue?: number }) {
  const { colors } = useTheme();
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);
  return (
    <View style={barStyles.container}>
      {data.map((item, i) => (
        <View key={i} style={barStyles.row}>
          <Text style={[barStyles.label, { color: colors.textSecondary }]} numberOfLines={1}>{item.label}</Text>
          <View style={[barStyles.track, { backgroundColor: colors.surfaceHigh }]}>
            <View style={[barStyles.fill, { width: `${Math.max((item.value / max) * 100, item.value > 0 ? 4 : 0)}%`, backgroundColor: item.color ?? colors.primary }]} />
          </View>
          <Text style={[barStyles.value, { color: colors.textPrimary }]}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

const barStyles = StyleSheet.create({
  container: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  label: { width: 90, fontFamily: Fonts.label, fontSize: 11 },
  track: { flex: 1, height: 18, borderRadius: 9, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 9 },
  value: { width: 28, fontFamily: Fonts.title, fontSize: TypeScale.label, textAlign: 'right' },
});

// ── Stat row ─────────────────────────────────────────────────────────────────

function StatRow({ label, value, icon, color }: { label: string; value: string | number; icon: keyof typeof Ionicons.glyphMap; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={[statStyles.row, { borderBottomColor: colors.surfaceHigh }]}>
      <View style={[statStyles.icon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[statStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[statStyles.value, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 10, borderBottomWidth: 1 },
  icon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  label: { flex: 1, fontFamily: Fonts.body, fontSize: TypeScale.bodySmall },
  value: { fontFamily: Fonts.title, fontSize: TypeScale.body },
});

// ── Colour maps ───────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  Low: '#64748B', Normal: '#0EA5E9', High: '#F59E0B', Urgent: '#EF4444',
};

const STATUS_COLORS: Record<string, string> = {
  'Submitted/Pending': '#F59E0B', Assigned: '#0EA5E9', 'In Progress': '#7C3AED',
  'Under Review': '#0891B2', Resolved: '#059669', Rejected: '#EF4444', Completed: '#10B981',
};

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ManagerAnalyticsScreen() {
  const { colors } = useTheme();
  const [analytics, setAnalytics] = useState<ManagerAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      setAnalytics(await fetchManagerAnalytics());
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingState label="Loading analytics..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const s = analytics!.summary;
  const resolutionRate = s.totalIssues > 0 ? Math.round((s.resolvedIssues / s.totalIssues) * 100) : 0;

  return (
    <AppShell
      title="Analytics"
      subtitle="Live campus issue performance overview."
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={colors.primary} />}
    >
      {/* KPIs */}
      <View style={styles.row}>
        <MetricCard label="Total Issues" value={s.totalIssues} tone="primary" icon="list" />
        <MetricCard label="Resolved" value={s.resolvedIssues} tone="success" icon="checkmark-circle" />
      </View>
      <View style={styles.row}>
        <MetricCard label="Under Review" value={s.underReviewIssues} tone="secondary" icon="eye" />
        <MetricCard label="Active Workers" value={s.activeWorkers} tone="tertiary" icon="people" />
      </View>
      <View style={styles.row}>
        <MetricCard label="Unassigned" value={s.unassignedIssues} tone="warning" icon="person-add" />
        <MetricCard label="Reworks" value={s.reworkCount} tone="error" icon="refresh-circle" />
      </View>

      {/* Performance summary */}
      <SectionHeader title="Performance Summary" subtitle="Key health indicators." />
      <Card>
        <StatRow label="Resolution Rate" value={`${resolutionRate}%`} icon="trending-up" color={colors.success} />
        <StatRow label="Avg. Resolution Time" value={`${s.avgResolutionDays} days`} icon="time-outline" color={colors.primary} />
        <StatRow label="Rejected Issues" value={s.rejectedIssues} icon="close-circle-outline" color={colors.error} />
        <StatRow label="Assigned Issues" value={s.assignedIssues} icon="person-outline" color={colors.secondary} />
      </Card>

      {/* Status distribution */}
      <SectionHeader title="Issues by Status" subtitle="Current distribution across all statuses." />
      <Card>
        <BarChart
          data={analytics!.issuesByStatus.map((d) => ({
            label: d.status.replace('Submitted/', ''),
            value: d.count,
            color: STATUS_COLORS[d.status] ?? colors.primary,
          }))}
        />
      </Card>

      {/* Priority distribution */}
      <SectionHeader title="Issues by Priority" subtitle="Urgency breakdown of open tickets." />
      <Card>
        <BarChart
          data={analytics!.issuesByPriority.map((d) => ({
            label: d.priority,
            value: d.count,
            color: PRIORITY_COLORS[d.priority] ?? colors.primary,
          }))}
        />
      </Card>

      {/* Category distribution */}
      {analytics!.issuesByCategory.length > 0 ? (
        <>
          <SectionHeader title="Issues by Category" subtitle="Most common maintenance types." />
          <Card>
            <BarChart
              data={[...analytics!.issuesByCategory]
                .sort((a, b) => b.count - a.count)
                .slice(0, 8)
                .map((d) => ({ label: d.category, value: d.count, color: colors.secondary }))}
            />
          </Card>
        </>
      ) : null}

      {/* Building distribution */}
      {analytics!.issuesByBuilding.length > 0 ? (
        <>
          <SectionHeader title="Issues by Building" subtitle="Locations generating the most reports." />
          <Card>
            <BarChart
              data={[...analytics!.issuesByBuilding]
                .sort((a, b) => b.count - a.count)
                .slice(0, 8)
                .map((d) => ({ label: d.building, value: d.count, color: colors.tertiary }))}
            />
          </Card>
        </>
      ) : null}

      {/* Monthly trends */}
      {analytics!.monthlyTrends.length > 0 ? (
        <>
          <SectionHeader title="Monthly Submissions" subtitle="Issue volume over the last 6 months." />
          <Card>
            <BarChart
              data={analytics!.monthlyTrends.map((d) => ({
                label: d.month.slice(5),
                value: d.count,
                color: colors.primary,
              }))}
            />
          </Card>
        </>
      ) : null}

      {/* Worker performance */}
      {analytics!.workerPerformance.length > 0 ? (
        <>
          <SectionHeader title="Worker Performance" subtitle="Resolved vs. assigned — completion rates." />
          {[...analytics!.workerPerformance]
            .sort((a, b) => b.resolved - a.resolved)
            .map((w) => {
              const rate = w.total > 0 ? Math.round((w.resolved / w.total) * 100) : 0;
              const rateColor = rate >= 75 ? colors.success : rate >= 40 ? colors.warning : colors.error;
              return (
                <Card key={w.workerId} style={styles.workerCard}>
                  <View style={styles.workerRow}>
                    <View style={[styles.avatar, { backgroundColor: colors.primaryContainer }]}>
                      <Text style={[styles.avatarText, { color: colors.primary }]}>
                        {w.workerName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.workerInfo}>
                      <Text style={[styles.workerName, { color: colors.textPrimary }]}>{w.workerName}</Text>
                      <Text style={[styles.workerMeta, { color: colors.textMuted }]}>
                        {w.resolved}/{w.total} resolved · {w.points} pts
                      </Text>
                      <View style={[styles.rateTrack, { backgroundColor: colors.surfaceHigh }]}>
                        <View style={[styles.rateFill, { width: `${rate}%`, backgroundColor: rateColor }]} />
                      </View>
                    </View>
                    <Text style={[styles.rateText, { color: rateColor }]}>{rate}%</Text>
                  </View>
                </Card>
              );
            })}
        </>
      ) : null}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.md, marginBottom: 2 },
  workerCard: { marginBottom: Spacing.sm },
  workerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontFamily: Fonts.headline, fontSize: TypeScale.title },
  workerInfo: { flex: 1, gap: 4 },
  workerName: { fontFamily: Fonts.title, fontSize: TypeScale.body },
  workerMeta: { fontFamily: Fonts.label, fontSize: TypeScale.label },
  rateTrack: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 2 },
  rateFill: { height: '100%', borderRadius: 3 },
  rateText: { fontFamily: Fonts.headline, fontSize: TypeScale.title, width: 40, textAlign: 'right' },
});
