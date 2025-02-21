import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  Image, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  Dimensions, 
  Platform, 
  Alert,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import * as FileSystem from "expo-file-system";
import { getStorage, ref, listAll, getDownloadURL, deleteObject } from "firebase/storage";
import { doc, deleteDoc, getDoc, getDocs, collection, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useVideoPlayer, VideoView } from 'expo-video';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from "@/context/UserContext";
import EditAlbumModal from "./EditAlbumModal";
import * as MediaLibrary from 'expo-media-library';

interface ClassData {
  id: string;
  name: string;
}

const AlbumDetailsPage = () => {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [albumData, setAlbumData] = useState<{
    isPublic: boolean;
    classes: string[];
    createdByEmail: string;
  }>({ isPublic: true, classes: [], createdByEmail: '' });
  const params = useLocalSearchParams();
  const { id, createdByEmail, albumName } = params;
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useUser();
  const [deleting, setDeleting] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [showKebabMenu, setShowKebabMenu] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showDeletePhotosConfirmModal, setShowDeletePhotosConfirmModal] = useState(false);
  const [photosToDelete, setPhotosToDelete] = useState<string[]>([]);

  const screenWidth = Dimensions.get("window").width;
  const isDesktop = screenWidth > 768;
  const photoSize = isDesktop ? 400 : screenWidth / 2 - 15;

  const player = useVideoPlayer(selectedPhoto, (player) => {
    if (player) {
      player.play();
    }
  });

  const fetchPhotos = async (): Promise<void> => {
    if (!createdByEmail || typeof createdByEmail !== "string") return;
    if (!albumName || typeof albumName !== "string") return;

    const storage = getStorage();
    const albumRef = ref(storage, `albums/${createdByEmail}/${albumName}`);

    try {
      const result = await listAll(albumRef); // List all files in the album folder
      const photoURLs = await Promise.all(
        result.items
          .filter((item) => item.name !== ".keep") // Filter out the .keep file
          .map((item) => getDownloadURL(item)) // Get download URLs for each file
      );
      setPhotos(photoURLs);
    } catch (error) {
      console.error("Error fetching photos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedPhotos(new Set());
    setLoading(true);
    
    const albumRef = doc(db, "albums", id as string);
    
    // Set up real-time listener for album changes
    const unsubscribe = onSnapshot(albumRef, async (docSnapshot) => {
      try {
        if (!docSnapshot.exists()) {
          Alert.alert("Error", "Album not found");
          router.back();
          return;
        }

        const data = docSnapshot.data();
        const isPublic = data.public ?? true;
        const albumClasses = data.classes ?? [];

        const userType = user?.type?.toLowerCase();
        const hasAccess = 
          userType === "admin" || 
          userType === "teacher" ||
          user?.email === data.createdByEmail ||
          isPublic ||
          (userType === "parent" && 
           user?.selectedChild &&
           albumClasses.includes(user.selectedChild.className));

        if (!hasAccess) {
          Alert.alert("Access Denied", "You don't have permission to view this album");
          router.back();
          return;
        }

        setAlbumData({
          isPublic,
          classes: albumClasses,
          createdByEmail: data.createdByEmail,
        });

        const querySnapshot = await getDocs(collection(db, "Classes"));
        const classList: ClassData[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name as string,
        }));
        setClasses(classList);

        await fetchPhotos();
      } catch (error) {
        console.error("Error fetching album data:", error);
        Alert.alert("Error", "Failed to load album");
        router.back();
      } finally {
        setLoading(false);
      }
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [createdByEmail, albumName, id]);

  useEffect(() => {
    const fetchAndGenerateThumbnails = async () => {
      await fetchPhotos(); // Fetch all photo URLs
    };
  
    fetchAndGenerateThumbnails();
  }, [createdByEmail, albumName]); // Only run when these change
  
  useEffect(() => {
    if (photos.length > 0) {
      generateThumbnailsForVideos(photos); // Generate thumbnails after photos are updated
    }
  }, [photos]); // Trigger only when photos are updated

  const isMounted = useRef(true);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={{ marginRight: 16 }}
          onPress={() => setShowKebabMenu(prev => !prev)}
        >
          <Ionicons name="ellipsis-vertical" size={24} color="#FFF" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const generateThumbnailsForVideos = async (urls: string[]) => {
    try {
      console.log("All URLs:", urls);
  
      // Filter video URLs by checking the pathname for video file extensions
      const videoUrls = urls.filter((url) => {
        const pathname = new URL(url).pathname; // Extract the pathname
        return /\.(mp4|mov|avi|mkv|webm)$/i.test(pathname); // Check if it ends with a video extension
      });
  
      console.log("Video URLs:", videoUrls);
  
      // Generate thumbnails for video URLs
      const thumbnailPromises = videoUrls.map(async (url) => {
        try {
          const { uri } = await VideoThumbnails.getThumbnailAsync(
            url, 
            {
            time: 1000, // Capture at 5 seconds
          });
          return { videoUrl: url, thumbnail: uri };
        } catch (err) {
          console.error(`Error generating thumbnail for ${url}:`, err);
          return { videoUrl: url, thumbnail: null };
        }
      });
  
      const thumbnailResults = await Promise.all(thumbnailPromises);
  
      // Update the thumbnails state
      setThumbnails((prev) =>
        thumbnailResults.reduce(
          (acc, { videoUrl, thumbnail }) =>
            thumbnail ? { ...acc, [videoUrl]: thumbnail } : acc,
          prev
        )
      );
    } catch (error) {
      console.error("Error generating thumbnails for videos:", error);
    }
  };

  const togglePhotoSelection = (url: string) => {
    setSelectedPhotos((prev) => {
      const updated = new Set(prev);
      if (updated.has(url)) {
        updated.delete(url);
      } else {
        updated.add(url);
      }
      return updated;
    });
  };

  const goToNextPhoto = () => {
    if (!selectedPhoto) return;
    const currentIndex = photos.indexOf(selectedPhoto);
    if (currentIndex < photos.length - 1) {
      setSelectedPhoto(photos[currentIndex + 1]);
    }
  };
  
  const goToPreviousPhoto = () => {
    if (!selectedPhoto) return;
    const currentIndex = photos.indexOf(selectedPhoto);
    if (currentIndex > 0) {
      setSelectedPhoto(photos[currentIndex - 1]);
    }
  };

  const downloadSelectedPhotos = async () => {
    if (selectedPhotos.size === 0) {
      Alert.alert("No photos selected", "Please select at least one photo to download.");
      return;
    }
  
    try {
      if (Platform.OS === "web") {
        // Web/Desktop: Trigger browser downloads for each selected photo
        selectedPhotos.forEach(async (photoUrl) => {
          try {
            const response = await fetch(photoUrl);
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
  
            const blob = await response.blob();
  
            // Extract the file name from the URL
            const decodedUrl = decodeURIComponent(photoUrl);
            const fileName = decodedUrl.split("/").pop()?.split("?")[0] || "photo.jpg";
            const formattedFileName = `${albumName}_${fileName}`;
  
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = formattedFileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
  
            URL.revokeObjectURL(link.href);
          } catch (error:any) {
            console.error("Error fetching photo:", error.message);
            alert("Failed to fetch and download photo. Please try again.");
          }
        });
      } else {
        // Request permissions first
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Please grant permission to save photos to your device.');
          return;
        }

        let successCount = 0;
        for (const photoUrl of selectedPhotos) {
          try {
            const decodedUrl = decodeURIComponent(photoUrl);
            const fileName = decodedUrl.split("/").pop()?.split("?")[0] || "photo.jpg";
            const formattedFileName = `${albumName}_${fileName}`;
            
            // Download to temp location
            const tempUri = `${FileSystem.cacheDirectory}${formattedFileName}`;
            const downloadResult = await FileSystem.downloadAsync(photoUrl, tempUri);
            
            if (downloadResult.status === 200) {
              // Save to media library
              await MediaLibrary.saveToLibraryAsync(tempUri);
              successCount++;
              
              // Clean up temp file
              await FileSystem.deleteAsync(tempUri);
            }
          } catch (error) {
            console.error('Error downloading photo:', error);
          }
        }

        if (successCount > 0) {
          Alert.alert(
            'Download Complete',
            `Successfully saved ${successCount} photo${successCount !== 1 ? 's' : ''} to your device.`
          );
        } else {
          Alert.alert('Download Failed', 'There was an error downloading the photos. Please try again.');
        }
      }
    } catch (error) {
      console.error("Error downloading photos:", error);
      Alert.alert("Error", "Could not download selected photos. Please try again.");
    }
  };

  const handleDeletePhotos = async (photosToDelete: string[]) => {
    setDeleting(true);
    try {
      const storage = getStorage();
      const deletePromises = photosToDelete.map(async (photoUrl) => {
        const fileName = decodeURIComponent(photoUrl).split('/').pop()?.split('?')[0];
        if (fileName) {
          const fileRef = ref(storage, `albums/${createdByEmail}/${albumName}/${fileName}`);
          await deleteObject(fileRef);
          return fileName;
        }
      });

      await Promise.all(deletePromises);

      const albumRef = doc(db, 'albums', id as string);
      const remainingPhotos = photos.filter(
        (photo: string) => !photosToDelete.includes(photo)
      );

      if (remainingPhotos.length === 0) {
        await deleteDoc(albumRef);
        router.push('/album/Album?refresh=true');
      } else {
        await updateDoc(albumRef, {
          files: remainingPhotos.map((url: string) => {
            const fileName = decodeURIComponent(url).split('/').pop()?.split('?')[0];
            return fileName || '';
          })
        });
        setPhotos(remainingPhotos);
        setSelectedPhotos(new Set());
      }
    } catch (error) {
      console.error("Error deleting album:", error);
      Alert.alert("Error", "Failed to delete album. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteClick = () => {
    if (deleting) return;
    
    if (Platform.OS === 'web') {
      setShowDeleteConfirmModal(true);
    } else {
      Alert.alert(
        "Delete Album", 
        "Are you sure you want to delete this album? This action cannot be undone.", 
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await handleDeletePhotos(photos);
              } catch (error) {
                console.error("Error deleting album:", error);
                Alert.alert("Error", "Failed to delete album. Please try again.");
              }
            },
          },
        ],
        { cancelable: false }
      );
    }
  };

  const handleDeleteSelectedPhotos = (photos: string[]) => {
    if (deleting) return;
    setPhotosToDelete(photos);
    
    if (Platform.OS === 'web') {
      setShowDeletePhotosConfirmModal(true);
    } else {
      Alert.alert(
        "Delete Photos", 
        `Are you sure you want to delete ${photos.length} selected photo${photos.length !== 1 ? 's' : ''}? This action cannot be undone.`, 
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await handleDeletePhotos(photos);
              } catch (error) {
                console.error("Error deleting photos:", error);
                Alert.alert("Error", "Failed to delete photos. Please try again.");
              }
            },
          },
        ],
        { cancelable: false }
      );
    }
  };

  const toggleSelectAll = () => {
    if (selectedPhotos.size === photos.length) {
      setSelectedPhotos(new Set());
    } else {
      setSelectedPhotos(new Set(photos));
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4B0082" />
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={() => showKebabMenu && setShowKebabMenu(false)}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.header}>{albumName}</Text>
          {isDesktop ? (
            <View style={styles.headerButtons}>
              {(user?.type?.toLowerCase() === "admin" || user?.email === albumData.createdByEmail) && (
                <>
                  <TouchableOpacity 
                    style={[styles.button, styles.editButton]} 
                    onPress={() => setShowEditModal(true)}
                  >
                    <Ionicons name="pencil-outline" size={24} color="#FFF" />
                    <Text style={styles.buttonText}>Edit Album</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.button, { backgroundColor: '#DC3545' }]} 
                    onPress={handleDeleteClick}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <Ionicons name="trash-outline" size={24} color="#FFF" />
                        <Text style={styles.buttonText}>Delete Album</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
              {selectedPhotos.size > 0 && (
                <>
                  <TouchableOpacity 
                    style={[styles.button]} 
                    onPress={downloadSelectedPhotos}
                  >
                    <Ionicons name="download-outline" size={24} color="#FFF" />
                    <Text style={styles.buttonText}>
                      Download ({selectedPhotos.size})
                    </Text>
                  </TouchableOpacity>
                  {(user?.type?.toLowerCase() === "admin" || user?.email === albumData.createdByEmail) && (
                    <TouchableOpacity 
                      style={[styles.button, { backgroundColor: '#DC3545' }]} 
                      onPress={() => handleDeleteSelectedPhotos(Array.from(selectedPhotos))}
                      disabled={deleting}
                    >
                      <Ionicons name="trash-outline" size={24} color="#FFF" />
                      <Text style={styles.buttonText}>
                        Delete ({selectedPhotos.size})
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
              <TouchableOpacity 
                style={[styles.button, styles.selectAllButton]} 
                onPress={toggleSelectAll}
              >
                <Ionicons 
                  name={selectedPhotos.size === photos.length ? "checkbox" : "square-outline"} 
                  size={24} 
                  color="#FFF" 
                />
                <Text style={styles.buttonText}>
                  {selectedPhotos.size === photos.length ? "Deselect All" : "Select All"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {showKebabMenu && (
                <TouchableWithoutFeedback>
                  <View style={styles.kebabMenu}>
                    <TouchableOpacity 
                      style={styles.kebabMenuItem}
                      onPress={() => {
                        toggleSelectAll();
                        setShowKebabMenu(false);
                      }}
                    >
                      <Ionicons 
                        name={selectedPhotos.size === photos.length ? "checkbox" : "square-outline"} 
                        size={24} 
                        color="#4B0082" 
                      />
                      <Text style={styles.kebabMenuText}>
                        {selectedPhotos.size === photos.length ? "Deselect All" : "Select All"}
                      </Text>
                    </TouchableOpacity>
                    
                    {(user?.type?.toLowerCase() === "admin" || user?.email === albumData.createdByEmail) && (
                      <>
                        <TouchableOpacity 
                          style={styles.kebabMenuItem}
                          onPress={() => {
                            setShowEditModal(true);
                            setShowKebabMenu(false);
                          }}
                        >
                          <Ionicons name="pencil-outline" size={24} color="#4B0082" />
                          <Text style={styles.kebabMenuText}>Edit Album</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.kebabMenuItem}
                          onPress={() => {
                            handleDeleteClick();
                            setShowKebabMenu(false);
                          }}
                          disabled={deleting}
                        >
                          {deleting ? (
                            <ActivityIndicator size="small" color="#4B0082" />
                          ) : (
                            <>
                              <Ionicons name="trash-outline" size={24} color="#DC3545" />
                              <Text style={[styles.kebabMenuText, { color: '#DC3545' }]}>Delete Album</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </>
                    )}

                    {selectedPhotos.size > 0 && (
                      <>
                        <TouchableOpacity 
                          style={styles.kebabMenuItem}
                          onPress={() => {
                            downloadSelectedPhotos();
                            setShowKebabMenu(false);
                          }}
                        >
                          <Ionicons name="download-outline" size={24} color="#4B0082" />
                          <Text style={styles.kebabMenuText}>
                            Download ({selectedPhotos.size})
                          </Text>
                        </TouchableOpacity>
                        {(user?.type?.toLowerCase() === "admin" || user?.email === albumData.createdByEmail) && (
                          <TouchableOpacity 
                            style={styles.kebabMenuItem}
                            onPress={() => {
                              handleDeleteSelectedPhotos(Array.from(selectedPhotos));
                              setShowKebabMenu(false);
                            }}
                          >
                            <Ionicons name="trash-outline" size={24} color="#DC3545" />
                            <Text style={[styles.kebabMenuText, { color: '#DC3545' }]}>
                              Delete ({selectedPhotos.size})
                            </Text>
                          </TouchableOpacity>
                        )}
                      </>
                    )}
                  </View>
                </TouchableWithoutFeedback>
              )}
            </>
          )}
        </View>
        {photos.length > 0 ? (
          <FlatList
            data={photos}
            numColumns={isDesktop ? 4 : 3}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <View style={[styles.photoContainer, !isDesktop && styles.photoContainerMobile]}>
                <TouchableOpacity
                  style={[styles.photoWrapper, selectedPhotos.has(item) && styles.selectedPhoto]}
                  onPress={() => setSelectedPhoto(item)}
                >
                  <Image
                    source={{ uri: thumbnails[item] || item }}
                    style={styles.photo}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    selectedPhotos.has(item)
                      ? styles.checkboxSelected
                      : styles.checkboxUnselected,
                  ]}
                  onPress={() => togglePhotoSelection(item)}
                >
                  <Ionicons 
                    name={selectedPhotos.has(item) ? "checkmark-circle" : "ellipse-outline"} 
                    size={24} 
                    color={selectedPhotos.has(item) ? "#4B0082" : "#FFF"} 
                  />
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={styles.photosContainer}
          />
        ) : (
          <View style={styles.loadingContainer}>
            <Text>No photos found in this album.</Text>
          </View>
        )}
        <Modal
          visible={!!selectedPhoto}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedPhoto(null)}
        >
          <View style={styles.modalContainer}>
            {selectedPhoto && (
              <>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.chevronLeft,
                    photos.indexOf(selectedPhoto) === 0 && styles.disabledButton,
                  ]}
                  onPress={goToPreviousPhoto}
                  disabled={photos.indexOf(selectedPhoto) === 0}
                >
                  <Ionicons name="chevron-back" size={30} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.chevronRight,
                    photos.indexOf(selectedPhoto) === photos.length - 1 && styles.disabledButton,
                  ]}
                  onPress={goToNextPhoto}
                  disabled={photos.indexOf(selectedPhoto) === photos.length - 1}
                >
                  <Ionicons name="chevron-forward" size={30} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSelectedPhoto(null)}
                >
                  <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>
                {new URL(selectedPhoto).pathname.match(/\.(mp4|mov|avi|mkv)$/i) ? (
                  Platform.OS === "web" ? (
                    <VideoView 
                      player={player} 
                      style={{ width: "90%", height: "70%" }}
                    />
                  ) : (
                    <VideoView
                      player={player}
                      style={{
                        width: Dimensions.get("window").width,
                        height: Dimensions.get("window").width * (9 / 16),
                      }}
                    />
                  )
                ) : (
                  <Image source={{ uri: selectedPhoto }} style={styles.modalPhoto} />
                )}
              </>
            )}
          </View>
        </Modal>
        <EditAlbumModal
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          classes={classes}
          user={user}
          albumId={id as string}
          albumName={albumName as string}
          createdByEmail={createdByEmail as string}
          currentPhotos={photos}
          isPublic={albumData.isPublic}
          currentClasses={albumData.classes}
          onSuccess={() => {
            fetchPhotos();
            setShowEditModal(false);
          }}
        />
        <Modal
          visible={showDeleteConfirmModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDeleteConfirmModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.confirmModalContent}>
              <Text style={styles.confirmModalTitle}>Delete Album</Text>
              <Text style={styles.confirmModalText}>
                Are you sure you want to delete this album? This action cannot be undone.
              </Text>
              <View style={styles.confirmModalButtons}>
                <TouchableOpacity
                  style={[styles.confirmModalButton, styles.cancelButton]}
                  onPress={() => setShowDeleteConfirmModal(false)}
                >
                  <Text style={styles.confirmModalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmModalButton, styles.deleteButton]}
                  onPress={async () => {
                    try {
                      await handleDeletePhotos(photos);
                      setShowDeleteConfirmModal(false);
                    } catch (error) {
                      console.error("Error deleting album:", error);
                      Alert.alert("Error", "Failed to delete album. Please try again.");
                    }
                  }}
                  disabled={deleting}
                >
                  {deleting ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.confirmModalButtonText}>Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <Modal
          visible={showDeletePhotosConfirmModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDeletePhotosConfirmModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.confirmModalContent}>
              <Text style={styles.confirmModalTitle}>Delete Photos</Text>
              <Text style={styles.confirmModalText}>
                Are you sure you want to delete {photosToDelete.length} selected photo{photosToDelete.length !== 1 ? 's' : ''}? This action cannot be undone.
              </Text>
              <View style={styles.confirmModalButtons}>
                <TouchableOpacity
                  style={[styles.confirmModalButton, styles.cancelButton]}
                  onPress={() => setShowDeletePhotosConfirmModal(false)}
                >
                  <Text style={styles.confirmModalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmModalButton, styles.deleteButton]}
                  onPress={async () => {
                    try {
                      await handleDeletePhotos(photosToDelete);
                      setShowDeletePhotosConfirmModal(false);
                    } catch (error) {
                      console.error("Error deleting photos:", error);
                      Alert.alert("Error", "Failed to delete photos. Please try again.");
                    }
                  }}
                  disabled={deleting}
                >
                  {deleting ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.confirmModalButtonText}>Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default AlbumDetailsPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4B0082",
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4B0082",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  selectAllButton: {
    backgroundColor: "#4B0082",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: 'OpenSans_400Regular',
  },
  deleteButton: {
    backgroundColor: "#DC3545",
  },
  editButton: {
    backgroundColor: '#4B0082',
  },
  photoContainer: {
    flex: 1,
    margin: 4,
    aspectRatio: 1,
    maxWidth: '25%',
    position: 'relative',
  },
  photoContainerMobile: {
    maxWidth: '33.33%',
  },
  photoWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  selectedPhoto: {
    opacity: 0.8,
  },
  checkbox: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  checkboxSelected: {
    backgroundColor: '#FFF',
  },
  checkboxUnselected: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  photosContainer: {
    padding: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  modalBackground: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalPhoto: {
    width: "90%",
    height: "80%",
    resizeMode: "contain",
  },
  modalButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 3,
    zIndex: 1,
  },
  chevronLeft: {
    position: "absolute",
    left: 20,
    top: "50%",
    transform: [{ translateY: -20 }],
    zIndex: 1,
  },
  chevronRight: {
    position: "absolute",
    right: 20,
    top: "50%",
    transform: [{ translateY: -20 }],
    zIndex: 1,
  },
  closeButton: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#f8f8f8",
  },
  kebabMenu: {
    position: 'absolute',
    top: 56,
    right: 16,
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 8,
    minWidth: 200,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  kebabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  kebabMenuText: {
    color: '#4B0082',
    fontSize: 16,
    fontFamily: 'OpenSans_400Regular',
  },
  disabledButton: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 20,
    width: Platform.OS === 'web' ? 400 : '90%',
    maxWidth: 400,
  },
  confirmModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#4B0082',
  },
  confirmModalText: {
    fontSize: 16,
    marginBottom: 20,
    color: '#333',
  },
  confirmModalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  confirmModalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    minWidth: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  deleteButton: {
    backgroundColor: '#DC3545',
  },
  confirmModalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
});