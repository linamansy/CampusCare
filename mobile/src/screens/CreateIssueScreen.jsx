import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../services/AuthContext';
import api from '../services/api';
import { colors } from '../theme/colors';
import { Camera, Image as ImageIcon, MapPin, Tag, FileText, X, ArrowLeft, Send } from 'lucide-react-native';

const CATEGORIES = ['Plumbing', 'Electrical', 'HVAC', 'Cleaning', 'Maintenance', 'Infrastructure', 'Sustainability', 'Other'];

const CreateIssueScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [room, setRoom] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async (useCamera = false) => {
    const permissionResult = useCamera 
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission required', `Permission to access ${useCamera ? 'camera' : 'gallery'} is required!`);
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!title || !description || !building || !floor || !room || !image) {
      Alert.alert('Incomplete Form', 'Please fill in all fields and provide a photo of the issue.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('building', building);
    formData.append('floor', floor);
    formData.append('room', room);
    formData.append('userId', user.id);

    // Image handling
    const uriParts = image.uri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    
    formData.append('image', {
      uri: Platform.OS === 'ios' ? image.uri.replace('file://', '') : image.uri,
      name: `issue_photo.${fileType}`,
      type: `image/${fileType}`,
    });

    try {
      const response = await api.post('/issues', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        Alert.alert('Protocol Initialized', 'Infrastructure report submitted successfully.', [
          { text: 'View Dashboard', onPress: () => navigation.navigate('Dashboard') }
        ]);
      }
    } catch (error) {
      console.error('Submission error:', error);
      const message = error.response?.data?.error || 'Failed to submit report. Please check your connection.';
      Alert.alert('Submission Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Infrastructure Report</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Evidence Capture</Text>
            {image ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                <TouchableOpacity style={styles.removeImage} onPress={() => setImage(null)}>
                  <X size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imagePickerContainer}>
                <TouchableOpacity style={styles.pickerButton} onPress={() => pickImage(true)}>
                  <Camera size={32} color={colors.primary} />
                  <Text style={styles.pickerText}>Camera</Text>
                </TouchableOpacity>
                <View style={styles.pickerDivider} />
                <TouchableOpacity style={styles.pickerButton} onPress={() => pickImage(false)}>
                  <ImageIcon size={32} color={colors.primary} />
                  <Text style={styles.pickerText}>Gallery</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <FileText size={16} color={colors.primary} />
                <Text style={styles.inputLabel}>Report Title</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="e.g., Broken Water Pipe"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Tag size={16} color={colors.primary} />
                <Text style={styles.inputLabel}>Category</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catBadge, category === cat && styles.catBadgeActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.catBadgeText, category === cat && styles.catBadgeTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <MapPin size={16} color={colors.primary} />
                <Text style={styles.inputLabel}>Location Details</Text>
              </View>
              <View style={styles.locationRow}>
                <TextInput
                  style={[styles.input, { flex: 2 }]}
                  placeholder="Building (e.g. C1)"
                  value={building}
                  onChangeText={setBuilding}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Floor"
                  value={floor}
                  onChangeText={setFloor}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Room"
                  value={room}
                  onChangeText={setRoom}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe the issue in detail..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Submit Official Report</Text>
                  <Send size={20} color="#FFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  backButton: {
    padding: 8,
  },
  content: {
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  imagePickerContainer: {
    height: 160,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerDivider: {
    width: 1,
    height: '60%',
    backgroundColor: colors.border,
  },
  pickerText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  imagePreviewContainer: {
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImage: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    height: 120,
    paddingTop: 16,
  },
  categoryScroll: {
    marginTop: 4,
  },
  catBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  catBadgeActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  catBadgeTextActive: {
    color: '#FFF',
  },
  locationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    gap: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
});

export default CreateIssueScreen;
