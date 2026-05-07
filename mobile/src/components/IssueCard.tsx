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
        <Text style={[styles.status, issue.status === 'In Progress' ? styles.inProgress : styles.pending]}>
          {issue.status}
        </Text>
      </View>
      <Text style={styles.description} numberOfLines={2}>
        {issue.description}
      </Text>
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Location</Text>
        <Text style={styles.metaText}>{issue.location}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  status: {
    fontSize: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    overflow: 'hidden',
    color: Colors.card,
    fontWeight: '700',
  },
  inProgress: {
    backgroundColor: Colors.primary,
  },
  pending: {
    backgroundColor: Colors.secondary,
  },
  description: {
    color: Colors.subText,
    marginBottom: 12,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    color: Colors.subText,
    fontSize: 12,
  },
  metaText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
});
