import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import {
  activateUser,
  deactivateUser,
  deleteUser,
  fetchUsers,
  promoteUserRole,
  verifyUser,
} from '../../../src/api/admin';
import type { UserProfile, UserRole } from '../../../src/api/types';
import { AppShell } from '../../../src/components/AppShell';
import { Button } from '../../../src/components/Button';
import { Card } from '../../../src/components/Card';
import { EmptyState } from '../../../src/components/EmptyState';
import { ErrorState } from '../../../src/components/ErrorState';
import { LoadingState } from '../../../src/components/LoadingState';
import { StatusPill } from '../../../src/components/StatusPill';
import { Fonts, Spacing, TypeScale, useTheme } from '../../../src/theme';

const ALL_ROLES: UserRole[] = ['Community Member', 'Worker', 'Facility Manager', 'Admin'];

const ROLE_ICONS: Record<UserRole, keyof typeof Ionicons.glyphMap> = {
  'Community Member': 'person-outline',
  Worker: 'construct-outline',
  'Facility Manager': 'business-outline',
  Admin: 'shield-checkmark-outline',
};

const ROLE_COLORS: Record<UserRole, string> = {
  'Community Member': '#0EA5E9',
  Worker: '#7C3AED',
  'Facility Manager': '#059669',
  Admin: '#EF4444',
};

type Filter = 'All' | UserRole;
const FILTERS: Filter[] = ['All', 'Community Member', 'Worker', 'Facility Manager', 'Admin'];

export default function AdminUsersScreen() {
  const { colors } = useTheme();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('All');
  const [rolePickerUser, setRolePickerUser] = useState<UserProfile | null>(null);
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  const load = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      setUsers(await fetchUsers());
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const run = async (userId: number, fn: () => Promise<unknown>) => {
    setSubmittingId(userId);
    try {
      await fn();
      await load(true);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Action failed');
    } finally {
      setSubmittingId(null);
    }
  };

  const confirmDelete = (user: UserProfile) => {
    Alert.alert(
      'Delete User',
      `Permanently delete ${user.name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => run(user.id, () => deleteUser(user.id)) },
      ]
    );
  };

  const filtered = filter === 'All' ? users : users.filter((u) => u.role === filter);

  if (loading) return <LoadingState label="Loading users..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <Modal
        visible={rolePickerUser !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setRolePickerUser(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setRolePickerUser(null)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surfaceLowest, borderColor: colors.surfaceHigh }]}>
            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Change Role</Text>
            {rolePickerUser ? (
              <Text style={[styles.sheetSub, { color: colors.textMuted }]}>{rolePickerUser.name}</Text>
            ) : null}
            <View style={styles.roleGrid}>
              {ALL_ROLES.map((r) => {
                const isCurrent = rolePickerUser?.role === r;
                const rc = ROLE_COLORS[r];
                return (
                  <Pressable
                    key={r}
                    style={[
                      styles.roleOption,
                      { borderColor: isCurrent ? rc : colors.surfaceHigh, backgroundColor: isCurrent ? rc + '18' : colors.surface },
                    ]}
                    onPress={() => {
                      const u = rolePickerUser!;
                      setRolePickerUser(null);
                      run(u.id, () => promoteUserRole(u.id, r));
                    }}
                  >
                    <Ionicons name={ROLE_ICONS[r]} size={20} color={rc} />
                    <Text style={[styles.roleOptionText, { color: isCurrent ? rc : colors.textPrimary }]}>{r}</Text>
                    {isCurrent ? <Ionicons name="checkmark-circle" size={16} color={rc} /> : null}
                  </Pressable>
                );
              })}
            </View>
            <Button title="Cancel" variant="ghost" onPress={() => setRolePickerUser(null)} />
          </Pressable>
        </Pressable>
      </Modal>

      <AppShell
        title="User Management"
        subtitle={`${users.length} total users registered.`}
        icon="shield-checkmark"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={colors.primary} />}
      >
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filter === f ? colors.primary : colors.surfaceLowest,
                  borderColor: filter === f ? colors.primary : colors.surfaceHigh,
                },
              ]}
            >
              <Text style={[styles.filterText, { color: filter === f ? colors.onPrimary : colors.textSecondary }]}>
                {f === 'Community Member' ? 'Member' : f === 'Facility Manager' ? 'Manager' : f}
              </Text>
            </Pressable>
          ))}
        </View>

        {filtered.length === 0 ? (
          <EmptyState title="No users" subtitle={`No users with role "${filter}".`} />
        ) : (
          filtered.map((user) => {
            const isBusy = submittingId === user.id;
            const rc = ROLE_COLORS[user.role as UserRole] ?? colors.primary;
            return (
              <Card key={user.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.avatar, { backgroundColor: rc + '22' }]}>
                    <Text style={[styles.avatarText, { color: rc }]}>{user.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: colors.textPrimary }]}>{user.name}</Text>
                    <Text style={[styles.userEmail, { color: colors.textMuted }]}>{user.email}</Text>
                    <View style={styles.badgeRow}>
                      <View style={[styles.roleBadge, { backgroundColor: rc + '18', borderColor: rc }]}>
                        <Ionicons name={ROLE_ICONS[user.role as UserRole] ?? 'person'} size={11} color={rc} />
                        <Text style={[styles.roleBadgeText, { color: rc }]}>{user.role}</Text>
                      </View>
                      <StatusPill label={user.isActive ? 'Active' : 'Inactive'} tone={user.isActive ? 'success' : 'error'} />
                      {!user.isVerified ? <StatusPill label="Unverified" tone="warning" /> : null}
                    </View>
                  </View>
                </View>

                <View style={styles.actions}>
                  <Button title="Change Role" variant="outline" onPress={() => setRolePickerUser(user)} disabled={isBusy} style={styles.btn} />
                  <Button
                    title={user.isActive ? 'Deactivate' : 'Activate'}
                    variant={user.isActive ? 'ghost' : 'success'}
                    onPress={() => run(user.id, () => user.isActive ? deactivateUser(user.id) : activateUser(user.id))}
                    disabled={isBusy}
                    style={styles.btn}
                  />
                  {!user.isVerified ? (
                    <Button title="Verify" variant="secondary" onPress={() => run(user.id, () => verifyUser(user.id))} disabled={isBusy} style={styles.btn} />
                  ) : null}
                  <Button title="Delete" variant="danger" onPress={() => confirmDelete(user)} disabled={isBusy} style={styles.btn} />
                </View>
              </Card>
            );
          })
        )}
      </AppShell>
    </>
  );
}

const styles = StyleSheet.create({
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  filterChip: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  filterText: { fontFamily: Fonts.label, fontSize: TypeScale.label },
  card: { marginBottom: Spacing.md },
  cardHeader: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontFamily: Fonts.headline, fontSize: TypeScale.title },
  userInfo: { flex: 1, gap: 4 },
  userName: { fontFamily: Fonts.title, fontSize: TypeScale.body },
  userEmail: { fontFamily: Fonts.label, fontSize: TypeScale.label },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  roleBadgeText: { fontFamily: Fonts.label, fontSize: 10 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
  btn: { flex: 1, minWidth: 80 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, padding: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.md },
  sheetTitle: { fontFamily: Fonts.headline, fontSize: TypeScale.title },
  sheetSub: { fontFamily: Fonts.body, fontSize: TypeScale.bodySmall, marginTop: -Spacing.sm },
  roleGrid: { gap: Spacing.sm },
  roleOption: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: 14, borderWidth: 1.5 },
  roleOptionText: { flex: 1, fontFamily: Fonts.title, fontSize: TypeScale.body },
});
