import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { activateUser, deactivateUser, fetchUsers, promoteUserRole, verifyUser } from '../../../src/api/admin';
import type { UserProfile } from '../../../src/api/types';
import { AppShell } from '../../../src/components/AppShell';
import { Button } from '../../../src/components/Button';
import { Card } from '../../../src/components/Card';
import { EmptyState } from '../../../src/components/EmptyState';
import { ErrorState } from '../../../src/components/ErrorState';
import { LoadingState } from '../../../src/components/LoadingState';
import { Fonts, Spacing, TypeScale, useTheme } from '../../../src/theme';

export default function AdminUsersScreen() {
  const { colors } = useTheme();
  const [users, setUsers] = useState<UserProfile[]>([]);
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

  if (loading) {
    return <LoadingState label="Loading users..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  return (
    <AppShell title="User Management" subtitle="Admin actions backed by the verified admin API.">
      {users.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        users.map((user) => (
          <Card key={user.id} style={styles.card}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{user.name}</Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>{user.email}</Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>Role: {user.role}</Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>Active: {user.isActive ? 'Yes' : 'No'} • Verified: {user.isVerified ? 'Yes' : 'No'}</Text>
            <Button title={user.isActive ? 'Deactivate' : 'Activate'} variant="outline" onPress={async () => {
              if (user.isActive) {
                await deactivateUser(user.id);
              } else {
                await activateUser(user.id);
              }
              await load();
            }} style={styles.action} />
            {!user.isVerified ? (
              <Button title="Verify User" variant="ghost" onPress={async () => {
                await verifyUser(user.id);
                await load();
              }} style={styles.action} />
            ) : null}
            {user.role !== 'Admin' ? (
              <Button title="Promote to Manager" onPress={async () => {
                await promoteUserRole(user.id, 'Facility Manager');
                await load();
              }} style={styles.action} />
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
  },
  meta: {
    marginTop: Spacing.sm,
    fontFamily: Fonts.body,
    fontSize: TypeScale.bodySmall,
  },
  action: {
    marginTop: Spacing.md,
  },
});
