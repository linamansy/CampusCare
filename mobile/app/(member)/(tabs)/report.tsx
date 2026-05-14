import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { createIssue, fetchCategories } from '../../../src/api/issues';
import { AppShell } from '../../../src/components/AppShell';
import { Button } from '../../../src/components/Button';
import { Card } from '../../../src/components/Card';
import { Input } from '../../../src/components/Input';
import { Fonts, Spacing, TypeScale, useTheme } from '../../../src/theme';

const DEFAULT_CATEGORIES = [
  'Plumbing', 'Electrical', 'HVAC', 'Cleaning',
  'Cleanliness', 'Maintenance', 'Infrastructure', 'Sustainability', 'Other',
];

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
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

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
    if (!result.canceled) setImage(result.assets[0]);
  };

  const validate = () => {
    if (!title.trim()) return 'Title is required.';
    if (!description.trim()) return 'Description is required.';
    if (!building.trim()) return 'Building is required.';
    if (!floor.trim()) return 'Floor is required.';
    if (!room.trim()) return 'Room is required.';
    if (!image) return 'An issue photo is required.';
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await createIssue({
        title: title.trim(),
        description: description.trim(),
        category,
        building: building.trim(),
        floor: floor.trim(),
        room: room.trim(),
        imageUri: image!.uri,
        imageName: image!.fileName || 'issue.jpg',
        imageType: image!.mimeType || 'image/jpeg',
      });
      setTitle('');
      setDescription('');
      setCategory('Maintenance');
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <AppShell title="Submit Issue" subtitle="Report a campus maintenance issue with a supporting photo.">
          <Card>
            <Input
              label="Title"
              value={title}
              onChangeText={setTitle}
              placeholder="Brief summary of the issue"
            />
            <Input
              label="Description"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              placeholder="Describe the issue in detail..."
            />

            {/* Category Picker */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={styles.categoryRow}>
              {categories.map((cat) => (
                <Pressable
                  key={cat}
                  style={[
                    styles.categoryChip,
                    {
                      borderColor: category === cat ? colors.primary : colors.surfaceHigh,
                      backgroundColor: category === cat ? colors.primaryContainer : colors.surface,
                    },
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[
                    styles.categoryChipText,
                    { color: category === cat ? colors.onPrimary : colors.textSecondary },
                  ]}>
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Location */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Location</Text>
            <View style={styles.locationRow}>
              <View style={styles.locationField}>
                <Input label="Building" value={building} onChangeText={setBuilding} placeholder="e.g. A" />
              </View>
              <View style={styles.locationFieldSmall}>
                <Input label="Floor" value={floor} onChangeText={setFloor} placeholder="e.g. 2" keyboardType="numeric" />
              </View>
              <View style={styles.locationFieldSmall}>
                <Input label="Room" value={room} onChangeText={setRoom} placeholder="e.g. 204" />
              </View>
            </View>

            {/* Image picker */}
            <View style={styles.photoSection}>
              {image ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: image.uri }} style={styles.preview} resizeMode="cover" />
                  <Pressable style={[styles.changePhoto, { backgroundColor: colors.surfaceHigh }]} onPress={pickImage}>
                    <Text style={[styles.changePhotoText, { color: colors.textPrimary }]}>Change Photo</Text>
                  </Pressable>
                </View>
              ) : (
                <Button title="Upload Photo" variant="outline" onPress={pickImage} />
              )}
            </View>

            {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

            <View style={styles.submitSpacing}>
              <Button
                title={submitting ? 'Submitting...' : 'Submit Issue'}
                onPress={handleSubmit}
                disabled={submitting}
              />
            </View>
          </Card>
        </AppShell>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1 },
  fieldLabel: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    fontFamily: Fonts.label,
    fontSize: TypeScale.label,
  },
  sectionLabel: {
    marginTop: Spacing.md,
    marginBottom: 4,
    fontFamily: Fonts.label,
    fontSize: TypeScale.label,
  },
  categoryScroll: { marginBottom: Spacing.sm },
  categoryRow: { gap: Spacing.sm, paddingBottom: 4 },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  categoryChipText: {
    fontFamily: Fonts.label,
    fontSize: TypeScale.label,
  },
  locationRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  locationField: { flex: 2 },
  locationFieldSmall: { flex: 1 },
  photoSection: { marginTop: Spacing.md },
  previewContainer: { gap: Spacing.sm },
  preview: {
    width: '100%',
    height: 180,
    borderRadius: 14,
  },
  changePhoto: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: 10,
  },
  changePhotoText: {
    fontFamily: Fonts.label,
    fontSize: TypeScale.label,
  },
  error: {
    marginTop: Spacing.sm,
    fontFamily: Fonts.label,
    fontSize: TypeScale.label,
  },
  submitSpacing: { marginTop: Spacing.md },
});
