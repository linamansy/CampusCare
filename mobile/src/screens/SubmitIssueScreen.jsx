import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../theme/colors';
import CustomButton from '../components/CustomButton';
import CustomInput from '../components/CustomInput';
import LoadingSpinner from '../components/LoadingSpinner';
import ScreenHeader from '../components/ScreenHeader';
import api from '../services/api';

const SubmitIssueScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
  });

  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const categories = [
    'Plumbing',
    'Electrical',
    'HVAC',
    'Cleaning',
    'Maintenance',
    'Other'
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be 100 characters or less';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 1000) {
      newErrors.description = 'Description must be 1000 characters or less';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    } else if (formData.location.length > 200) {
      newErrors.location = 'Location must be 200 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert('Permission required', 'Permission to access camera roll is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        const selectedImage = result.assets[0];
        if (selectedImage.fileSize > 5 * 1024 * 1024) { // 5MB limit
          Alert.alert('File too large', 'Please select an image smaller than 5MB');
          return;
        }
        setImage(selectedImage);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const submitIssue = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('title', formData.title.trim());
      submitData.append('description', formData.description.trim());
      submitData.append('category', formData.category);
      submitData.append('location', formData.location.trim());

      if (image) {
        const imageUri = image.uri;
        const imageName = imageUri.split('/').pop();
        const imageType = imageName.split('.').pop();

        submitData.append('image', {
          uri: imageUri,
          name: imageName,
          type: `image/${imageType}`,
        });
      }

      const response = await api.post('/issues', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        Alert.alert(
          'Success',
          'Issue submitted successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form
                setFormData({
                  title: '',
                  description: '',
                  category: '',
                  location: '',
                });
                setImage(null);
                setErrors({});
                // Navigate back or to issues list
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', response.data.message || 'Failed to submit issue');
      }
    } catch (error) {
      console.error('Submit error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit issue';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const CategorySelector = () => (
    <View style={styles.categoryContainer}>
      <Text style={styles.categoryLabel}>Category *</Text>
      <View style={styles.categoryButtons}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryButton,
              formData.category === cat && styles.categoryButtonSelected
            ]}
            onPress={() => setFormData({ ...formData, category: cat })}
          >
            <Text style={[
              styles.categoryButtonText,
              formData.category === cat && styles.categoryButtonTextSelected
            ]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Submit Issue" />
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Submit Issue" />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <CustomInput
            label="Issue Title *"
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
            placeholder="Brief description of the issue"
            error={errors.title}
            maxLength={100}
          />

          <CustomInput
            label="Description *"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Detailed description of the issue"
            error={errors.description}
            multiline
            numberOfLines={4}
            maxLength={1000}
          />

          <CategorySelector />

          <CustomInput
            label="Location *"
            value={formData.location}
            onChangeText={(text) => setFormData({ ...formData, location: text })}
            placeholder="Building and room/area"
            error={errors.location}
            maxLength={200}
          />

          <View style={styles.imageSection}>
            <Text style={styles.imageLabel}>Photo (Optional)</Text>
            <CustomButton
              title={image ? "Change Photo" : "Select Photo"}
              onPress={pickImage}
              style={styles.imageButton}
            />
            {image && (
              <Text style={styles.imageSelected}>
                Photo selected: {image.uri.split('/').pop()}
              </Text>
            )}
          </View>

          <CustomButton
            title="Submit Issue"
            onPress={submitIssue}
            loading={loading}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.subText,
    backgroundColor: COLORS.card,
  },
  categoryButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    color: COLORS.text,
  },
  categoryButtonTextSelected: {
    color: COLORS.card,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    color: COLORS.danger,
    marginTop: 4,
  },
  imageSection: {
    marginBottom: 24,
  },
  imageLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  imageButton: {
    marginBottom: 8,
  },
  imageSelected: {
    fontSize: 14,
    color: COLORS.success,
    fontStyle: 'italic',
  },
  submitButton: {
    marginTop: 16,
  },
});

export default SubmitIssueScreen;