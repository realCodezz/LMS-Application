import React, { useState, useEffect, useRef } from "react";
import { Text, View, StyleSheet, ScrollView, ActivityIndicator, Image, Dimensions, Platform } from "react-native";
import { useAuth } from "@/context/AuthContext"; // Adjust the path if needed
import { useUser } from "@/context/UserContext";
import { db } from "../../../firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import AboutUs from "../AboutUs/AboutUs";

export default function HomepageParent() {
  const { loading } = useAuth();
  const { user } = useUser();
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = screenWidth * 0.9; // Revert to original card width

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const currentDate = new Date().toISOString();
        const eventsQuery = query(collection(db, 'Events'), where('EventDateTime', '>=', currentDate));
        const enrichmentsQuery = query(collection(db, 'Enrichments'), where('EnrichmentDateTime', '>=', currentDate));

        const [eventsSnapshot, enrichmentsSnapshot] = await Promise.all([
          getDocs(eventsQuery),
          getDocs(enrichmentsQuery),
        ]);

        const events = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const enrichments = enrichmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setAnnouncements([...events, ...enrichments]);
        setLoadingAnnouncements(false);
      } catch (error) {
        console.error('Error fetching announcements:', error);
        setLoadingAnnouncements(false);
      }
    };

    fetchAnnouncements();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (announcements.length > 0) {
        const nextIndex = (currentIndex + 1) % announcements.length;
        setCurrentIndex(nextIndex);
        scrollViewRef.current?.scrollTo({ x: nextIndex * cardWidth, animated: true });
      }
    }, 10000); // Auto-scroll every 10 seconds

    return () => clearInterval(interval);
  }, [currentIndex, announcements.length, cardWidth]);

  if (loading) {
    return <Text>Loading...</Text>; // Show loading indicator while checking auth state
  }

  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / cardWidth);
    setCurrentIndex(index);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to MySchoolBag Nursery</Text>
      </View>

      {user ? (
        <View style={styles.content}>
          <Text style={styles.welcomeText}>Welcome, {user.email}!</Text>
          <Text style={styles.welcomeText}>Child: {user.selectedChild?.name}</Text>

          {/* Announcements Section */}
          <View style={styles.section}>
            <Text style={styles.heading}>Announcements</Text>
            {loadingAnnouncements ? (
              <ActivityIndicator size="large" color="#0000ff" />
            ) : (
              <View>
                <ScrollView
                  ref={scrollViewRef}
                  horizontal 
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  disableIntervalMomentum={ true } 
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                  snapToInterval={cardWidth}
                  snapToAlignment="center"
                  decelerationRate="fast"
                  style={Platform.OS === 'web' ? { display: 'flex', flexDirection: 'row', overflowX: 'scroll' } : {}}
                  contentContainerStyle={{ paddingHorizontal: (screenWidth - cardWidth) / 2 }} // Revert to original padding
                >
                  {announcements.map((announcement, index) => (
                    <View key={announcement.id} style={[styles.announcement, { width: cardWidth }]}>
                      <Image source={{ uri: announcement.EventImageUrl || announcement.EnrichmentImageUrl }} style={styles.announcementImage} />
                      <View style={styles.announcementTextContainer}>
                        <Text style={styles.announcementTitle} numberOfLines={1} ellipsizeMode="tail">{announcement.EventName || announcement.EnrichmentName}</Text>
                        <Text style={styles.announcementDate} numberOfLines={1} ellipsizeMode="tail">
                          Date: {new Date(announcement.EventDateTime || announcement.EnrichmentDateTime).toLocaleString('en-GB')}
                        </Text>
                        <Text style={styles.announcementDescription} numberOfLines={2} ellipsizeMode="tail">{announcement.EventDescription || announcement.EnrichmentDescription}</Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
                <View style={styles.indicatorContainer}>
                  {announcements.map((_, index) => (
                    <View key={index} style={[styles.indicator, currentIndex === index && styles.activeIndicator]} />
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Previous Layout */}
          <AboutUs />
        </View>
      ) : (
        <Text>No user is logged in.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#dfe7fd',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 24, // Revert to original font size
    fontWeight: 'bold',
    color: '#3d5a80',
    marginBottom: 10,
    textAlign: 'center',
  },
  content: {
    padding: 15, // Revert to original padding
  },
  welcomeText: {
    fontSize: 16, // Revert to original font size
    color: '#333',
    marginBottom: 10,
  },
  section: {
    padding: 15, // Revert to original padding
    backgroundColor: '#ffffff',
    marginVertical: 10,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  heading: {
    fontSize: 20, // Revert to original font size
    fontWeight: 'bold',
    color: '#3d5a80',
    marginBottom: 10,
  },
  announcement: {
    width: Dimensions.get('window').width * 0.9,
    borderRadius: 15,
    overflow: 'hidden',
    marginHorizontal: (Dimensions.get('window').width * 0.05) / 2, // Ensure equal margin on both sides
    
  },  
  announcementImage: {
    width: '100%',
    height: 120, // Revert to original height
    position: 'absolute',
    top: 0,
    left: 0,
  },
  announcementTextContainer: {
    padding: 15, // Revert to original padding
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 15,
  },
  announcementTitle: {
    fontSize: 16, // Revert to original font size
    fontWeight: 'bold',
    color: '#fff',
  },
  announcementDate: {
    fontSize: 12, // Revert to original font size
    color: '#fff',
    marginBottom: 5,
  },
  announcementDescription: {
    fontSize: 12, // Revert to original font size
    color: '#fff',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  indicator: {
    width: 8, // Revert to original size
    height: 8, // Revert to original size
    borderRadius: 4, // Revert to original border radius
    backgroundColor: '#ccc',
    marginHorizontal: 4, // Revert to original margin
  },
  activeIndicator: {
    backgroundColor: '#007BFF',
  },
});