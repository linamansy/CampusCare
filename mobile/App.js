import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from './src/theme/colors';

// Import screens
import SubmitIssueScreen from './src/screens/SubmitIssueScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName="SubmitIssue"
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.card,
          },
          headerTintColor: COLORS.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          cardStyle: {
            backgroundColor: COLORS.background,
          },
        }}
      >
        <Stack.Screen
          name="SubmitIssue"
          component={SubmitIssueScreen}
          options={{
            title: 'Submit Issue',
            headerShown: false, // Using custom ScreenHeader
          }}
        />
        {/* Add other screens here as they are implemented */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}