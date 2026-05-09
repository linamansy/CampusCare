import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { addComment, markIssueCompleted, markIssueInProgress, uploadCompletionPhoto, type Issue } from '@/src/services/api';
import { Colors } from '@/src/theme/colors';
import { ErrorMessage } from '@/src/components/ErrorMessage';
import { LoadingOverlay } from '@/src/components/LoadingOverlay';

export default function IssueWorkScreen() {
  const params = useLocalSearchParams<{ issue?: string }>();
  const issueParam = params.issue;
  const parsedIssue = useMemo<Issue | null>(() => {
    if (!issueParam) {
      return null;
    }

    try {
      return JSON.parse(decodeURIComponent(issueParam));
    } catch {
      return null;
    }
  }, [issueParam]);

  const [currentIssue, setCurrentIssue] = useState<Issue | null>(parsedIssue);
  const [comment, setComment] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!currentIssue) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.title}>Issue not found</Text>
          <Text style={styles.subtitle}>Open this screen from the Assigned Issues list.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const issue = currentIssue;

  async function handleAddComment() {
    if (!comment.trim()) {
      setError('Please enter a comment before submitting.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await addComment(issue.id, comment.trim());
      setSuccessMessage('Comment added successfully.');
      setComment('');
    } catch (err) {
      setError('Unable to submit comment. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkInProgress() {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await markIssueInProgress(issue.id);
      setCurrentIssue({ ...issue, status: 'In Progress' });
      setSuccessMessage('Issue marked In Progress.');
    } catch (err) {
      setError('Unable to update issue status. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkCompleted() {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await markIssueCompleted(issue.id);
      setCurrentIssue({ ...issue, status: 'Completed' });
      setSuccessMessage('Issue marked completed.');
    } catch (err) {
      setError('Unable to update issue status. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePickPhoto() {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
      setSuccessMessage('Photo selected. Ready to upload.');
      setError(null);
    }
  }

  async function handleUploadPhoto() {
    if (!photoUri) {
      setError('Select a completion photo first.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const fileName = photoUri.split('/').pop() ?? `completion-${issue.id}.jpg`;
      const fileType = 'image/jpeg';
      await uploadCompletionPhoto(issue.id, photoUri, fileName, fileType);
      setSuccessMessage('Completion photo uploaded successfully.');
      setPhotoUri(null);
    } catch (err) {
      setError('Unable to upload photo. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>{currentIssue.title}</Text>
          <Text style={styles.subtitle}>{currentIssue.location}</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status</Text>
            <View style={[styles.statusBadge, currentIssue.status === 'In Progress' ? styles.inProgress : styles.pending]}>
              <Text style={styles.statusText}>{currentIssue.status}</Text>
            </View>
          </View>
          <Text style={styles.description}>{currentIssue.description}</Text>
          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Assigned to</Text>
            <Text style={styles.detailValue}>{currentIssue.assignedTo ?? 'Worker'}</Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Created</Text>
            <Text style={styles.detailValue}>{currentIssue.createdAt ?? 'N/A'}</Text>
          </View>
        </View>

        {error ? <ErrorMessage message={error} /> : null}
        {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add a worker comment</Text>
          <TextInput
            style={styles.input}
            placeholder="Type your update..."
            placeholderTextColor={Colors.subText}
            multiline
            value={comment}
            onChangeText={setComment}
          />
          <Button title="Add Comment" color={Colors.primary} onPress={handleAddComment} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload completion photo</Text>
          {photoUri ? <Image source={{ uri: photoUri }} style={styles.photoPreview} /> : null}
          <View style={styles.buttonRow}>
            <View style={styles.buttonWrapper}>
              <Button title="Pick Photo" color={Colors.secondary} onPress={handlePickPhoto} />
            </View>
            <View style={styles.buttonWrapper}>
              <Button title="Upload Photo" color={Colors.success} onPress={handleUploadPhoto} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
  <Text style={styles.sectionTitle}>Work actions</Text>

  <View style={styles.buttonWrapper}>
    <Button
      title={currentIssue.status === 'In Progress' ? 'Already In Progress' : 'Mark In Progress'}
      color={Colors.primary}
      onPress={handleMarkInProgress}
      disabled={currentIssue.status === 'In Progress'}
    />
  </View>

  <View style={[styles.buttonWrapper, { marginTop: 12 }]}>
    <Button
      title="Mark as Done"
      color={Colors.success}
      onPress={handleMarkCompleted}
    />
  </View>
</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: Platform.OS === 'android' ? 24 : 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.background,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    color: Colors.subText,
    fontSize: 14,
    marginBottom: 18,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusLabel: {
    color: Colors.subText,
    fontSize: 14,
    fontWeight: '700',
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  inProgress: {
    backgroundColor: Colors.primary,
  },
  pending: {
    backgroundColor: Colors.secondary,
  },
  statusText: {
    color: Colors.card,
    fontWeight: '700',
    fontSize: 12,
  },
  description: {
    color: Colors.text,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: {
    color: Colors.subText,
    fontSize: 13,
  },
  detailValue: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  successText: {
    color: Colors.success,
    fontWeight: '700',
    marginBottom: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  input: {
    minHeight: 120,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 12,
    color: Colors.text,
    textAlignVertical: 'top',
  },
  photoPreview: {
    width: '100%',
    height: 220,
    borderRadius: 18,
    marginBottom: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonWrapper: {
    flex: 1,
    marginRight: 10,
  },
});
