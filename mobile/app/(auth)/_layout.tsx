import { Redirect, Stack } from 'expo-router';
import { LoadingState } from '../../src/components/LoadingState';
import { useAuth } from '../../src/state/auth-context';

export default function AuthLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingState label="Loading session..." />;
  }

  if (user) {
    return <Redirect href="/" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
