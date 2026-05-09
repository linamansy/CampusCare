import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator
} from 'react-native';

import { COLORS } from '../theme/colors';

const CustomButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  style = {},
  textStyle = {}
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled || loading}
      style={[
        styles.button,
        disabled && styles.disabled,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color="#FFFFFF"
          size="small"
        />
      ) : (
        <Text style={[styles.buttonText, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },

  disabled: {
    backgroundColor: COLORS.subText,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CustomButton;