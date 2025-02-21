import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Platform,
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Dimensions,
  TextInput,
  RefreshControl
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { db } from "../../../firebaseConfig";
import { storage } from "../../../firebaseConfig";
import { getDownloadURL, listAll, ref } from "firebase/storage";
import { useUser } from "@/context/UserContext";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { useRouter, useLocalSearchParams, useNavigation } from "expo-router";
import CreateAlbumModal from "./CreateAlbumModal";
import FacialRecognition from './FacialRecognition';

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

interface Album {
  id: string;
  albumName: string;
  createdByID: string;
  createdByName: string;
  createdByEmail: string;
  createdAt: Timestamp | null;
  files?: string[];
  public: boolean;
  classes: string[];
  coverImage: string;
}

interface ClassData {
  id: string;
  name: string;
}

const placeholderImage = "https://via.placeholder.com/150";

type SortOption = {
  label: string;
  value: string;
  direction: 'asc' | 'desc';
};

const sortOptions: SortOption[] = [
  { label: 'Name (A-Z)', value: 'name', direction: 'asc' },
  { label: 'Name (Z-A)', value: 'name', direction: 'desc' },
  { label: 'Date (Newest)', value: 'date', direction: 'desc' },
  { label: 'Date (Oldest)', value: 'date', direction: 'asc' },
  { label: 'Private First', value: 'privacy', direction: 'desc' },
  { label: 'Public First', value: 'privacy', direction: 'asc' },
];

const AlbumsPage = () => {
  const { user } = useUser();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [selectedSort, setSelectedSort] = useState<SortOption>(sortOptions[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [faceMatchResults, setFaceMatchResults] = useState<Album[]>([]);
  const router = useRouter();
  const navigation = useNavigation();
  const { refresh } = useLocalSearchParams();

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const albumsCollection = collection(db, "albums");
      const albumSnapshot = await getDocs(albumsCollection);
      const albumList: Album[] = await Promise.all(
        albumSnapshot.docs.map(async (doc) => {
          const albumData = doc.data();
          let coverImage = placeholderImage;

          if (albumData.files && albumData.files.length > 0) {
            try {
              const fileRef = ref(
                storage,
                `albums/${albumData.createdByEmail}/${albumData.albumName}/${albumData.files[0]}`
              );
              coverImage = await getDownloadURL(fileRef);
            } catch (error) {
              console.error("Error fetching cover image:", error);
            }
          }

          return {
            id: doc.id,
            albumName: albumData.albumName,
            createdByID: albumData.createdByID,
            createdByName: albumData.createdByName,
            createdByEmail: albumData.createdByEmail,
            createdAt: albumData.createdAt || null,
            files: albumData.files || [],
            public: albumData.public || false,
            classes: albumData.classes || [],
            coverImage,
          };
        })
      );

      let filteredAlbums = albumList;
      
      // If user is not an admin or teacher, filter the albums
      if (user?.type?.toLowerCase() !== "admin" && user?.type?.toLowerCase() !== "teacher") {
        filteredAlbums = albumList.filter((album) => {
          // Public albums are visible to everyone
          if (album.public) return true;
          
          // For private albums, check if user is a parent and has a selected child in the album's classes
          if (user?.type?.toLowerCase() === "parent" && user.selectedChild) {
            return album.classes.includes(user.selectedChild.className);
          }
          
          return false;
        });
      }

      setAlbums(filteredAlbums);
    } catch (error) {
      console.error("Error fetching albums:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={{ marginRight: 16 }}
          onPress={() => setSortModalVisible(prev => !prev)}
        >
          <Ionicons name="funnel-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const sortAlbums = (albums: Album[], sortOption: SortOption) => {
    return [...albums].sort((a, b) => {
      const direction = sortOption.direction === 'asc' ? 1 : -1;
      
      switch (sortOption.value) {
        case 'name':
          return direction * a.albumName.localeCompare(b.albumName);
        case 'date':
          if (!a.createdAt || !b.createdAt) return 0;
          return direction * (a.createdAt.toMillis() - b.createdAt.toMillis());
        case 'privacy':
          return direction * (Number(b.public) - Number(a.public));
        default:
          return 0;
      }
    });
  };

  useEffect(() => {
    if (albums.length > 0) {
      const sortedAlbums = sortAlbums(albums, selectedSort);
      setAlbums(sortedAlbums);
    }
  }, [selectedSort]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "Classes"));
        const classList: ClassData[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name as string,
        }));
        setClasses(classList);
      } catch (error) {
        console.error("Error fetching classes:", error);
      }
    };

    fetchClasses();
    fetchAlbums();
  }, [refresh]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchAlbums().then(() => setRefreshing(false));
  }, []);

  const handleFaceMatches = (matchedAlbums: Album[]) => {
    setFaceMatchResults(matchedAlbums);
    // If matches found, filter the display to show only matched albums
    if (matchedAlbums.length > 0) {
      setSearchQuery(''); // Clear text search when showing face matches
    }
  };

  // Modify the filtered albums logic to include face match results
  const filteredAlbums = faceMatchResults.length > 0 
    ? faceMatchResults 
    : albums.filter(album => 
        album.albumName.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <ScrollView 
      style={styles.container as any}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#4B0082']} // Android
          tintColor="#4B0082" // iOS
        />
      }
    >
      {(user?.type?.toLowerCase() === "admin" || user?.type?.toLowerCase() === "teacher") && (
        <View style={styles.createButtonContainer as any}>   
          <TouchableOpacity 
            style={styles.createButton as any}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add-circle-outline" size={24} color="#FFF" />
            <Text style={styles.createButtonText as any}>Create New Album</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.searchContainer as any}>
        <View style={styles.searchInputContainer as any}>
          <TextInput
            style={styles.searchInput as any}
            placeholder="Search albums..."
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setFaceMatchResults([]); // Clear face matches when text searching
            }}
          />
          {Platform.OS === 'web' && (
            <TouchableOpacity 
              style={styles.refreshButton as any} 
              onPress={onRefresh}
            >
              <Ionicons name="refresh-outline" size={24} color="#4B0082" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={sortModalVisible}
        onRequestClose={() => setSortModalVisible(false)}
      >
        <View style={styles.modalOverlay as any}>
          <View style={styles.sortModalContent as any}>
            <Text style={styles.sortModalTitle as any}>Sort Albums</Text>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={`${option.value}-${option.direction}`}
                style={[
                  styles.sortOption,
                  selectedSort === option && styles.selectedSortOption as any
                ]}
                onPress={() => {
                  setSelectedSort(option);
                  setSortModalVisible(false);
                }}
              >
                <Text style={[
                  styles.sortOptionText,
                  selectedSort === option && styles.selectedSortOptionText as any
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.cancelButton as any}
              onPress={() => setSortModalVisible(false)}
            >
              <Text style={styles.cancelButtonText as any}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <CreateAlbumModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        classes={classes}
        user={user}
        onSuccess={() => {
          fetchAlbums();
          setModalVisible(false);
        }}
      />
      <FacialRecognition 
        albums={albums}
        onMatchFound={handleFaceMatches}
      />

      {loading ? (
        <View style={styles.loadingContainer as any}>
          <ActivityIndicator size="large" color="#4B0082" />
        </View>
      ) : filteredAlbums.length === 0 ? (
        <View style={styles.emptyContainer as any}>
          <Ionicons name="images-outline" size={64} color="#4B0082" />
          <Text style={styles.emptyText as any}>
            {faceMatchResults.length > 0 ? 'No matching faces found' : 'No albums found'}
          </Text>
        </View>
      ) : (
        <View style={styles.gridContainer as any}>
          {filteredAlbums.map((album) => (
            <TouchableOpacity
              key={album.id}
              style={styles.albumCard as any}
              onPress={() => {
                router.push({
                  pathname: "/(app)/album/[id]" as const,
                  params: { 
                    id: album.id,
                    createdByEmail: album.createdByEmail,
                    albumName: album.albumName
                  }
                });
              }}
            >
              <Image source={{ uri: album.coverImage }} style={styles.albumCover as any} />
              <View style={styles.albumInfo as any}>
                <Text style={styles.albumName as any}>{album.albumName}</Text>
                <Text style={styles.albumCreator as any}>By {album.createdByName}</Text>
                <View style={styles.datePrivateContainer as any}>
                  <Text style={styles.albumDate as any}>
                    {album.createdAt
                      ? new Date(album.createdAt.seconds * 1000).toLocaleDateString()
                      : "Unknown date"}
                  </Text>
                  {!album.public && (
                    <View style={styles.privateTag as any}>
                      <Ionicons name="lock-closed" size={12} color="#4B0082" />
                      <Text style={styles.privateText as any}>Private</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

export default AlbumsPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  gridContainer: {
    ...Platform.select({
      web: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 20,
        padding: 20,
      },
      default: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        padding: 10,
        paddingBottom: 20,
      },
    }),
  },
  albumCard: {
    ...Platform.select({
      web: {
        width: '100%',
        margin: 0,
      },
      default: {
        width: '48%',
        aspectRatio: 0.8, 
        marginBottom: 15,
      },
    }),
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  createButton: {
    flexDirection: 'row',
    backgroundColor: '#4B0082',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
      },
    }),
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto', web: 'system-ui' }),
  },
  sortButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: Platform.OS === 'web' ? [{ translateX: -20 }, { translateY: -20 }] : undefined,
    ...Platform.select({
      ios: {
        marginLeft: -20,
        marginTop: -20,
      },
      android: {
        marginLeft: -20,
        marginTop: -20,
      }
    }),
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sortModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  sortModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  sortOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  selectedSortOption: {
    backgroundColor: '#4B0082',
  },
  sortOptionText: {
    fontSize: 16,
    color: '#000',
  },
  selectedSortOptionText: {
    color: '#fff',
  },
  cancelButton: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#4B0082',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    color: '#4B0082',
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto', web: 'system-ui' }),
  },
  albumCover: {
    width: '100%',
    ...Platform.select({
      web: {
        height: 200,
      },
      default: {
        height: '50%', 
      },
    }),
    resizeMode: 'cover',
  },
  albumInfo: {
    ...Platform.select({
      web: {
        padding: 10,
      },
      default: {
        padding: 10,
        paddingRight: 8,
        height: '50%', 
      },
    }),
    flex: 1,
    justifyContent: 'space-between',
  },
  albumName: {
    ...Platform.select({
      web: {
        fontSize: 18,
      },
      default: {
        fontSize: 14,
      },
    }),
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#4B0082',
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto', web: 'system-ui' }),
  },
  albumCreator: {
    ...Platform.select({
      web: {
        fontSize: 14,
      },
      default: {
        fontSize: 12,
      },
    }),
    color: '#666',
    marginBottom: 4,
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto', web: 'system-ui' }),
  },
  albumDate: {
    ...Platform.select({
      web: {
        fontSize: 12,
      },
      default: {
        fontSize: 10,
      },
    }),
    color: '#999',
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto', web: 'system-ui' }),
  },
  datePrivateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
    paddingBottom: Platform.OS === 'web' ? 0 : 0,
  },
  privateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6E6FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  privateText: {
    ...Platform.select({
      web: {
        fontSize: 12,
      },
      default: {
        fontSize: 10,
      },
    }),
    color: '#4B0082',
    marginLeft: 4,
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto', web: 'system-ui' }),
  },
  createButtonContainer: {
    paddingBottom: Platform.OS === 'web' ? 15 : undefined,
    ...Platform.select({
      ios: {
        padding: 10,
      },
      android: {
        padding: 10,
      },
      web: {
        padding: 20,
      },
    }),
  },
  searchContainer: {
    padding: 16,
    backgroundColor: "",
    ...Platform.select({
      web: {
        top: 0,
        zIndex: 1,
      },
    }),
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  refreshButton: {
    height: 40,
    width: 40,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#ddd",
  },
});
