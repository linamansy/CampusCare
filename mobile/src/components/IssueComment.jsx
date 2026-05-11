import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { User } from 'lucide-react-native';

const IssueComment = ({ comment }) => {
  return (
    <View style={styles.commentCard}>
      <View style={styles.headerRow}>
        <View style={styles.authorContainer}>
          <View style={styles.avatar}>
            <User size={12} color={colors.primary} />
          </View>
          <Text style={styles.author}>{comment.author || comment.userName || 'Community Member'}</Text>
        </View>
        <Text style={styles.date}>{new Date(comment.createdAt).toLocaleDateString() || 'Recent'}</Text>
      </View>
      <Text style={styles.commentText}>{comment.content || comment.text || 'No content provided.'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  commentCard: {
    backgroundColor: '#FDFDFD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  author: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
  },
  date: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  commentText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
});

export default IssueComment;

