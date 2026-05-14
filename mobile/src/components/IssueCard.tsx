import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Issue } from '../api/types';
import { Fonts, Spacing, TypeScale, useTheme } from '../theme';
import { Card } from './Card';
import { StatusPill, priorityTone, statusTone } from './StatusPill';

interface IssueCardProps {
  issue: Issue;
  onPress?: () => void;
}

const ACCENT_COLORS: Record<string, string> = {
  error:     '#DC2626',
  warning:   '#D97706',
  primary:   '#1A56DB',
  secondary: '#7C3AED',
  tertiary:  '#0891B2',
  success:   '#059669',
  muted:     '#94A3B8',
};

export const IssueCard = ({ issue, onPress }: IssueCardProps) => {
  const { colors } = useTheme();
  const sTone = statusTone(issue.status);
  const pTone = priorityTone(issue.priority);
  const accentColor = ACCENT_COLORS[pTone] || colors.primary;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <Card style={[styles.card, { borderLeftColor: accentColor, borderLeftWidth: 4 }]}>
        <View style={styles.header}>
          <StatusPill label={issue.priority?.toUpperCase() || 'NORMAL'} tone={pTone} />
          <Text style={[styles.dateText, { color: colors.textMuted }]}>
            {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : ''}
          </Text>
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{issue.title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={2}>
          {issue.description}
        </Text>
        <View style={styles.footer}>
          <Text style={[styles.location, { color: colors.textMuted }]}>
            📍 {issue.location}
          </Text>
          <StatusPill label={issue.status?.toUpperCase() || 'PENDING'} tone={sTone} />
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
    borderLeftWidth: 4,
    paddingLeft: 14,
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
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: TypeScale.title,
  },
  subtitle: {
    marginTop: Spacing.xs,
    fontFamily: Fonts.body,
    fontSize: TypeScale.bodySmall,
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
    marginRight: Spacing.sm,
  },
});
