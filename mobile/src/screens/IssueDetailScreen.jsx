import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import api from '../services/api';
import { colors } from '../theme/colors';
import ScreenHeader from '../components/ScreenHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import IssueComment from '../components/IssueComment';
import StatusBadge from '../components/StatusBadge';
import CustomButton from '../components/CustomButton';

const IssueDetailScreen = () => {
  const route = useRoute();
  const issueId = route.params?.issueId ?? '1';
  const [issue, setIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadIssue = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get(`/issues/${issueId}`);
      const fetchedIssue = response.data?.data ?? response.data;
      setIssue(fetchedIssue ?? null);
      setComments(fetchedIssue?.comments ?? []);
    } catch (fetchError) {
      setError('Unable to load issue details. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [issueId]);

  useEffect(() => {
    loadIssue();
  }, [loadIssue]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadIssue();
  };

  if (loading) {
    return <LoadingSpinner message="Loading issue details..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={handleRefresh} />;
  }

  if (!issue) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No issue found.</Text>
        <CustomButton title="Reload" onPress={handleRefresh} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <ScreenHeader title={issue.title} subtitle={issue.category || 'General'} />

      <View style={styles.section}>
        <StatusBadge status={issue.status} />
        <Text style={styles.description}>{issue.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        <Text style={styles.sectionText}>{issue.location || 'No location provided'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Submitted by</Text>
        <Text style={styles.sectionText}>{issue.reporterName || issue.submitter || 'Community Member'}</Text>
      </View>

      <View style={styles.commentsContainer}>
        <Text style={styles.commentsTitle}>Comments</Text>
        {comments.length === 0 ? (
          <Text style={styles.emptyText}>No comments yet. Be the first to respond.</Text>
        ) : (
          comments.map(comment => <IssueComment key={comment.id} comment={comment} />)
        )}
      </View>

      <CustomButton title="Refresh Issue" onPress={handleRefresh} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionText: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
  },
  description: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
  },
  commentsContainer: {
    marginBottom: 20,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: colors.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default IssueDetailScreen;
