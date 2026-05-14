import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NotificationItem } from '../api/types';
import { Fonts, Spacing, TypeScale, useTheme } from '../theme';
import { Card } from './Card';

export const NotificationCard = ({ item, onPress }: { item: NotificationItem; onPress?: () => void }) => {
  const { colors } = useTheme();

  return (
    <Pressable onPress={onPress}>
      <Card
        style={[
          styles.card,
          item.isRead
            ? { borderColor: colors.surfaceHigh, opacity: 0.75 }
            : { borderColor: colors.primaryContainer },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{item.title}</Text>
          <Text style={[styles.time, { color: colors.textMuted }]}>
            {item.createdAt ? new Date(item.createdAt).toLocaleTimeString() : ''}
          </Text>
        </View>
        <Text style={[styles.message, { color: colors.textSecondary }]}>{item.message}</Text>
      </Card>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
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
    flex: 1,
    marginRight: Spacing.sm,
  },
  time: {
    fontFamily: Fonts.label,
    fontSize: TypeScale.label,
  },
  message: {
    fontFamily: Fonts.body,
    fontSize: TypeScale.bodySmall,
  },
});
