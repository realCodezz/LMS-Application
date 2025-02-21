import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform, Image, Dimensions } from 'react-native';
import { db } from '../../../firebaseConfig';
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { useUser } from '@/context/UserContext';
import { Calendar } from 'react-native-calendars';

interface Enrichment {
  id: string;
  EnrichmentName: string;
  EnrichmentDescription: string;
  EnrichmentDateTime: string;
  EnrichmentPrice: string;
  EnrichmentVenue: string;
  NoOfAttendees: number;
  EnrichmentImageUrl: string;
  attendees?: string[];
}

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}: ${message}`);
  } else {
    Alert.alert(title, message);
  }
};

const ParentsAllEnrichments = () => {
  const [enrichmentsData, setEnrichmentsData] = useState<Enrichment[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [imageLayout, setImageLayout] = useState<{ [key: string]: { width: number; height: number } }>({});
  const { user } = useUser();
  const selectedChildId = user.selectedChild?.id;
  
  const screenWidth = Dimensions.get('window').width;
  const maxImageWidth = Math.min(screenWidth - 40, 800); // 40 for padding, max width of 800

  useEffect(() => {
    const unsubscribeEnrichments = onSnapshot(collection(db, 'Enrichments'), (enrichmentsSnapshot) => {
      const enrichmentsList: Enrichment[] = enrichmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Enrichment[];

      setEnrichmentsData(enrichmentsList);
      setLoading(false);

      // Pre-load image dimensions
      enrichmentsList.forEach((enrichment) => {
        if (enrichment.EnrichmentImageUrl) {
          Image.getSize(enrichment.EnrichmentImageUrl, (width, height) => {
            setImageLayout(prev => ({
              ...prev,
              [enrichment.id]: {
                width: width,
                height: height
              }
            }));
          }, (error) => {
            console.error(`Error getting image size for enrichment ${enrichment.id}:`, error);
          });
        }
      });
    }, (error) => {
      console.error('Error fetching enrichments: ', error);
      setLoading(false);
    });

    return () => unsubscribeEnrichments();
  }, []);

  const calculateImageDimensions = (enrichmentId: string) => {
    const layout = imageLayout[enrichmentId];
    if (!layout) {
      return { width: 120, height: 120 }; // Default dimensions while loading
    }

    const aspectRatio = layout.width / layout.height;
    const calculatedHeight = 120; // Fixed height
    const calculatedWidth = calculatedHeight * aspectRatio;

    return {
      width: calculatedWidth,
      height: calculatedHeight
    };
  };

  const isPastEnrichment = (enrichmentDateTime: string) => {
    const enrichmentDate = new Date(enrichmentDateTime);
    return enrichmentDate < new Date();
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-GB');
  };

  const handleRegisterEnrichment = async (enrichment: Enrichment) => {
    if (!enrichment || !selectedChildId) {
      console.log("Missing enrichment or user data!");
      return;
    }

    if (isPastEnrichment(enrichment.EnrichmentDateTime)) {
      showAlert("Error", "You cannot register for past enrichments.");
      return;
    }

    try {
      const enrichmentRef = doc(db, "Enrichments", enrichment.id);
      const updatedAttendees = enrichment.attendees ? [...enrichment.attendees, selectedChildId] : [selectedChildId];
      const updatedNoOfAttendees = updatedAttendees.length;

      await updateDoc(enrichmentRef, {
        attendees: updatedAttendees,
        NoOfAttendees: updatedNoOfAttendees,
      });

      showAlert("Success", "You have registered for the enrichment.");
    } catch (error) {
      console.error("Error registering for enrichment: ", error);
      showAlert("Error", "Failed to register for the enrichment.");
    }
  };

  const handleUnregisterEnrichment = async (enrichment: Enrichment) => {
    if (!enrichment || !selectedChildId) {
      console.log("Missing enrichment or user data!");
      return;
    }

    try {
      const enrichmentRef = doc(db, "Enrichments", enrichment.id);
      const updatedAttendees = enrichment.attendees ? enrichment.attendees.filter(attendee => attendee !== selectedChildId) : [];
      const updatedNoOfAttendees = updatedAttendees.length;

      await updateDoc(enrichmentRef, {
        attendees: updatedAttendees,
        NoOfAttendees: updatedNoOfAttendees,
      });

      showAlert("Success", "You have unregistered from the enrichment.");
    } catch (error) {
      console.error("Error unregistering from enrichment: ", error);
      showAlert("Error", "Failed to unregister from the enrichment.");
    }
  };

  const enrichmentsByDate = enrichmentsData.reduce((acc, enrichment) => {
    const date = enrichment.EnrichmentDateTime.split('T')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(enrichment);
    return acc;
  }, {} as { [key: string]: Enrichment[] });

  const renderEnrichment = ({ item }: { item: Enrichment }) => {
    const isRegistered = item.attendees && item.attendees.includes(selectedChildId);
    const imageDimensions = calculateImageDimensions(item.id);
    
    return (
      <View style={styles.enrichmentContainer}>
        {item.EnrichmentImageUrl && (
          <View style={styles.enrichmentContentContainer}>
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: item.EnrichmentImageUrl }} 
                style={{
                  width: imageDimensions.width,
                  height: imageDimensions.height,
                }}
                resizeMode="cover"
              />
            </View>
            <View style={styles.enrichmentDetails}>
              <Text style={styles.enrichmentName}>{item.EnrichmentName}</Text>
              <Text style={styles.enrichmentDate}>Date: {formatDateTime(item.EnrichmentDateTime)}</Text>
              <Text style={styles.enrichmentDescription}>{item.EnrichmentDescription}</Text>
              <Text style={styles.enrichmentPrice}>Price: {item.EnrichmentPrice}</Text>
              <Text style={styles.enrichmentVenue}>Venue: {item.EnrichmentVenue}</Text>
              <Text style={styles.noOfAttendees}>Attendees: {item.NoOfAttendees}</Text>
              <TouchableOpacity
                style={[styles.registerButton, isRegistered && styles.unregisterButton]}
                onPress={() => isRegistered ? handleUnregisterEnrichment(item) : handleRegisterEnrichment(item)}
              >
                <Text style={styles.registerButtonText}>
                  {isRegistered ? 'Unregister' : 'Register'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {!item.EnrichmentImageUrl && (
          <View style={styles.enrichmentDetails}>
            <Text style={styles.enrichmentName}>{item.EnrichmentName}</Text>
            <Text style={styles.enrichmentDate}>Date: {formatDateTime(item.EnrichmentDateTime)}</Text>
            <Text style={styles.enrichmentDescription}>{item.EnrichmentDescription}</Text>
            <Text style={styles.enrichmentPrice}>Price: {item.EnrichmentPrice}</Text>
            <Text style={styles.enrichmentVenue}>Venue: {item.EnrichmentVenue}</Text>
            <Text style={styles.noOfAttendees}>Attendees: {item.NoOfAttendees}</Text>
            <TouchableOpacity
              style={[styles.registerButton, isRegistered && styles.unregisterButton]}
              onPress={() => isRegistered ? handleUnregisterEnrichment(item) : handleRegisterEnrichment(item)}
            >
              <Text style={styles.registerButtonText}>
                {isRegistered ? 'Unregister' : 'Register'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          <Calendar
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={{
              ...Object.keys(enrichmentsByDate).reduce((acc, date) => {
                acc[date] = { marked: true };
                return acc;
              }, {}),
              [selectedDate]: { selected: true, marked: true },
            }}
          />
          <FlatList
            data={enrichmentsByDate[selectedDate] || []}
            keyExtractor={(item) => item.id}
            renderItem={renderEnrichment}
            contentContainerStyle={styles.flatListContent}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  flatListContent: {
    paddingTop: 10,
  },
  enrichmentContentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    marginRight: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  enrichmentContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  enrichmentDetails: {
    flex: 1,
    padding: 15,
    justifyContent: 'center',
  },
  enrichmentName: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#007BFF',
    marginBottom: 5,
  },
  enrichmentDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  enrichmentDate: {
    fontSize: 14,
    color: '#333',
    marginBottom: 3,
  },
  enrichmentPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  enrichmentVenue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  noOfAttendees: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  registerButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#007BFF',
    borderRadius: 5,
  },
  unregisterButton: {
    backgroundColor: '#FF6347',
  },
  registerButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default ParentsAllEnrichments;
