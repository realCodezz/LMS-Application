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
    const response = await fetch(`${AZURE_FACE_ENDPOINT}/face/v1.0/detect?returnFaceAttributes=age,gender,smile,facialHair,glasses,emotion,hair,makeup,accessories`, {
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
    
    // Instead of using faceId, we'll use face attributes to compare
    if (data.length > 0) {
      return data[0].faceAttributes;
    }
    return null;
  } catch (error) {
    console.error('Error in detectFace:', error);
    return null;
  }
};

const compareFaceAttributes = (face1: any, face2: any) => {
  if (!face1 || !face2) return { isIdentical: false, confidence: 0 };

  // Compare basic attributes
  let matchScore = 0;
  let totalChecks = 0;

  // Gender match
  if (face1.gender === face2.gender) {
    matchScore += 1;
  }
  totalChecks += 1;

  // Age similarity (within 5 years)
  if (Math.abs(face1.age - face2.age) <= 5) {
    matchScore += 1;
  }
  totalChecks += 1;

  // Hair color similarity
  if (face1.hair && face2.hair && face1.hair.hairColor && face2.hair.hairColor) {
    const hair1 = face1.hair.hairColor.sort((a: any, b: any) => b.confidence - a.confidence)[0];
    const hair2 = face2.hair.hairColor.sort((a: any, b: any) => b.confidence - a.confidence)[0];
    if (hair1.color === hair2.color) {
      matchScore += 1;
    }
  }
  totalChecks += 1;

  // Facial hair similarity
  if (face1.facialHair && face2.facialHair) {
    const hasBeard1 = face1.facialHair.beard > 0.5;
    const hasBeard2 = face2.facialHair.beard > 0.5;
    if (hasBeard1 === hasBeard2) {
      matchScore += 1;
    }
  }
  totalChecks += 1;

  // Calculate confidence score (0 to 1)
  const confidence = matchScore / totalChecks;

  return {
    isIdentical: confidence >= 0.75, // Require 75% match for attributes
    confidence
  };
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

      // Get face attributes from profile picture
      const profileFaceAttrs = await detectFace(profilePicUrl);
      if (!profileFaceAttrs) {
        Alert.alert('Error', 'No face detected in profile picture.');
        return;
      }

      const matchingAlbums: Album[] = [];
      const processedAlbums = new Set<string>();

      // Process each album
      for (const album of albums) {
        if (processedAlbums.has(album.id) || !album.files?.length) continue;

        // Process each photo in the album
        for (const file of album.files) {
          try {
            const fileRef = ref(
              storage,
              `albums/${album.createdByEmail}/${album.albumName}/${file}`
            );
            const photoUrl = await getDownloadURL(fileRef);
            
            // Detect face in album photo
            const albumPhotoAttrs = await detectFace(photoUrl);
            if (!albumPhotoAttrs) continue;

            // Compare face attributes
            const comparison = compareFaceAttributes(profileFaceAttrs, albumPhotoAttrs);
            if (comparison.isIdentical && comparison.confidence > 0.6) {
              matchingAlbums.push(album);
              processedAlbums.add(album.id);
              break; // Move to next album once a match is found
            }
          } catch (error) {
            console.error('Error processing photo:', error);
          }
        }
      }

      onMatchFound(matchingAlbums);
      if (matchingAlbums.length === 0) {
        Alert.alert('No Matches', 'No photos found with matching faces.');
      }
    } catch (error) {
      console.error('Error in face search:', error);
      Alert.alert('Error', 'Failed to perform face search. Please try again.');
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
        {isSearching ? 'Searching...' : 'Search by Face'}
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