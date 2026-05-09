import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const IssueComment = ({ comment }) => {
  return (
    <View style={styles.commentCard}>
      <View style={styles.headerRow}>
        <Text style={styles.author}>{comment.author || comment.userName || 'Community Member'}</Text>
        <Text style={styles.date}>{comment.createdAt?.slice(0, 10) ?? 'Unknown date'}</Text>
      </View>
      <Text style={styles.commentText}>{comment.content || comment.text || 'No comment content.'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  commentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  author: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  date: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  commentText: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
});

export default IssueComment;
