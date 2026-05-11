import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { 
  ArrowLeft, 
  MapPin, 
  User, 
  MessageSquare, 
  Send, 
  CheckCircle, 
  Clock, 
  Settings,
  AlertTriangle 
} from 'lucide-react-native';
import api from '../services/api';
import { colors } from '../theme/colors';
import { useAuth } from '../services/AuthContext';
import ScreenHeader from '../components/ScreenHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import IssueComment from '../components/IssueComment';
import StatusBadge from '../components/StatusBadge';
import CustomButton from '../components/CustomButton';

const IssueDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const issueId = route.params?.issueId;
  
  const [issue, setIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loadIssue = useCallback(async () => {
    if (!issueId) {
      setError('Invalid Protocol ID');
      setLoading(false);
      return;
    }

    try {
      const response = await api.get(`/issues/${issueId}`);
      const fetchedIssue = response.data?.data ?? response.data;
      setIssue(fetchedIssue ?? null);
      setComments(fetchedIssue?.comments ?? []);
    } catch (fetchError) {
      console.error(fetchError);
      setError('Unable to load diagnostic data.');
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

  const handlePostComment = async () => {
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      await api.post(`/issues/${issueId}/comments`, { 
        text: commentText 
      });
      setCommentText('');
      loadIssue(); // Reload to show new comment
    } catch (err) {
      Alert.alert('Protocol Error', 'Failed to log comment to system.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    setIsUpdatingStatus(true);
    try {
      await api.put(`/issues/${issueId}/status`, { status: newStatus });
      loadIssue();
      Alert.alert('Status Updated', `Protocol #${issueId} is now ${newStatus}.`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update protocol status.';
      Alert.alert('Update Error', msg);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Accessing diagnostic data..." />;
  }

  if (error || !issue) {
    return <ErrorMessage message={error || 'No issue found.'} onRetry={handleRefresh} />;
  }

  const isStaff = user?.role === 'Facility Manager' || user?.role === 'Worker';

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.backContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerLabel}>Protocol #{issue.id}</Text>
        </View>

        <ScreenHeader title={issue.title} subtitle={issue.category || 'General Maintenance'} />

        {issue.image && (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: `${api.defaults.baseURL.replace('/api', '')}${issue.image}` }} 
              style={styles.issueImage} 
              resizeMode="cover"
            />
            <View style={styles.imageOverlay}>
              <View style={styles.blueprintTag}>
                <Settings size={12} color="#FFF" />
                <Text style={styles.blueprintTagText}>VERIFIED SOURCE</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.statusRow}>
            <StatusBadge status={issue.status} />
            <View style={[styles.priorityBadge, { backgroundColor: issue.priority === 'High' ? '#FEE2E2' : '#F1F5F9' }]}>
              <AlertTriangle size={12} color={issue.priority === 'High' ? colors.danger : colors.textSecondary} />
              <Text style={[styles.priorityText, { color: issue.priority === 'High' ? colors.danger : colors.textSecondary }]}>
                {issue.priority} Priority
              </Text>
            </View>
          </View>
          <Text style={styles.description}>{issue.description}</Text>
          <Text style={styles.timestamp}>LOGGED: {new Date(issue.createdAt).toLocaleString()}</Text>
        </View>

        {/* Status Actions for FM/Worker */}
        {isStaff && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Actions</Text>
            <View style={styles.actionGrid}>
              {issue.status === 'Submitted/Pending' && (
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: '#E0F2FE' }]}
                  onPress={() => handleUpdateStatus('In Progress')}
                  disabled={isUpdatingStatus}
                >
                  <Clock size={16} color="#0369A1" />
                  <Text style={[styles.actionBtnText, { color: '#0369A1' }]}>START WORK</Text>
                </TouchableOpacity>
              )}
              {(issue.status === 'In Progress' || issue.status === 'Assigned') && (
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: '#DCFCE7' }]}
                  onPress={() => handleUpdateStatus('Resolved')}
                  disabled={isUpdatingStatus}
                >
                  <CheckCircle size={16} color="#15803D" />
                  <Text style={[styles.actionBtnText, { color: '#15803D' }]}>RESOLVE</Text>
                </TouchableOpacity>
              )}
              {issue.status !== 'Rejected' && issue.status !== 'Resolved' && (
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: '#FEE2E2' }]}
                  onPress={() => handleUpdateStatus('Rejected')}
                  disabled={isUpdatingStatus}
                >
                  <AlertTriangle size={16} color="#B91C1C" />
                  <Text style={[styles.actionBtnText, { color: '#B91C1C' }]}>REJECT</Text>
                </TouchableOpacity>
              )}
            </View>
            {isUpdatingStatus && <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 12 }} />}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.infoRow}>
            <MapPin size={18} color={colors.primary} />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.sectionTitle}>Location Terminal</Text>
              <Text style={styles.sectionText}>{issue.location || 'No location coordinates'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.infoRow}>
            <User size={18} color={colors.primary} />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.sectionTitle}>Authorized Reporter</Text>
              <Text style={styles.sectionText}>{issue.user?.name || 'Anonymous Faculty Member'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.commentsContainer}>
          <View style={styles.commentHeaderRow}>
            <MessageSquare size={20} color={colors.text} />
            <Text style={styles.commentsTitle}>Diagnostic Log</Text>
          </View>
          
          {/* Add Comment Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add clinical observation..."
              placeholderTextColor={colors.textSecondary}
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity 
              style={[styles.sendButton, !commentText.trim() && styles.sendButtonDisabled]}
              onPress={handlePostComment}
              disabled={isSubmittingComment || !commentText.trim()}
            >
              {isSubmittingComment ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Send size={18} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>

          {comments.length === 0 ? (
            <View style={styles.emptyComments}>
              <Text style={styles.emptyText}>No diagnostic comments logged.</Text>
            </View>
          ) : (
            comments.map(comment => <IssueComment key={comment.id} comment={comment} />)
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 60,
  },
  backContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  backButton: {
    marginRight: 16,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  imageContainer: {
    width: '100%',
    height: 240,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: colors.border,
  },
  issueImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
  },
  blueprintTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 51, 102, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
  },
  blueprintTagText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 16,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  timestamp: {
    marginTop: 12,
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  commentsContainer: {
    marginTop: 12,
  },
  commentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    minHeight: 40,
    paddingTop: 8,
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
  emptyComments: {
    padding: 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default IssueDetailScreen;

