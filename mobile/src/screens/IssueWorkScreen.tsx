import { useState } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { addComment, markIssueInProgress, uploadCompletionPhoto, type Issue } from '@/src/services/api';
import { Colors } from '@/src/theme/colors';
import { ErrorMessage } from '@/src/components/ErrorMessage';
import { LoadingOverlay } from '@/src/components/LoadingOverlay';
import type { WorkerStackParamList } from '@/src/navigation/types';

type Props = NativeStackScreenProps<WorkerStackParamList, 'IssueWork'>;

export default function IssueWorkScreen({ route }: Props) {
  const { issue } = route.params;
  const [currentIssue, setCurrentIssue] = useState<Issue>(issue);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleAddComment() {
    if (!comment.trim()) {
      setError('Enter a message before submitting a comment.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await addComment(currentIssue.id, comment.trim());
      setSuccessMessage('Comment added successfully.');
      setComment('');
    } catch (err) {
      setError('Unable to save comment. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkInProgress() {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await markIssueInProgress(currentIssue.id);
      setCurrentIssue({ ...currentIssue, status: 'In Progress' });
      setSuccessMessage('Issue marked In Progress.');
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

    if (!result.canceled && result.assets?.length > 0) {
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
      const fileName = photoUri.split('/').pop() ?? `completion-${currentIssue.id}.jpg`;
      const fileType = 'image/jpeg';

      await uploadCompletionPhoto(currentIssue.id, photoUri, fileName, fileType);
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
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Assigned To</Text>
            <Text style={styles.metaText}>{currentIssue.assignedTo ?? 'Worker'}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Created</Text>
            <Text style={styles.metaText}>{currentIssue.createdAt ?? 'Unknown'}</Text>
          </View>
        </View>

        {error ? <ErrorMessage message={error} /> : null}
        {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Worker comments</Text>
          <TextInput
            style={styles.input}
            placeholder="Write your update here"
            placeholderTextColor={Colors.subText}
            multiline
            value={comment}
            onChangeText={setComment}
          />
          <Button title="Add Comment" color={Colors.primary} onPress={handleAddComment} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photo upload</Text>
          {photoUri ? <Image source={{ uri: photoUri }} style={styles.photoPreview} /> : null}
          <View style={styles.buttonGroup}>
            <Button title="Pick Photo" color={Colors.secondary} onPress={handlePickPhoto} />
            <Button title="Upload Photo" color={Colors.success} onPress={handleUploadPhoto} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Work actions</Text>
          <Button
            title={currentIssue.status === 'In Progress' ? 'Already In Progress' : 'Mark In Progress'}
            color={Colors.primary}
            onPress={handleMarkInProgress}
            disabled={currentIssue.status === 'In Progress'}
          />
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
  card: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.subText,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 14,
    color: Colors.subText,
    fontWeight: '600',
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
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
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaLabel: {
    color: Colors.subText,
    fontSize: 13,
  },
  metaText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 13,
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
    textAlignVertical: 'top',
    padding: 14,
    marginBottom: 12,
    color: Colors.text,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  photoPreview: {
    width: '100%',
    height: 240,
    borderRadius: 16,
    marginBottom: 14,
  },
  successText: {
    color: Colors.success,
    fontWeight: '600',
    marginBottom: 12,
  },
});
