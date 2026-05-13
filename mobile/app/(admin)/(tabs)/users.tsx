import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import {
  activateUser,
  createUser,
  deactivateUser,
  deleteUser,
  fetchUsers,
  promoteUserRole,
  resetUserPassword,
  verifyUser,
} from '../../../src/api/admin';
import type { UserProfile, UserRole } from '../../../src/api/types';
import { AppShell } from '../../../src/components/AppShell';
import { Button } from '../../../src/components/Button';
import { Card } from '../../../src/components/Card';
import { EmptyState } from '../../../src/components/EmptyState';
import { ErrorState } from '../../../src/components/ErrorState';
import { Input } from '../../../src/components/Input';
import { LoadingState } from '../../../src/components/LoadingState';
import { Colors, Fonts, Spacing, TypeScale } from '../../../src/theme';

const ROLES: UserRole[] = ['Community Member', 'Facility Manager', 'Worker', 'Admin'];

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [draft, setDraft] = useState({ name: '', email: '', password: '', role: 'Worker' as UserRole });
  const [resetPasswords, setResetPasswords] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      setUsers(await fetchUsers());
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!draft.name.trim() || !draft.email.trim() || draft.password.length < 6) {
      setError('Name, email, and a password of at least 6 characters are required.');
      return;
    }

    await createUser(draft);
    setDraft({ name: '', email: '', password: '', role: 'Worker' });
    await load();
  };

  if (loading) {
    return <LoadingState label="Loading users..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  return (
    <AppShell title="User Management" subtitle="Create staff accounts and manage RBAC permissions.">
      <Card style={styles.card}>
        <Text style={styles.title}>Create Account</Text>
        <Input label="Name" value={draft.name} onChangeText={(value) => setDraft((current) => ({ ...current, name: value }))} />
        <Input label="Email" value={draft.email} onChangeText={(value) => setDraft((current) => ({ ...current, email: value }))} autoCapitalize="none" keyboardType="email-address" />
        <Input label="Temporary Password" value={draft.password} onChangeText={(value) => setDraft((current) => ({ ...current, password: value }))} secureTextEntry />
        <Text style={styles.label}>Role</Text>
        <View style={styles.choiceGrid}>
          {ROLES.map((role) => (
            <Button
              key={role}
              title={role}
              variant={draft.role === role ? 'primary' : 'ghost'}
              onPress={() => setDraft((current) => ({ ...current, role }))}
              style={styles.choice}
            />
          ))}
        </View>
        <Button title="Create User" onPress={handleCreate} />
      </Card>

      {users.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        users.map((user) => (
          <Card key={user.id} style={styles.card}>
            <Text style={styles.title}>{user.name}</Text>
            <Text style={styles.meta}>{user.email}</Text>
            <Text style={styles.meta}>Role: {user.role}</Text>
            <Text style={styles.meta}>Active: {user.isActive ? 'Yes' : 'No'} - Verified: {user.isVerified ? 'Yes' : 'No'}</Text>
            <Text style={styles.meta}>Service Points: {user.actsOfServicePoints || 0}</Text>

            <Text style={styles.label}>Change Role</Text>
            <View style={styles.choiceGrid}>
              {ROLES.map((role) => (
                <Button
                  key={role}
                  title={role}
                  variant={user.role === role ? 'secondary' : 'outline'}
                  onPress={async () => {
                    await promoteUserRole(user.id, role);
                    await load();
                  }}
                  disabled={user.role === role}
                  style={styles.choice}
                />
              ))}
            </View>

            <View style={styles.actions}>
              <Button title={user.isActive ? 'Deactivate' : 'Activate'} variant="outline" onPress={async () => {
                if (user.isActive) {
                  await deactivateUser(user.id);
                } else {
                  await activateUser(user.id);
                }
                await load();
              }} style={styles.actionButton} />
              {!user.isVerified ? (
                <Button title="Verify" variant="ghost" onPress={async () => {
                  await verifyUser(user.id);
                  await load();
                }} style={styles.actionButton} />
              ) : null}
            </View>

            <Input
              label="Reset Password"
              value={resetPasswords[user.id] || ''}
              onChangeText={(value) => setResetPasswords((current) => ({ ...current, [user.id]: value }))}
              secureTextEntry
            />
            <View style={styles.actions}>
              <Button title="Reset Password" variant="ghost" onPress={async () => {
                await resetUserPassword(user.id, resetPasswords[user.id] || '');
                setResetPasswords((current) => ({ ...current, [user.id]: '' }));
                await load();
              }} style={styles.actionButton} />
              <Button title="Delete" variant="danger" onPress={() => {
                Alert.alert('Delete user', `Delete ${user.name}?`, [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      await deleteUser(user.id);
                      await load();
                    },
                  },
                ]);
              }} style={styles.actionButton} />
            </View>
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
    fontFamily: Fonts.body,
    fontSize: TypeScale.bodySmall,
    color: Colors.textSecondary,
  },
  label: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    fontFamily: Fonts.labelBold,
    fontSize: TypeScale.label,
    color: Colors.textSecondary,
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
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
