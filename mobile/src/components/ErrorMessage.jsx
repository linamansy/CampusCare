import React from 'react';
import {
  View,
  Text,
  StyleSheet
} from 'react-native';

import CustomButton from './CustomButton';
import { COLORS } from '../theme/colors';

const ErrorMessage = ({
  message,
  onRetry,
  style = {}
}) => (
  <View style={[styles.container, style]}>
    <Text style={styles.icon}>⚠️</Text>

    <Text style={styles.title}>
      Something went wrong
    </Text>

    <Text style={styles.message}>
      {message}
    </Text>

    {onRetry && (
      <CustomButton
        title="Try Again"
        onPress={onRetry}
      />
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.background,
  },

  icon: {
    fontSize: 48,
    marginBottom: 16,
  },

  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },

  message: {
    color: COLORS.subText,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default ErrorMessage;