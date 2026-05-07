import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/src/theme/colors';
import type { WorkerStackParamList } from '@/src/navigation/types';
import AssignedIssuesScreen from '@/src/screens/AssignedIssuesScreen';
import IssueWorkScreen from '@/src/screens/IssueWorkScreen';

const Stack = createNativeStackNavigator<WorkerStackParamList>();

export function AppNavigator() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: Colors.card,
          contentStyle: {
            backgroundColor: Colors.background,
          },
        }}>
        <Stack.Screen
          name="AssignedIssues"
          component={AssignedIssuesScreen}
          options={{ title: 'Assigned Issues' }}
        />
        <Stack.Screen
          name="IssueWork"
          component={IssueWorkScreen}
          options={{ title: 'Issue Work' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
