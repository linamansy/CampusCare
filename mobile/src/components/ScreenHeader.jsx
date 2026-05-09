import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const ScreenHeader = ({ title, subtitle }) => (
  <View style={styles.headerContainer}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.subtitle}>{subtitle}</Text>
  </View>
);

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: 20,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ScreenHeader;
