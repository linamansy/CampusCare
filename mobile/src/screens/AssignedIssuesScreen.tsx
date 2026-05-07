import { useEffect, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { fetchAssignedIssues, type Issue } from '@/src/services/api';
import { Colors } from '@/src/theme/colors';
import { LoadingOverlay } from '@/src/components/LoadingOverlay';
import { ErrorMessage } from '@/src/components/ErrorMessage';
import { IssueCard } from '@/src/components/IssueCard';
import type { WorkerStackParamList } from '@/src/navigation/types';

const WORKER_ID = 1;

type AssignedIssuesNavigationProp = NativeStackNavigationProp<WorkerStackParamList, 'AssignedIssues'>;

export default function AssignedIssuesScreen() {
  const navigation = useNavigation<AssignedIssuesNavigationProp>();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAssignedIssues();
  }, []);

  async function loadAssignedIssues() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchAssignedIssues(WORKER_ID);
      setIssues(response);
    } catch (err) {
      setError('Unable to load assigned issues. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleIssuePress(issue: Issue) {
    navigation.navigate('IssueWork', { issue });
  }

  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Assigned Issues</Text>
        <Text style={styles.subtitle}>Tap any issue to work on it and update status from the worker screen.</Text>
      </View>
      {error ? (
        <ErrorMessage message={error} />
      ) : (
        <FlatList
          data={issues}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={issues.length === 0 ? styles.emptyContainer : styles.listContainer}
          renderItem={({ item }) => <IssueCard issue={item} onPress={() => handleIssuePress(item)} />}
          ListEmptyComponent={
            <View style={styles.emptyPlaceholder}>
              <Text style={styles.emptyTitle}>No issues assigned yet.</Text>
              <Text style={styles.emptyText}>Once work is assigned, those tasks will appear here.</Text>
            </View>
          }
          onRefresh={loadAssignedIssues}
          refreshing={loading}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
  },
  header: {
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    color: Colors.text,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.subText,
    marginTop: 8,
    lineHeight: 20,
  },
  listContainer: {
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyPlaceholder: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    color: Colors.text,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.subText,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
});
