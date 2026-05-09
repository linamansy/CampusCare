import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const CustomButton = ({ title, onPress, disabled }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.button, disabled && styles.disabled]}
    activeOpacity={0.8}
    disabled={disabled}
  >
    <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  disabled: {
    backgroundColor: colors.border,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CustomButton;