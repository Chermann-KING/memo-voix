import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Camera, User } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/constants/colors';

export default function ProfileScreen() {
  const { user, updateProfile, isLoading } = useAuth();
  const router = useRouter();
  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  
  const handleUpdateProfile = async () => {
    try {
      await updateProfile({
        displayName,
        email,
        photoURL,
      });
      
      if (Platform.OS === 'web') {
        alert('Profile updated successfully');
      } else {
        Alert.alert('Success', 'Profile updated successfully');
      }
      
      router.back();
    } catch (error) {
      if (Platform.OS === 'web') {
        alert('Failed to update profile');
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    }
  };
  
  const handleSelectImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant permission to access your photos');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoURL(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
    }
  };
  
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Profile',
        }}
      />
      
      <View style={styles.content}>
        <View style={styles.profileImageContainer}>
          {photoURL ? (
            <Image source={{ uri: photoURL }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <User size={40} color={colors.light.background} />
            </View>
          )}
          
          <TouchableOpacity style={styles.cameraButton} onPress={handleSelectImage}>
            <Camera size={20} color={colors.light.background} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              placeholderTextColor={colors.light.subtext}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={email}
              editable={false}
            />
            <Text style={styles.helperText}>Email cannot be changed</Text>
          </View>
          
          <Button
            title="Save Changes"
            onPress={handleUpdateProfile}
            isLoading={isLoading}
            style={styles.saveButton}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  content: {
    padding: 24,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.light.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.light.background,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.light.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.light.text,
  },
  disabledInput: {
    backgroundColor: colors.light.card,
    color: colors.light.subtext,
  },
  helperText: {
    fontSize: 12,
    color: colors.light.subtext,
    marginTop: 4,
  },
  saveButton: {
    marginTop: 16,
  },
});