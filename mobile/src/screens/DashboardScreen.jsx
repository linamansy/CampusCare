import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useAuth } from '../services/AuthContext';
import api from '../services/api';
import { colors } from '../theme/colors';
import { 
  Plus, 
  Award, 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  LogOut,
  Shield,
  Activity,
  Layers
} from 'lucide-react-native';

const DashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchIssues = useCallback(async () => {
    try {
      let endpoint = `/issues/user/${user.id}`;
      
      if (user.role === 'Facility Manager') {
        endpoint = '/issues';
      } else if (user.role === 'Worker') {
        endpoint = '/issues/assigned';
      }
      
      const response = await api.get(endpoint);
      const data = response.data?.data ?? response.data;
      setIssues(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch issues', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.id, user.role]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchIssues();
  };

  const getStatusInfo = (status) => {
    const s = status ? status.toLowerCase() : '';
    if (s.includes('pending')) return { color: '#64748B', bg: '#F1F5F9', label: 'PENDING' };
    if (s.includes('progress')) return { color: '#0369A1', bg: '#E0F2FE', label: 'IN PROGRESS' };
    if (s.includes('resolved')) return { color: '#15803D', bg: '#DCFCE7', label: 'RESOLVED' };
    if (s.includes('rejected')) return { color: '#B91C1C', bg: '#FEE2E2', label: 'REJECTED' };
    return { color: colors.textSecondary, bg: '#F8FAFC', label: status?.toUpperCase() };
  };

  const renderIssueItem = ({ item }) => {
    const statusInfo = getStatusInfo(item.status);
    return (
      <TouchableOpacity
        style={styles.issueCard}
        onPress={() => navigation.navigate('IssueDetail', { issueId: item.id })}
      >
        <View style={styles.issueCardHeader}>
          <View style={styles.idBadge}>
            <Text style={styles.idText}>#{item.id}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
        </View>
        
        <Text style={styles.issueTitle} numberOfLines={1}>{item.title}</Text>
        
        <View style={styles.locationRow}>
          <MapPin size={12} color={colors.textSecondary} />
          <Text style={styles.issueLocation} numberOfLines={1}>{item.location}</Text>
        </View>
        
        <View style={styles.issueCardFooter}>
          <View style={styles.footerInfo}>
            <Clock size={10} color="#94A3B8" />
            <Text style={styles.issueDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText}>{item.category || 'General'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* System Status Indicator */}
      <View style={styles.systemStatusContainer}>
        <View style={styles.statusInner}>
          <View style={styles.pulseDot} />
          <Text style={styles.systemStatusText}>SYSTEM OPERATIONAL • {user.role?.toUpperCase()}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <LogOut size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>CampusCare / Terminal</Text>
          <Text style={styles.userName}>{user.name}</Text>
        </View>
        <View style={styles.userAvatar}>
          <Text style={styles.avatarText}>{user.name?.charAt(0)}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Award size={14} color={colors.primary} />
            <Text style={styles.statLabel}>POINTS</Text>
          </View>
          <Text style={styles.statValue}>{user.actsOfServicePoints || 0}</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Activity size={14} color={colors.success} />
            <Text style={styles.statLabel}>REPORTS</Text>
          </View>
          <Text style={styles.statValue}>{issues.length}</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Shield size={14} color="#0369A1" />
            <Text style={styles.statLabel}>RANK</Text>
          </View>
          <Text style={styles.statValue}>Elite</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Layers size={18} color={colors.text} />
          <Text style={styles.sectionTitle}>Active Protocols</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{issues.length}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={issues}
          renderItem={renderIssueItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ClipboardList size={48} color={colors.border} />
              <Text style={styles.emptyText}>No infrastructure reports indexed.</Text>
              <Text style={styles.emptySubtext}>System is awaiting new diagnostic input.</Text>
            </View>
          }
        />
      )}

      {user.role === 'Community Member' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CreateIssue')}
        >
          <Plus size={24} color="#FFF" />
          <Text style={styles.fabText}>LOG NEW PROTOCOL</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  systemStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  systemStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  logoutBtn: {
    padding: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  welcomeText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 40,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  countBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  issueCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  issueCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  idBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  idText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  issueLocation: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  issueCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  issueDate: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  categoryTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text,
    fontWeight: '800',
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    left: 24,
    right: 24,
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  fabText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 10,
    letterSpacing: 1,
  },
});

export default DashboardScreen;

