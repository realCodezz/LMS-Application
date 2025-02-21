import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
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
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';

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

interface EditAlbumModalProps {
  visible: boolean;
  onClose: () => void;
  classes: { id: string; name: string; }[];
  user: User | null;
  albumId: string;
  albumName: string;
  createdByEmail: string;
  currentPhotos: string[];
  isPublic: boolean;
  currentClasses: string[];
  onSuccess: () => void;
}

const EditAlbumModal: React.FC<EditAlbumModalProps> = ({
  visible,
  onClose,
  classes,
  user,
  albumId,
  albumName,
  createdByEmail,
  currentPhotos,
  isPublic: initialIsPublic,
  currentClasses,
  onSuccess,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [selectedClasses, setSelectedClasses] = useState<string[]>(currentClasses);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const screenWidth = Dimensions.get('window').width;
  const isDesktop = Platform.OS === 'web' && screenWidth > 768;

  useEffect(() => {
    setIsPublic(initialIsPublic);
    setSelectedClasses(currentClasses);
  }, [initialIsPublic, currentClasses]);

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

  const handleRemoveNewFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveChanges = async () => {
    if (!isPublic && selectedClasses.length === 0) {
      setError('Please select at least one class or make the album public');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const storagePath = `albums/${createdByEmail}/${albumName}`;
      
      // Upload new files
      const uploadPromises = selectedFiles.map(async (file) => {
        const fileRef = ref(storage, `${storagePath}/${file.fileName}`);
        const response = await fetch(file.uri);
        const blob = await response.blob();
        await uploadBytes(fileRef, blob);
        return file.fileName;
      });

      await Promise.all(uploadPromises);

      // Update album metadata
      const albumRef = doc(db, 'albums', albumId);
      await updateDoc(albumRef, {
        public: isPublic,
        classes: isPublic ? [] : selectedClasses,
        files: [...currentPhotos.map(url => {
          const fileName = decodeURIComponent(url).split('/').pop()?.split('?')[0];
          return fileName || '';
        }), ...selectedFiles.map(f => f.fileName)],
      });
      
      onSuccess();
      onClose();
      setSelectedFiles([]);
    } catch (error) {
      console.error('Error updating album:', error);
      setError('Failed to update album. Please try again.');
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

          <Text style={styles.title}>Edit Album</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add New Photos</Text>
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
                      onPress={() => handleRemoveNewFile(index)}
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
                  onSelectedItemsChange={setSelectedClasses}
                  selectedItems={selectedClasses}
                  selectText="Select Classes"
                  searchInputPlaceholderText="Search Classes..."
                  tagRemoveIconColor="#4B0082"
                  tagBorderColor="#4B0082"
                  tagTextColor="#4B0082"
                  selectedItemTextColor="#4B0082"
                  selectedItemIconColor="#4B0082"
                  itemTextColor="#000"
                  styleMainWrapper={styles.multiSelect}
                />
              </View>
            )}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSaveChanges}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
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
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxHeight: '90%',
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
    fontFamily: 'OpenSans_400Regular',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B0082',
    marginBottom: 10,
    fontFamily: 'OpenSans_400Regular',
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
    fontFamily: 'OpenSans_400Regular',
  },
  previewContainer: {
    maxHeight: 200,
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
  photoToDelete: {
    opacity: 0.5,
  },
  removeButton: {
    position: 'absolute',
    right: -5,
    top: -5,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  deleteButton: {
    position: 'absolute',
    right: -5,
    top: -5,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 2,
  },
  undoButton: {
    backgroundColor: '#FFF',
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
    fontFamily: 'OpenSans_400Regular',
    color: '#4B0082',
  },
  classSelect: {
    marginBottom: 20,
  },
  multiSelect: {
    borderRadius: 8,
  },
  saveButton: {
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
    fontFamily: 'OpenSans_400Regular',
  },
  errorText: {
    color: '#FF0000',
    textAlign: 'center',
    marginTop: 10,
    fontFamily: 'OpenSans_400Regular',
  },
});

export default EditAlbumModal;
