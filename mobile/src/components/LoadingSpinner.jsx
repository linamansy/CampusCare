import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet
} from 'react-native';

import { COLORS } from '../theme/colors';

const LoadingSpinner = ({
  size = 'large',
  color = COLORS.primary,
  message = 'Loading...',
  style = {}
}) => {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator
        size={size}
        color={color}
      />

      <Text style={styles.message}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.background,
  },

  message: {
    marginTop: 16,
    color: COLORS.subText,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default LoadingSpinner;


