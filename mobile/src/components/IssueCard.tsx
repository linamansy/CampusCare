import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Issue } from '../api/types';
import { Colors, Fonts, Spacing, TypeScale } from '../theme';
import { Card } from './Card';
import { StatusPill } from './StatusPill';

interface IssueCardProps {
  issue: Issue;
  onPress?: () => void;
}

export const IssueCard = ({ issue, onPress }: IssueCardProps) => {
  const statusLabel = issue.status?.toUpperCase() || 'PENDING';
  const tone = issue.priority === 'High' || issue.priority === 'Urgent' ? 'error' : 'primary';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <StatusPill label={issue.priority?.toUpperCase() || 'NORMAL'} tone={tone} />
          <Text style={styles.dateText}>{issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : ''}</Text>
        </View>
        <Text style={styles.title}>{issue.title}</Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {issue.description}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.location}>{issue.location}</Text>
          <StatusPill label={statusLabel} tone="secondary" />
        </View>
      </Card>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  card: {
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  dateText: {
    fontFamily: Fonts.label,
    fontSize: TypeScale.label,
    color: Colors.textMuted,
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: TypeScale.title,
    color: Colors.textPrimary,
  },
  subtitle: {
    marginTop: Spacing.xs,
    fontFamily: Fonts.body,
    fontSize: TypeScale.bodySmall,
    color: Colors.textSecondary,
  },
  footer: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  location: {
    flex: 1,
    fontFamily: Fonts.label,
    fontSize: TypeScale.bodySmall,
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
  },
});
