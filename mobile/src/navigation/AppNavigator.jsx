import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import IssueDetailScreen from '../screens/IssueDetailScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="IssueDetailScreen"
        component={IssueDetailScreen}
        options={{ title: 'Issue Details' }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
