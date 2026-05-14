import { Redirect } from 'expo-router';
import { useAuth } from '../src/state/auth-context';
import type { UserRole } from '../src/api/types';

const roleToRoute: Record<UserRole, string> = {
  'Community Member': '/(member)/(tabs)/home',
  'Facility Manager': '/(manager)/(tabs)/dashboard',
  Worker: '/(worker)/(tabs)/tasks',
  Admin: '/(admin)/(tabs)/users',
};

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href={roleToRoute[user.role] as any} />;
}
