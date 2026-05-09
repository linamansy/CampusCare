import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

const StatusBadge = ({ status, style = {} }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Open':
        return COLORS.warning;
      case 'In_Progress':
        return COLORS.primary;
      case 'Resolved':
        return COLORS.success;
      case 'Verified':
        return COLORS.secondary;
      default:
        return COLORS.subText;
    }
  };

  const getStatusText = (status) => {
    return status.replace('_', ' ');
  };

  return (
    <View style={[styles.badge, { backgroundColor: getStatusColor(status) }, style]}>
      <Text style={styles.badgeText}>{getStatusText(status)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: COLORS.card,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});

export default StatusBadge;