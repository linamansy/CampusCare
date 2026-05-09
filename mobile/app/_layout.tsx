import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

export default function RootLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2563EB',
          },
          headerTintColor: '#FFFFFF',
          contentStyle: {
            backgroundColor: '#F8FAFC',
          },
        }}
      />
      <StatusBar style="auto" />
    </>
  );
}
