import { useEffect, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchAssignedIssues, type Issue } from '@/src/services/api';
import { Colors } from '@/src/theme/colors';
import { LoadingOverlay } from '@/src/components/LoadingOverlay';
import { ErrorMessage } from '@/src/components/ErrorMessage';
import { IssueCard } from '@/src/components/IssueCard';

const WORKER_ID = 1;

export default function AssignedIssuesScreen() {
  const router = useRouter();
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
      setError('Unable to load assigned issues. Make sure the backend is running and the phone is on the same network.');
    } finally {
      setLoading(false);
    }
  }

  function handleIssuePress(issue: Issue) {
    const encodedIssue = encodeURIComponent(JSON.stringify(issue));
    router.push({ pathname: '/IssueWork', params: { issue: encodedIssue } });
  }

  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Assigned Issues</Text>
        <Text style={styles.subtitle}>Review your assigned tasks and tap one to update its status.</Text>
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
              <Text style={styles.emptyTitle}>No assigned issues yet.</Text>
              <Text style={styles.emptyText}>Your assigned work will appear here once the backend sends it.</Text>
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
    paddingVertical: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    marginTop: 8,
    color: Colors.subText,
    fontSize: 15,
    lineHeight: 22,
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
    paddingTop: 24,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    color: Colors.subText,
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 20,
  },
});
