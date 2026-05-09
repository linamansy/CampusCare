import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Issue } from '@/src/services/api';
import { Colors } from '@/src/theme/colors';

interface IssueCardProps {
  issue: Issue;
  onPress: () => void;
}

export function IssueCard({ issue, onPress }: IssueCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title}>{issue.title}</Text>
        <View style={[styles.badge, issue.status === 'In Progress' ? styles.inProgress : styles.pending]}>
          <Text style={styles.badgeText}>{issue.status}</Text>
        </View>
      </View>
      <Text style={styles.description} numberOfLines={2}>{issue.description}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Location</Text>
        <Text style={styles.metaValue}>{issue.location}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  inProgress: {
    backgroundColor: Colors.primary,
  },
  pending: {
    backgroundColor: Colors.secondary,
  },
  badgeText: {
    color: Colors.card,
    fontSize: 12,
    fontWeight: '700',
  },
  description: {
    color: Colors.subText,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    color: Colors.subText,
    fontSize: 12,
    fontWeight: '600',
  },
  metaValue: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
});
