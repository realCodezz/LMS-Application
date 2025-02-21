import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, Button, TouchableOpacity, Image, Dimensions } from 'react-native';
import { db } from "@/firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import { useRouter } from "expo-router";

import { useAuth } from "@/context/AuthContext"; 
import { useUser } from '@/context/UserContext'; 

interface Event {
  id: string;
  EventName: string;
  EventDescription: string;
  EventPrice: string;
  EventVenue: string;
  EventDateTime: string;
  NoOfAttendees: number;
  EventImageUrl: string;
}

const TeachersAllEvents = () => {
  const [eventsData, setEventsData] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState('current');
  const [imageLayout, setImageLayout] = useState<{ [key: string]: { width: number; height: number } }>({});
  const router = useRouter();
  
  const screenWidth = Dimensions.get('window').width;
  const maxImageWidth = Math.min(screenWidth - 40, 800); // 40 for padding, max width of 800

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "Events"), (eventsSnapshot) => {
      const eventsList: Event[] = eventsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Event[];

      console.log("Fetched events:", eventsList);
      setEventsData(eventsList);

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
    });

    return () => unsubscribe();
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

  const isValidDateTime = (dateTimeString: string): boolean => {
    const date = new Date(dateTimeString);
    return !isNaN(date.getTime());
  };

  const formatDateTime = (dateTimeString: string): string => {
    if (!isValidDateTime(dateTimeString)) return "Invalid date";
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-GB');
  };

  const isHappeningEvent = (eventDateTime: string) => {
    if (!isValidDateTime(eventDateTime)) {
      console.error("Invalid event datetime:", eventDateTime);
      return false;
    }
    const now = new Date();
    const event = new Date(eventDateTime);
    return event >= new Date(now.setHours(0, 0, 0, 0));
  };

  const isPastEvent = (eventDateTime: string) => {
    if (!isValidDateTime(eventDateTime)) {
      console.error("Invalid event datetime:", eventDateTime);
      return false;
    }
    const now = new Date();
    const event = new Date(eventDateTime);
    return event < new Date(now.setHours(0, 0, 0, 0));
  };

  const happeningEvents = eventsData
    .filter((event) => isHappeningEvent(event.EventDateTime))
    .sort((a, b) => new Date(a.EventDateTime).getTime() - new Date(b.EventDateTime).getTime());

  const pastEvents = eventsData
    .filter((event) => isPastEvent(event.EventDateTime))
    .sort((a, b) => new Date(b.EventDateTime).getTime() - new Date(a.EventDateTime).getTime());

  const renderEvent = ({ item }: { item: Event }) => {
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
              <Text style={styles.eventDate}>
                Date: {formatDateTime(item.EventDateTime)}
              </Text>
              <Text style={styles.eventAbout}>About This Event</Text>
              <Text style={styles.eventDescription}>{item.EventDescription}</Text>
              <Text style={styles.eventPrice}>Price: {item.EventPrice}</Text>
              <Text style={styles.eventVenue}>Venue: {item.EventVenue}</Text>
              <Text style={styles.noOfAttendees}>Attendees: {item.NoOfAttendees}</Text>
            </View>
          </View>
        )}
        {!item.EventImageUrl && (
          <View style={styles.eventDetails}>
            <Text style={styles.eventName}>{item.EventName}</Text>
            <Text style={styles.eventDate}>
              Date: {formatDateTime(item.EventDateTime)}
            </Text>
            <Text style={styles.eventAbout}>About This Event</Text>
            <Text style={styles.eventDescription}>{item.EventDescription}</Text>
            <Text style={styles.eventPrice}>Price: {item.EventPrice}</Text>
            <Text style={styles.eventVenue}>Venue: {item.EventVenue}</Text>
            <Text style={styles.noOfAttendees}>Attendees: {item.NoOfAttendees}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'current' && styles.activeTab]}
          onPress={() => setActiveTab('current')}
        >
          <Text style={[styles.tabText, activeTab === 'current' && styles.activeTabText]}>
            Current Events ({happeningEvents.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'past' && styles.activeTab]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
            Past Events ({pastEvents.length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'current' && (
          <>
            <Button
              title="Create New Event"
              onPress={() => {
                router.push("./creatingevents");
              }}
            />
            {happeningEvents.length > 0 ? (
              <FlatList
                data={happeningEvents}
                renderItem={renderEvent}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.flatListContent}
              />
            ) : (
              <Text style={styles.noEventsText}>No upcoming events.</Text>
            )}
          </>
        )}

        {activeTab === 'past' && (
          <>
            {pastEvents.length > 0 ? (
              <FlatList
                data={pastEvents}
                renderItem={renderEvent}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.flatListContent}
              />
            ) : (
              <Text style={styles.noEventsText}>No past events.</Text>
            )}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#007BFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#007BFF',
  },
  content: {
    flex: 1,
    padding: 20,
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
  eventAbout: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
    marginTop: 5,
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 7,
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
  eventDate: {
    fontSize: 12,
    color: '#333',
    marginBottom: 3,
  },
  noOfAttendees: {
    fontSize: 12,
    color: '#333',
  },
  noEventsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default TeachersAllEvents;