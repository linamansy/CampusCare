import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NotificationItem } from '../api/types';
import { Colors, Fonts, Spacing, TypeScale } from '../theme';
import { Card } from './Card';

export const NotificationCard = ({ item, onPress }: { item: NotificationItem; onPress?: () => void }) => {
  return (
    <Pressable onPress={onPress}>
      <Card style={[styles.card, item.isRead ? styles.read : styles.unread]}>
        <View style={styles.header}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.time}>{item.createdAt ? new Date(item.createdAt).toLocaleTimeString() : ''}</Text>
        </View>
        <Text style={styles.message}>{item.message}</Text>
      </Card>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  unread: {
    borderColor: Colors.primaryContainer,
  },
  read: {
    borderColor: Colors.surfaceHigh,
    opacity: 0.75,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: TypeScale.body,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  time: {
    fontFamily: Fonts.label,
    fontSize: TypeScale.label,
    color: Colors.textMuted,
  },
  message: {
    fontFamily: Fonts.body,
    fontSize: TypeScale.bodySmall,
    color: Colors.textSecondary,
  },
});
