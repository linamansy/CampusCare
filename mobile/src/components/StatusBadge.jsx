import React from 'react';
import {
  View,
  Text,
  StyleSheet
} from 'react-native';

import { COLORS } from '../theme/colors';

const StatusBadge = ({
  status,
  style = {}
}) => {

  const statusLabel = status
    ? status.replace('_', ' ').toUpperCase()
    : 'PENDING';

  const getBadgeColor = () => {
    switch (statusLabel) {
      case 'OPEN':
      case 'PENDING':
        return COLORS.warning;

      case 'IN PROGRESS':
        return COLORS.primary;

      case 'RESOLVED':
      case 'VERIFIED':
      case 'CLOSED':
        return COLORS.success;

      default:
        return COLORS.danger;
    }
  };

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: getBadgeColor() },
        style
      ]}
    >
      <Text style={styles.badgeText}>
        {statusLabel}
      </Text>
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