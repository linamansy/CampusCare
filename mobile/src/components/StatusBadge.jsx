import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const StatusBadge = ({ status }) => {
  const normalizedStatus = status ? status.toLowerCase() : 'pending';
  
  let backgroundColor = colors.border;
  let textColor = colors.textSecondary;

  if (normalizedStatus.includes('pending') || normalizedStatus.includes('submitted')) {
    backgroundColor = '#F1F5F9';
    textColor = '#64748B';
  } else if (normalizedStatus.includes('progress')) {
    backgroundColor = '#E0F2FE';
    textColor = '#0369A1';
  } else if (normalizedStatus.includes('resolved') || normalizedStatus.includes('completed')) {
    backgroundColor = '#DCFCE7';
    textColor = '#15803D';
  } else if (normalizedStatus.includes('rejected') || normalizedStatus.includes('canceled')) {
    backgroundColor = '#FEE2E2';
    textColor = '#B91C1C';
  }

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.badgeText, { color: textColor }]}>{status?.toUpperCase() || 'PENDING'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default StatusBadge;

