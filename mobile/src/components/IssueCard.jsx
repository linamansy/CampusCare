import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';
import StatusBadge from './StatusBadge';

const IssueCard = ({ issue, onPress, style = {} }) => {
  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>{issue.title}</Text>
        <StatusBadge status={issue.status} />
      </View>

      <Text style={styles.category}>{issue.category}</Text>
      <Text style={styles.location}>{issue.location}</Text>

      <View style={styles.footer}>
        <Text style={styles.creator}>By: {issue.user?.name}</Text>
        <Text style={styles.comments}>💬 {issue.comments?.length || 0}</Text>
      </View>

      <Text style={styles.date}>
        {new Date(issue.createdAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: COLORS.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  category: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: COLORS.subText,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  creator: {
    fontSize: 12,
    color: COLORS.subText,
  },
  comments: {
    fontSize: 12,
    color: COLORS.subText,
  },
  date: {
    fontSize: 12,
    color: COLORS.subText,
    textAlign: 'right',
  },
});

export default IssueCard;