import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CustomButton from './CustomButton';
import { colors } from '../theme/colors';

const ErrorMessage = ({ message, onRetry }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Something went wrong</Text>
    <Text style={styles.message}>{message}</Text>
    <CustomButton title="Try Again" onPress={onRetry} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  message: {
    color: colors.textSecondary,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default ErrorMessage;
