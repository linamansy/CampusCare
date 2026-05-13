import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from '../../../src/api/notifications';
import type { NotificationItem } from '../../../src/api/types';
import { AppShell } from '../../../src/components/AppShell';
import { Button } from '../../../src/components/Button';
import { EmptyState } from '../../../src/components/EmptyState';
import { ErrorState } from '../../../src/components/ErrorState';
import { LoadingState } from '../../../src/components/LoadingState';
import { NotificationCard } from '../../../src/components/NotificationCard';

export default function MemberNotificationsScreen() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      setItems(await fetchNotifications());
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <LoadingState label="Loading notifications..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  return (
    <AppShell
      title="Notifications"
      subtitle="Stay on top of assignment changes and resolution updates."
      rightSlot={<Button title="Read All" variant="ghost" onPress={async () => {
        await markAllNotificationsRead();
        await load();
      }} />}
    >
      {items.length === 0 ? (
        <EmptyState title="No notifications" subtitle="New issue updates will appear here." />
      ) : (
        <View>
          {items.map((item) => (
            <NotificationCard
              key={item.id}
              item={item}
              onPress={async () => {
                if (!item.isRead) {
                  await markNotificationRead(item.id);
                  await load();
                }
              }}
            />
          ))}
        </View>
      )}
    </AppShell>
  );
}
