import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { createIssue } from '../../../src/api/issues';
import { AppShell } from '../../../src/components/AppShell';
import { Button } from '../../../src/components/Button';
import { Card } from '../../../src/components/Card';
import { Input } from '../../../src/components/Input';
import { Fonts, Spacing, TypeScale, useTheme } from '../../../src/theme';

export default function ReportIssueScreen() {
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Maintenance');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [room, setRoom] = useState('');
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Photo library permission is required to attach issue images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!image) {
      setError('An issue photo is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await createIssue({
        title,
        description,
        category,
        building,
        floor,
        room,
        imageUri: image.uri,
        imageName: image.fileName || 'issue.jpg',
        imageType: image.mimeType || 'image/jpeg',
      });
      setTitle('');
      setDescription('');
      setBuilding('');
      setFloor('');
      setRoom('');
      setImage(null);
      Alert.alert('Submitted', 'Your issue has been submitted successfully.');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not submit issue');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell title="Submit Issue" subtitle="Report a campus maintenance issue with a supporting photo.">
      <Card>
        <Input label="Title" value={title} onChangeText={setTitle} />
        <Input label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={4} />
        <Input label="Category" value={category} onChangeText={setCategory} />
        <Input label="Building" value={building} onChangeText={setBuilding} />
        <Input label="Floor" value={floor} onChangeText={setFloor} />
        <Input label="Room" value={room} onChangeText={setRoom} />
        <Button title={image ? 'Change Photo' : 'Upload Photo'} variant="outline" onPress={pickImage} />
        {image ? <Text style={[styles.fileText, { color: colors.textSecondary }]}>{image.fileName || image.uri}</Text> : null}
        {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
        <View style={styles.submitSpacing}>
          <Button title={submitting ? 'Submitting...' : 'Submit Issue'} onPress={handleSubmit} disabled={submitting} />
        </View>
      </Card>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  fileText: {
    marginTop: Spacing.sm,
    fontFamily: Fonts.body,
    fontSize: TypeScale.bodySmall,
  },
  error: {
    marginTop: Spacing.sm,
    fontFamily: Fonts.label,
    fontSize: TypeScale.label,
  },
  submitSpacing: {
    marginTop: Spacing.md,
  },
});
