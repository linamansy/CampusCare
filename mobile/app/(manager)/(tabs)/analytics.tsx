import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fetchManagerAnalytics, type ManagerAnalyticsResponse, type WorkerPerformance } from '../../../src/api/manager';
import { ErrorState } from '../../../src/components/ErrorState';
import { LoadingState } from '../../../src/components/LoadingState';
import { Fonts, Spacing, TypeScale, useTheme } from '../../../src/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Colour maps ─────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  Low: '#64748B', Normal: '#0EA5E9', High: '#F59E0B', Urgent: '#EF4444',
};
const STATUS_COLORS: Record<string, string> = {
  'Submitted/Pending': '#F59E0B', Assigned: '#0EA5E9', 'In Progress': '#7C3AED',
  'Under Review': '#0891B2', Resolved: '#059669', Rejected: '#EF4444', Completed: '#10B981',
};
const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Overview: 'grid-outline', Issues: 'alert-circle-outline',
  Workers: 'people-outline', Trends: 'trending-up-outline',
};

// ─── Animated number counter ──────────────────────────────────────────────────

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    let current = 0;
    const steps = Math.max(30, duration / 16);
    const increment = target / steps;
    const timer = setInterval(() => {
      current = Math.min(current + increment, target);
      setValue(Math.round(current));
      if (current >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return value;
}

// ─── Animated bar ─────────────────────────────────────────────────────────────

function AnimatedBar({
  label, value, max, color, delay = 0, onPress, active,
}: {
  label: string; value: number; max: number; color: string;
  delay?: number; onPress?: () => void; active?: boolean;
}) {
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: max > 0 ? value / max : 0,
      duration: 700,
      delay,
      useNativeDriver: false,
    }).start();
  }, [value, max]);

  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Pressable onPress={onPress} style={[
      barS.row,
      active && { backgroundColor: color + '12', borderRadius: 10, marginHorizontal: -6, paddingHorizontal: 6 },
    ]}>
      <Text style={[barS.label, { color: active ? color : colors.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
      <View style={[barS.track, { backgroundColor: colors.surfaceHigh }]}>
        <Animated.View style={[barS.fill, { width, backgroundColor: color }]} />
      </View>
      <Text style={[barS.value, { color: active ? color : colors.textPrimary }]}>{value}</Text>
    </Pressable>
  );
}

const barS = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  label: { width: 88, fontFamily: Fonts.label, fontSize: 11 },
  track: { flex: 1, height: 20, borderRadius: 10, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 10 },
  value: { width: 28, fontFamily: Fonts.title, fontSize: TypeScale.label, textAlign: 'right' },
});

// ─── Glass card ───────────────────────────────────────────────────────────────

function GlassCard({ children, style }: { children: React.ReactNode; style?: object }) {
  const { colors, isDark } = useTheme();
  return (
    <View style={[
      glassS.card,
      {
        backgroundColor: isDark ? 'rgba(30,41,59,0.8)' : 'rgba(255,255,255,0.9)',
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,86,219,0.1)',
      },
      style,
    ]}>
      {children}
    </View>
  );
}

const glassS = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: Spacing.md,
    shadowColor: '#1A56DB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
});

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ title, accent }: { title: string; accent: string }) {
  const { colors } = useTheme();
  return (
    <View style={secS.row}>
      <View style={[secS.accent, { backgroundColor: accent }]} />
      <Text style={[secS.text, { color: colors.textSecondary }]}>{title}</Text>
    </View>
  );
}

const secS = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, marginTop: 4 },
  accent: { width: 3, height: 14, borderRadius: 2 },
  text: { fontFamily: Fonts.labelBold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
});

// ─── KPI mini card ────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon, color }: { label: string; value: number; icon: keyof typeof Ionicons.glyphMap; color: string }) {
  const { colors } = useTheme();
  const animated = useCountUp(value);
  return (
    <GlassCard style={kpiS.card}>
      <View style={[kpiS.icon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[kpiS.value, { color: colors.textPrimary }]}>{animated}</Text>
      <Text style={[kpiS.label, { color: colors.textMuted }]}>{label}</Text>
    </GlassCard>
  );
}

const kpiS = StyleSheet.create({
  card: { flex: 1, gap: 6, padding: 14 },
  icon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  value: { fontFamily: Fonts.display, fontSize: 28 },
  label: { fontFamily: Fonts.label, fontSize: 11 },
});

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = ['Overview', 'Issues', 'Workers', 'Trends'] as const;
type Tab = (typeof TABS)[number];

// ─── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab({ data }: { data: ManagerAnalyticsResponse }) {
  const { colors, isDark } = useTheme();
  const s = data.summary;
  const rate = s.totalIssues > 0 ? Math.round((s.resolvedIssues / s.totalIssues) * 100) : 0;
  const animatedRate = useCountUp(rate);

  return (
    <View style={{ gap: Spacing.md }}>
      {/* Hero resolution card */}
      <LinearGradient
        colors={isDark ? ['#1e3a5f', '#2d1b69'] : ['#1A56DB', '#7C3AED']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={ovS.hero}
      >
        <View style={ovS.heroLeft}>
          <Text style={ovS.heroLabel}>Resolution Rate</Text>
          <Text style={ovS.heroRate}>{animatedRate}%</Text>
          <Text style={ovS.heroSub}>{s.resolvedIssues} of {s.totalIssues} issues resolved</Text>
        </View>
        <View style={ovS.heroRight}>
          <View style={[ovS.ring, { borderColor: 'rgba(255,255,255,0.3)' }]}>
            <View style={[ovS.ringInner, { borderColor: rate > 50 ? '#10B981' : '#F59E0B' }]} />
            <Text style={ovS.ringText}>{animatedRate}</Text>
            <Text style={ovS.ringPct}>%</Text>
          </View>
        </View>
      </LinearGradient>

      {/* KPI grid */}
      <View style={ovS.kpiRow}>
        <KpiCard label="Total Issues" value={s.totalIssues} icon="list" color={colors.primary} />
        <KpiCard label="Unassigned" value={s.unassignedIssues} icon="person-add" color={colors.warning} />
      </View>
      <View style={ovS.kpiRow}>
        <KpiCard label="Under Review" value={s.underReviewIssues} icon="eye" color={colors.secondary} />
        <KpiCard label="Active Workers" value={s.activeWorkers} icon="people" color={colors.tertiary} />
      </View>
      <View style={ovS.kpiRow}>
        <KpiCard label="Rejected" value={s.rejectedIssues} icon="close-circle" color={colors.error} />
        <KpiCard label="Reworks" value={s.reworkCount} icon="refresh-circle" color='#F59E0B' />
      </View>

      {/* Stat list */}
      <GlassCard>
        <SectionLabel title="Performance" accent={colors.primary} />
        {[
          { label: 'Avg. Resolution Time', value: `${s.avgResolutionDays} days`, icon: 'time-outline' as const, color: colors.primary },
          { label: 'Assigned Issues', value: `${s.assignedIssues}`, icon: 'checkmark-circle-outline' as const, color: colors.success },
          { label: 'Open Issues', value: `${s.totalIssues - s.resolvedIssues - s.rejectedIssues}`, icon: 'alert-circle-outline' as const, color: colors.warning },
        ].map((item) => (
          <View key={item.label} style={[ovS.statRow, { borderBottomColor: colors.surfaceHigh }]}>
            <View style={[ovS.statIcon, { backgroundColor: item.color + '18' }]}>
              <Ionicons name={item.icon} size={16} color={item.color} />
            </View>
            <Text style={[ovS.statLabel, { color: colors.textSecondary }]}>{item.label}</Text>
            <Text style={[ovS.statValue, { color: colors.textPrimary }]}>{item.value}</Text>
          </View>
        ))}
      </GlassCard>
    </View>
  );
}

const ovS = StyleSheet.create({
  hero: { borderRadius: 24, padding: 24, flexDirection: 'row', alignItems: 'center', minHeight: 140 },
  heroLeft: { flex: 1, gap: 6 },
  heroLabel: { fontFamily: Fonts.label, fontSize: 12, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 },
  heroRate: { fontFamily: Fonts.display, fontSize: 52, color: '#FFFFFF', lineHeight: 58 },
  heroSub: { fontFamily: Fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  heroRight: { justifyContent: 'center', alignItems: 'center' },
  ring: { width: 90, height: 90, borderRadius: 45, borderWidth: 8, justifyContent: 'center', alignItems: 'center' },
  ringInner: { position: 'absolute', width: 74, height: 74, borderRadius: 37, borderWidth: 8 },
  ringText: { fontFamily: Fonts.headline, fontSize: 22, color: '#FFFFFF' },
  ringPct: { fontFamily: Fonts.label, fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: -4 },
  kpiRow: { flexDirection: 'row', gap: Spacing.sm },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth },
  statIcon: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  statLabel: { flex: 1, fontFamily: Fonts.body, fontSize: TypeScale.bodySmall },
  statValue: { fontFamily: Fonts.title, fontSize: TypeScale.body },
});

// ─── Issues tab ───────────────────────────────────────────────────────────────

function IssuesTab({ data }: { data: ManagerAnalyticsResponse }) {
  const { colors } = useTheme();
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [activePriority, setActivePriority] = useState<string | null>(null);
  const maxStatus = Math.max(...data.issuesByStatus.map((d) => d.count), 1);
  const maxPriority = Math.max(...data.issuesByPriority.map((d) => d.count), 1);
  const maxCategory = Math.max(...data.issuesByCategory.map((d) => d.count), 1);
  const maxBuilding = Math.max(...data.issuesByBuilding.map((d) => d.count), 1);

  return (
    <View style={{ gap: Spacing.md }}>
      <GlassCard>
        <SectionLabel title="By Status" accent={colors.secondary} />
        {[...data.issuesByStatus].sort((a, b) => b.count - a.count).map((d, i) => (
          <AnimatedBar
            key={d.status} label={d.status.replace('Submitted/', '')}
            value={d.count} max={maxStatus}
            color={STATUS_COLORS[d.status] ?? colors.primary}
            delay={i * 60}
            onPress={() => setActiveStatus(activeStatus === d.status ? null : d.status)}
            active={activeStatus === d.status}
          />
        ))}
      </GlassCard>

      <GlassCard>
        <SectionLabel title="By Priority" accent='#F59E0B' />
        {[...data.issuesByPriority].sort((a, b) => b.count - a.count).map((d, i) => (
          <AnimatedBar
            key={d.priority} label={d.priority}
            value={d.count} max={maxPriority}
            color={PRIORITY_COLORS[d.priority] ?? colors.primary}
            delay={i * 60}
            onPress={() => setActivePriority(activePriority === d.priority ? null : d.priority)}
            active={activePriority === d.priority}
          />
        ))}
      </GlassCard>

      {data.issuesByCategory.length > 0 ? (
        <GlassCard>
          <SectionLabel title="By Category" accent={colors.tertiary} />
          {[...data.issuesByCategory].sort((a, b) => b.count - a.count).slice(0, 8).map((d, i) => (
            <AnimatedBar key={d.category} label={d.category} value={d.count} max={maxCategory}
              color={colors.tertiary} delay={i * 60} />
          ))}
        </GlassCard>
      ) : null}

      {data.issuesByBuilding.length > 0 ? (
        <GlassCard>
          <SectionLabel title="By Building" accent='#0891B2' />
          {[...data.issuesByBuilding].sort((a, b) => b.count - a.count).slice(0, 8).map((d, i) => (
            <AnimatedBar key={d.building} label={d.building} value={d.count} max={maxBuilding}
              color='#0891B2' delay={i * 60} />
          ))}
        </GlassCard>
      ) : null}
    </View>
  );
}

// ─── Workers tab ──────────────────────────────────────────────────────────────

function WorkerBar({ worker, delay }: { worker: WorkerPerformance; delay: number }) {
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;
  const rate = worker.total > 0 ? worker.resolved / worker.total : 0;
  const rateColor = rate >= 0.75 ? colors.success : rate >= 0.4 ? colors.warning : colors.error;
  const animPoints = useCountUp(worker.points, 600);

  useEffect(() => {
    Animated.timing(anim, { toValue: rate, duration: 800, delay, useNativeDriver: false }).start();
  }, [rate]);

  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <GlassCard style={{ marginBottom: Spacing.sm }}>
      <View style={wkS.row}>
        <LinearGradient colors={[colors.primary, colors.secondary]} style={wkS.avatar}>
          <Text style={wkS.avatarText}>{worker.workerName.charAt(0).toUpperCase()}</Text>
        </LinearGradient>
        <View style={wkS.info}>
          <View style={wkS.nameRow}>
            <Text style={[wkS.name, { color: colors.textPrimary }]}>{worker.workerName}</Text>
            <Text style={[wkS.pts, { color: colors.primary }]}>{animPoints} pts</Text>
          </View>
          <Text style={[wkS.meta, { color: colors.textMuted }]}>
            {worker.resolved} resolved / {worker.total} assigned
          </Text>
          <View style={[wkS.track, { backgroundColor: colors.surfaceHigh }]}>
            <Animated.View style={[wkS.fill, { width, backgroundColor: rateColor }]} />
          </View>
        </View>
        <Text style={[wkS.rate, { color: rateColor }]}>{Math.round(rate * 100)}%</Text>
      </View>
    </GlassCard>
  );
}

const wkS = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontFamily: Fonts.headline, fontSize: TypeScale.title, color: '#fff' },
  info: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontFamily: Fonts.title, fontSize: TypeScale.body },
  pts: { fontFamily: Fonts.title, fontSize: TypeScale.label },
  meta: { fontFamily: Fonts.label, fontSize: TypeScale.label },
  track: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 2 },
  fill: { height: '100%', borderRadius: 3 },
  rate: { fontFamily: Fonts.headline, fontSize: TypeScale.title, width: 44, textAlign: 'right' },
});

function WorkersTab({ data }: { data: ManagerAnalyticsResponse }) {
  const { colors } = useTheme();
  const sorted = [...data.workerPerformance].sort((a, b) => b.resolved - a.resolved);

  if (sorted.length === 0) {
    return (
      <GlassCard>
        <Text style={{ color: colors.textMuted, fontFamily: Fonts.body, fontSize: TypeScale.bodySmall, textAlign: 'center', paddingVertical: Spacing.md }}>
          No worker data yet. Issues need to be assigned and resolved.
        </Text>
      </GlassCard>
    );
  }

  return (
    <View style={{ gap: 0 }}>
      {sorted.map((w, i) => <WorkerBar key={w.workerId} worker={w} delay={i * 100} />)}
    </View>
  );
}

// ─── Trends tab ───────────────────────────────────────────────────────────────

function TrendsTab({ data }: { data: ManagerAnalyticsResponse }) {
  const { colors, isDark } = useTheme();
  const trends = data.monthlyTrends;
  const max = Math.max(...trends.map((d) => d.count), 1);

  if (trends.length === 0) {
    return (
      <GlassCard>
        <Text style={{ color: colors.textMuted, fontFamily: Fonts.body, textAlign: 'center', paddingVertical: Spacing.md }}>
          No trend data available yet.
        </Text>
      </GlassCard>
    );
  }

  return (
    <View style={{ gap: Spacing.md }}>
      <GlassCard>
        <SectionLabel title="Monthly Submissions" accent={colors.primary} />
        <View style={trS.chartArea}>
          {trends.map((d, i) => {
            const heightPct = d.count / max;
            const anim = useRef(new Animated.Value(0)).current;
            useEffect(() => {
              Animated.timing(anim, { toValue: heightPct, duration: 700, delay: i * 80, useNativeDriver: false }).start();
            }, [heightPct]);
            const barHeight = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 120] });
            return (
              <View key={d.month} style={trS.barCol}>
                <Text style={[trS.barVal, { color: colors.textSecondary }]}>{d.count}</Text>
                <View style={[trS.barTrack, { backgroundColor: colors.surfaceHigh }]}>
                  <Animated.View style={[trS.barFill, { height: barHeight, backgroundColor: colors.primary }]} />
                </View>
                <Text style={[trS.barLabel, { color: colors.textMuted }]}>{d.month.slice(5)}</Text>
              </View>
            );
          })}
        </View>
      </GlassCard>

      <GlassCard>
        <SectionLabel title="Summary" accent={colors.tertiary} />
        <View style={trS.summaryRow}>
          <View style={[trS.summaryBox, { backgroundColor: colors.primaryContainer }]}>
            <Text style={[trS.summaryNum, { color: colors.primary }]}>{trends.reduce((s, d) => s + d.count, 0)}</Text>
            <Text style={[trS.summaryLabel, { color: colors.primary }]}>Total (6 mo.)</Text>
          </View>
          <View style={[trS.summaryBox, { backgroundColor: colors.successContainer ?? '#D1FAE5' }]}>
            <Text style={[trS.summaryNum, { color: colors.success }]}>{Math.round(trends.reduce((s, d) => s + d.count, 0) / trends.length)}</Text>
            <Text style={[trS.summaryLabel, { color: colors.success }]}>Avg / Month</Text>
          </View>
          <View style={[trS.summaryBox, { backgroundColor: colors.secondaryContainer }]}>
            <Text style={[trS.summaryNum, { color: colors.secondary }]}>{Math.max(...trends.map((d) => d.count))}</Text>
            <Text style={[trS.summaryLabel, { color: colors.secondary }]}>Peak Month</Text>
          </View>
        </View>
      </GlassCard>
    </View>
  );
}

const trS = StyleSheet.create({
  chartArea: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 160, paddingTop: 16 },
  barCol: { flex: 1, alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' },
  barVal: { fontFamily: Fonts.label, fontSize: 10 },
  barTrack: { width: '100%', height: 120, borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 6 },
  barLabel: { fontFamily: Fonts.label, fontSize: 10 },
  summaryRow: { flexDirection: 'row', gap: Spacing.sm },
  summaryBox: { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center', gap: 4 },
  summaryNum: { fontFamily: Fonts.headline, fontSize: TypeScale.headline },
  summaryLabel: { fontFamily: Fonts.label, fontSize: 10, textAlign: 'center' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ManagerAnalyticsScreen() {
  const { colors, isDark } = useTheme();
  const [analytics, setAnalytics] = useState<ManagerAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const tabIndicator = useRef(new Animated.Value(0)).current;

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

  const switchTab = (tab: Tab) => {
    const idx = TABS.indexOf(tab);
    Animated.spring(tabIndicator, { toValue: idx, useNativeDriver: true, tension: 60, friction: 10 }).start();
    setActiveTab(tab);
  };

  if (loading) return <LoadingState label="Loading analytics..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const tabWidth = 82;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={isDark ? [colors.surface, colors.surfaceLow] : [colors.primary, '#2563EB']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={s.header}
      >
        <View style={s.headerIcon}>
          <Ionicons name="bar-chart" size={22} color={isDark ? colors.primary : '#fff'} />
        </View>
        <View>
          <Text style={[s.headerBrand, { color: isDark ? colors.primary : 'rgba(255,255,255,0.75)' }]}>CampusCare</Text>
          <Text style={[s.headerTitle, { color: isDark ? colors.textPrimary : '#fff' }]}>Analytics</Text>
          <Text style={[s.headerSub, { color: isDark ? colors.textSecondary : 'rgba(255,255,255,0.75)' }]}>
            Live campus operations data
          </Text>
        </View>
      </LinearGradient>

      {/* Tab bar */}
      <View style={[s.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceHigh }]}>
        <Animated.View style={[
          s.tabIndicator,
          { backgroundColor: colors.primaryContainer, width: tabWidth - 8 },
          { transform: [{ translateX: tabIndicator.interpolate({ inputRange: [0, 1, 2, 3], outputRange: TABS.map((_, i) => i * tabWidth + 4) }) }] },
        ]} />
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <Pressable key={tab} style={[s.tab, { width: tabWidth }]} onPress={() => switchTab(tab)}>
              <Ionicons name={TAB_ICONS[tab]} size={16} color={isActive ? colors.primary : colors.textMuted} />
              <Text style={[s.tabText, { color: isActive ? colors.primary : colors.textMuted }]}>{tab}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={colors.primary} />}
      >
        {activeTab === 'Overview' && <OverviewTab data={analytics!} />}
        {activeTab === 'Issues'   && <IssuesTab   data={analytics!} />}
        {activeTab === 'Workers'  && <WorkersTab  data={analytics!} />}
        {activeTab === 'Trends'   && <TrendsTab   data={analytics!} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.marginMobile, paddingTop: Spacing.sm, paddingBottom: Spacing.lg,
  },
  headerIcon: {
    width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerBrand: { fontFamily: Fonts.display, fontSize: 24 },
  headerTitle: { fontFamily: Fonts.headline, fontSize: TypeScale.headline, marginTop: 2 },
  headerSub: { fontFamily: Fonts.body, fontSize: TypeScale.bodySmall, marginTop: 2 },
  tabBar: {
    flexDirection: 'row', borderBottomWidth: 1,
    paddingVertical: 8, paddingHorizontal: Spacing.sm, position: 'relative',
  },
  tabIndicator: {
    position: 'absolute', height: 36, borderRadius: 10, top: 8,
  },
  tab: {
    alignItems: 'center', justifyContent: 'center', gap: 3,
    paddingVertical: 6, zIndex: 1, height: 36,
  },
  tabText: { fontFamily: Fonts.label, fontSize: 10 },
  content: { padding: Spacing.marginMobile, paddingBottom: Spacing.xl * 2, gap: Spacing.md },
});
