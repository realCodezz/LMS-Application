import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Switch } from 'react-native-paper';
import MultiSelect from 'react-native-multiple-select';
import { storage, db } from '../../../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface User {
  id: string;
  name: string;
  email: string;
  type?: "admin" | "teacher" | "parent" | "Admin" | "Teacher" | "Parent";
  phoneNumber?: string;
  parentOf?: string[];
  selectedChild?: {
    id: string;
    name: string;
    dob: string;
    className: string;
  } | null;
}

interface CreateAlbumModalProps {
  visible: boolean;
  onClose: () => void;
  classes: { id: string; name: string; }[];
  user: User | null;
  onSuccess: () => void;
}

const CreateAlbumModal: React.FC<CreateAlbumModalProps> = ({
  visible,
  onClose,
  classes,
  user,
  onSuccess,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [albumName, setAlbumName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const screenWidth = Dimensions.get('window').width;
  const isDesktop = Platform.OS === 'web' && screenWidth > 768;

  const handleSelectFiles = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled) {
        setSelectedFiles(result.assets);
      }
    } catch (error) {
      console.error('Error selecting files:', error);
      setError('Failed to select files. Please try again.');
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateAlbum = async () => {
    if (!albumName.trim()) {
      setError('Please provide an album name');
      return;
    }

    if (selectedFiles.length === 0) {
      setError('Please select at least one photo or video');
      return;
    }

    if (!isPublic && selectedClasses.length === 0) {
      setError('Please select at least one class or make the album public');
      return;
    }

    if (!user?.id) {
      setError('User information is missing. Please try logging in again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const storagePath = `albums/${user.email}/${albumName}`;
      
      // Upload files
      const uploadPromises = selectedFiles.map(async (file) => {
        const fileRef = ref(storage, `${storagePath}/${file.fileName}`);
        const response = await fetch(file.uri);
        const blob = await response.blob();
        await uploadBytes(fileRef, blob);
        return file.fileName;
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      // Save album metadata
      const albumData = {
        albumName,
        createdByID: user.id,
        createdByName: user.name,
        createdByEmail: user.email,
        createdAt: serverTimestamp(),
        public: isPublic,
        classes: isPublic ? [] : selectedClasses,
        files: uploadedFiles,
      };

      await addDoc(collection(db, 'albums'), albumData);
      
      onSuccess();
      onClose();
      setSelectedFiles([]);
      setAlbumName('');
      setIsPublic(true);
      setSelectedClasses([]);
    } catch (error) {
      console.error('Error creating album:', error);
      setError('Failed to create album. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, isDesktop && styles.desktopContent]}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#4B0082" />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Create New Album</Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Album Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter album name"
                value={albumName}
                onChangeText={setAlbumName}
                placeholderTextColor="#808080"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Photos & Videos</Text>
              <TouchableOpacity 
                style={styles.uploadButton} 
                onPress={handleSelectFiles}
              >
                <Ionicons name="cloud-upload-outline" size={40} color="#4B0082" />
                <Text style={styles.uploadText}>Click to select media</Text>
              </TouchableOpacity>

              {selectedFiles.length > 0 && (
                <ScrollView 
                  style={styles.previewContainer}
                  contentContainerStyle={styles.previewGrid}
                >
                  {selectedFiles.map((file, index) => (
                    <View key={index} style={styles.previewItem}>
                      <Image 
                        source={{ uri: file.uri }} 
                        style={styles.previewImage} 
                      />
                      <TouchableOpacity 
                        style={styles.removeButton}
                        onPress={() => handleRemoveFile(index)}
                      >
                        <Ionicons name="close-circle" size={24} color="#FF0000" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Access Settings</Text>
              <View style={styles.toggleContainer}>
                <Text style={styles.toggleLabel}>
                  {isPublic ? 'Public Album' : 'Private Album'}
                </Text>
                <Switch
                  value={isPublic}
                  onValueChange={setIsPublic}
                  color="#4B0082"
                />
              </View>

              {!isPublic && (
                <View style={styles.classSelect}>
                  <MultiSelect
                    items={classes}
                    uniqueKey="id"
                    displayKey="name"
                    onSelectedItemsChange={setSelectedClasses}
                    selectedItems={selectedClasses}
                    selectText="Select classes"
                    searchInputPlaceholderText="Search classes..."
                    tagRemoveIconColor="#4B0082"
                    tagBorderColor="#4B0082"
                    tagTextColor="#4B0082"
                    selectedItemTextColor="#4B0082"
                    selectedItemIconColor="#4B0082"
                    itemTextColor="#000"
                    styleMainWrapper={styles.multiSelect}
                    hideSubmitButton
                  />
                </View>
              )}
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity 
              style={styles.createButton}
              onPress={handleCreateAlbum}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Create Album</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Platform.OS === 'web' ? 0 : 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    width: Platform.OS === 'web' ? '90%' : '100%',
    maxHeight: Platform.OS === 'web' ? '90%' : '80%',
    position: 'relative',
  },
  desktopContent: {
    width: '60%',
    maxWidth: 800,
  },
  closeButton: {
    position: 'absolute',
    right: 15,
    top: 15,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4B0082',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B0082',
    marginBottom: 10,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: '#4B0082',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F8F8',
  },
  uploadText: {
    color: '#4B0082',
    marginTop: 10,
    fontSize: 16,
  },
  previewContainer: {
    maxHeight: 200,
    marginTop: 10,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 10,
  },
  previewItem: {
    width: 100,
    height: 100,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
  },
  removeButton: {
    position: 'absolute',
    right: -5,
    top: -5,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#4B0082',
  },
  classSelect: {
    marginBottom: 20,
  },
  multiSelect: {
    borderRadius: 8,
  },
  createButton: {
    backgroundColor: '#4B0082',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF0000',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default CreateAlbumModal;
