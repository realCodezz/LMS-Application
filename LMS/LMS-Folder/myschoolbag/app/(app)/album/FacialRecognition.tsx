import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { storage } from "../../../firebaseConfig";
import { ref, getDownloadURL } from "firebase/storage";
import { useUser } from "@/context/UserContext";

interface Album {
  id: string;
  albumName: string;
  createdByEmail: string;
  files?: string[];
  coverImage: string;
}

interface FacialRecognitionProps {
  albums: Album[];
  onMatchFound: (matchedAlbums: Album[]) => void;
}

const AZURE_FACE_KEY = '2u2cBnWmbKztbu5iVuQrChB8KWgRzYMhvj5brjdJQ7OYZuPBY5L2JQQJ99BBACYeBjFXJ3w3AAAKACOGY0gI';
const AZURE_FACE_ENDPOINT = 'https://myschoolbag.cognitiveservices.azure.com';

const detectFace = async (imageUrl: string) => {
  try {
    console.log('Attempting to detect face for URL:', imageUrl);
    const response = await fetch(`${AZURE_FACE_ENDPOINT}/face/v1.0/detect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': AZURE_FACE_KEY,
      },
      body: JSON.stringify({
        url: imageUrl
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Face detection failed:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log('Face detection response:', data);
    return data.length > 0;
  } catch (error) {
    console.error('Error in detectFace:', error);
    return false;
  }
};

export const FacialRecognition: React.FC<FacialRecognitionProps> = ({ albums, onMatchFound }) => {
  const { user } = useUser();
  const [isSearching, setIsSearching] = useState(false);

  const searchByFace = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not logged in.');
      return;
    }

    setIsSearching(true);
    try {
      // Get profile picture URL
      const profilePicRef = ref(storage, `profile_pictures/${user.id}.jpg`);
      let profilePicUrl;
      try {
        profilePicUrl = await getDownloadURL(profilePicRef);
      } catch (error) {
        Alert.alert('No Profile Picture', 'Please set a profile picture first to use face search.');
        setIsSearching(false);
        return;
      }

      // Check if profile picture has a face
      const hasFace = await detectFace(profilePicUrl);
      if (!hasFace) {
        Alert.alert('Error', 'No face detected in profile picture.');
        return;
      }

      Alert.alert(
        'Face Detected!', 
        'Face comparison feature is coming soon! We detected a face in your profile picture. Soon you\'ll be able to find similar faces in albums.'
      );
      onMatchFound([]); // Return empty matches for now

    } catch (error) {
      console.error('Error in face search:', error);
      Alert.alert('Error', 'Failed to perform face detection. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.searchButton}
      onPress={searchByFace}
      disabled={isSearching}
    >
      <Text style={styles.searchButtonText}>
        {isSearching ? 'Detecting...' : 'Detect Face (Beta)'}
      </Text>
      {isSearching && (
        <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 8 }} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  searchButton: {
    backgroundColor: '#4B0082',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'center',
    ...Platform.select({
      web: {
        width: '90%',
        maxWidth: 400,
      },
      default: {
        width: '90%',
      },
    }),
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default FacialRecognition;