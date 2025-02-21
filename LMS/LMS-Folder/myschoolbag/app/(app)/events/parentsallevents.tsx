import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform, Image, Dimensions } from 'react-native';
import { db } from '../../../firebaseConfig';
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { useUser } from '@/context/UserContext';
import { Calendar } from 'react-native-calendars';

interface Event {
  id: string;
  EventName: string;
  EventDescription: string;
  EventDateTime: string;
  EventPrice: string;
  EventVenue: string;
  NoOfAttendees: number;
  EventImageUrl: string;
  attendees?: string[];
}

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}: ${message}`);
  } else {
    Alert.alert(title, message);
  }
};

const ParentsAllEvents = () => {
  const [eventsData, setEventsData] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [imageLayout, setImageLayout] = useState<{ [key: string]: { width: number; height: number } }>({});
  const { user } = useUser();
  const selectedChildId = user.selectedChild?.id;
  
  const screenWidth = Dimensions.get('window').width;
  const maxImageWidth = Math.min(screenWidth - 40, 800); // 40 for padding, max width of 800

  useEffect(() => {
    const unsubscribeEvents = onSnapshot(collection(db, 'Events'), (eventsSnapshot) => {
      const eventsList: Event[] = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Event[];

      setEventsData(eventsList);
      setLoading(false);

      // Pre-load image dimensions
      eventsList.forEach((event) => {
        if (event.EventImageUrl) {
          Image.getSize(event.EventImageUrl, (width, height) => {
            setImageLayout(prev => ({
              ...prev,
              [event.id]: {
                width: width,
                height: height
              }
            }));
          }, (error) => {
            console.error(`Error getting image size for event ${event.id}:`, error);
          });
        }
      });
    }, (error) => {
      console.error('Error fetching events: ', error);
      setLoading(false);
    });

    return () => unsubscribeEvents();
  }, []);

  const calculateImageDimensions = (eventId: string) => {
    const layout = imageLayout[eventId];
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

  const isPastEvent = (eventDateTime: string) => {
    const eventDate = new Date(eventDateTime);
    return eventDate < new Date();
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-GB');
  };

  const handleRegisterEvent = async (event: Event) => {
    if (!event || !selectedChildId) {
      console.log("Missing event or user data!");
      return;
    }

    if (isPastEvent(event.EventDateTime)) {
      showAlert("Error", "You cannot register for past events.");
      return;
    }

    try {
      const eventRef = doc(db, "Events", event.id);
      const updatedAttendees = event.attendees ? [...event.attendees, selectedChildId] : [selectedChildId];
      const updatedNoOfAttendees = updatedAttendees.length;

      await updateDoc(eventRef, {
        attendees: updatedAttendees,
        NoOfAttendees: updatedNoOfAttendees,
      });

      showAlert("Success", "You have registered for the event.");
    } catch (error) {
      console.error("Error registering for event: ", error);
      showAlert("Error", "Failed to register for the event.");
    }
  };

  const handleUnregisterEvent = async (event: Event) => {
    if (!event || !selectedChildId) {
      console.log("Missing event or user data!");
      return;
    }

    try {
      const eventRef = doc(db, "Events", event.id);
      const updatedAttendees = event.attendees ? event.attendees.filter(attendee => attendee !== selectedChildId) : [];
      const updatedNoOfAttendees = updatedAttendees.length;

      await updateDoc(eventRef, {
        attendees: updatedAttendees,
        NoOfAttendees: updatedNoOfAttendees,
      });

      showAlert("Success", "You have unregistered from the event.");
    } catch (error) {
      console.error("Error unregistering from event: ", error);
      showAlert("Error", "Failed to unregister from the event.");
    }
  };

  const eventsByDate = eventsData.reduce((acc, event) => {
    const date = event.EventDateTime.split('T')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(event);
    return acc;
  }, {} as { [key: string]: Event[] });

  const renderEvent = ({ item }: { item: Event }) => {
    const isRegistered = item.attendees && item.attendees.includes(selectedChildId);
    const imageDimensions = calculateImageDimensions(item.id);
    
    return (
      <View style={styles.eventContainer}>
        {item.EventImageUrl && (
          <View style={styles.eventContentContainer}>
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: item.EventImageUrl }} 
                style={{
                  width: imageDimensions.width,
                  height: imageDimensions.height,
                }}
                resizeMode="cover"
              />
            </View>
            <View style={styles.eventDetails}>
              <Text style={styles.eventName}>{item.EventName}</Text>
              <Text style={styles.eventDate}>Date: {formatDateTime(item.EventDateTime)}</Text>
              <Text style={styles.eventDescription}>{item.EventDescription}</Text>
              <Text style={styles.eventPrice}>Price: {item.EventPrice}</Text>
              <Text style={styles.eventVenue}>Venue: {item.EventVenue}</Text>
              <Text style={styles.noOfAttendees}>Attendees: {item.NoOfAttendees}</Text>
              <TouchableOpacity
                style={[styles.registerButton, isRegistered && styles.unregisterButton]}
                onPress={() => isRegistered ? handleUnregisterEvent(item) : handleRegisterEvent(item)}
              >
                <Text style={styles.registerButtonText}>
                  {isRegistered ? 'Unregister' : 'Register'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {!item.EventImageUrl && (
          <View style={styles.eventDetails}>
            <Text style={styles.eventName}>{item.EventName}</Text>
            <Text style={styles.eventDate}>Date: {formatDateTime(item.EventDateTime)}</Text>
            <Text style={styles.eventDescription}>{item.EventDescription}</Text>
            <Text style={styles.eventPrice}>Price: {item.EventPrice}</Text>
            <Text style={styles.eventVenue}>Venue: {item.EventVenue}</Text>
            <Text style={styles.noOfAttendees}>Attendees: {item.NoOfAttendees}</Text>
            <TouchableOpacity
              style={[styles.registerButton, isRegistered && styles.unregisterButton]}
              onPress={() => isRegistered ? handleUnregisterEvent(item) : handleRegisterEvent(item)}
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
              ...Object.keys(eventsByDate).reduce((acc, date) => {
                acc[date] = { marked: true };
                return acc;
              }, {}),
              [selectedDate]: { selected: true, marked: true },
            }}
          />
          <FlatList
            data={eventsByDate[selectedDate] || []}
            keyExtractor={(item) => item.id}
            renderItem={renderEvent}
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
  eventContentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    marginRight: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  eventContainer: {
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
  eventDetails: {
    flex: 1,
    padding: 15,
    justifyContent: 'center',
  },
  eventName: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#007BFF',
    marginBottom: 5,
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  eventDate: {
    fontSize: 14,
    color: '#333',
    marginBottom: 3,
  },
  eventPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  eventVenue: {
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

export default ParentsAllEvents;