import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const StatusBadge = ({ status }) => {
  const statusLabel = status ? status.toUpperCase() : 'PENDING';
  const badgeColor =
    statusLabel === 'OPEN' || statusLabel === 'PENDING'
      ? colors.warning
      : statusLabel === 'RESOLVED' || statusLabel === 'CLOSED'
      ? colors.success
      : colors.danger;

  return (
    <View style={[styles.badge, { backgroundColor: badgeColor }]}> 
      <Text style={styles.badgeText}>{statusLabel}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default StatusBadge;
