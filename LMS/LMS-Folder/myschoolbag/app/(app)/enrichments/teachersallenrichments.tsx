import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, Button, TouchableOpacity, Image, Dimensions } from 'react-native';
import { db } from "@/firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import { useRouter } from "expo-router";

import { useAuth } from "@/context/AuthContext"; 
import { useUser } from '@/context/UserContext'; 

interface Enrichment {
  id: string;
  EnrichmentName: string;
  EnrichmentDescription: string;
  EnrichmentPrice: string;
  EnrichmentVenue: string;
  EnrichmentDateTime: string;
  NoOfAttendees: number;
  EnrichmentImageUrl: string;
}

const TeachersAllEnrichments = () => {
  const [enrichmentsData, setEnrichmentsData] = useState<Enrichment[]>([]);
  const [activeTab, setActiveTab] = useState('current');
  const [imageLayout, setImageLayout] = useState<{ [key: string]: { width: number; height: number } }>({});
  const router = useRouter();
  
  const screenWidth = Dimensions.get('window').width;
  const maxImageWidth = Math.min(screenWidth - 40, 800); // 40 for padding, max width of 800

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "Enrichments"), (enrichmentsSnapshot) => {
      const enrichmentsList: Enrichment[] = enrichmentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Enrichment[];

      console.log("Fetched enrichments:", enrichmentsList);
      setEnrichmentsData(enrichmentsList);

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
    });

    return () => unsubscribe();
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

  const isValidDateTime = (dateTimeString: string): boolean => {
    const date = new Date(dateTimeString);
    return !isNaN(date.getTime());
  };

  const formatDateTime = (dateTimeString: string): string => {
    if (!isValidDateTime(dateTimeString)) return "Invalid date";
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-GB');
  };

  const isHappeningEnrichment = (enrichmentDateTime: string) => {
    if (!isValidDateTime(enrichmentDateTime)) {
      console.error("Invalid enrichment datetime:", enrichmentDateTime);
      return false;
    }
    const now = new Date();
    const enrichment = new Date(enrichmentDateTime);
    return enrichment >= new Date(now.setHours(0, 0, 0, 0));
  };

  const isPastEnrichment = (enrichmentDateTime: string) => {
    if (!isValidDateTime(enrichmentDateTime)) {
      console.error("Invalid enrichment datetime:", enrichmentDateTime);
      return false;
    }
    const now = new Date();
    const enrichment = new Date(enrichmentDateTime);
    return enrichment < new Date(now.setHours(0, 0, 0, 0));
  };

  const happeningEnrichments = enrichmentsData
    .filter((enrichment) => isHappeningEnrichment(enrichment.EnrichmentDateTime))
    .sort((a, b) => new Date(a.EnrichmentDateTime).getTime() - new Date(b.EnrichmentDateTime).getTime());

  const pastEnrichments = enrichmentsData
    .filter((enrichment) => isPastEnrichment(enrichment.EnrichmentDateTime))
    .sort((a, b) => new Date(b.EnrichmentDateTime).getTime() - new Date(a.EnrichmentDateTime).getTime());

  const renderEnrichment = ({ item }: { item: Enrichment }) => {
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
              <Text style={styles.enrichmentDate}>
                Date: {formatDateTime(item.EnrichmentDateTime)}
              </Text>
              <Text style={styles.enrichmentAbout}>About This Enrichment</Text>
              <Text style={styles.enrichmentDescription}>{item.EnrichmentDescription}</Text>
              <Text style={styles.enrichmentPrice}>Price: {item.EnrichmentPrice}</Text>
              <Text style={styles.enrichmentVenue}>Venue: {item.EnrichmentVenue}</Text>
              <Text style={styles.noOfAttendees}>Attendees: {item.NoOfAttendees}</Text>
            </View>
          </View>
        )}
        {!item.EnrichmentImageUrl && (
          <View style={styles.enrichmentDetails}>
            <Text style={styles.enrichmentName}>{item.EnrichmentName}</Text>
            <Text style={styles.enrichmentDate}>
              Date: {formatDateTime(item.EnrichmentDateTime)}
            </Text>
            <Text style={styles.enrichmentAbout}>About This Enrichment</Text>
            <Text style={styles.enrichmentDescription}>{item.EnrichmentDescription}</Text>
            <Text style={styles.enrichmentPrice}>Price: {item.EnrichmentPrice}</Text>
            <Text style={styles.enrichmentVenue}>Venue: {item.EnrichmentVenue}</Text>
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
            Current Enrichments ({happeningEnrichments.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'past' && styles.activeTab]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
            Past Enrichments ({pastEnrichments.length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'current' && (
          <>
            <Button
              title="Create New Enrichment"
              onPress={() => {
                router.push("./creatingenrichments");
              }}
            />
            {happeningEnrichments.length > 0 ? (
              <FlatList
                data={happeningEnrichments}
                renderItem={renderEnrichment}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.flatListContent}
              />
            ) : (
              <Text style={styles.noEnrichmentsText}>No upcoming enrichments.</Text>
            )}
          </>
        )}

        {activeTab === 'past' && (
          <>
            {pastEnrichments.length > 0 ? (
              <FlatList
                data={pastEnrichments}
                renderItem={renderEnrichment}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.flatListContent}
              />
            ) : (
              <Text style={styles.noEnrichmentsText}>No past enrichments.</Text>
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
  enrichmentAbout: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
    marginTop: 5,
  },
  enrichmentDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 7,
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
  enrichmentDate: {
    fontSize: 12,
    color: '#333',
    marginBottom: 3,
  },
  noOfAttendees: {
    fontSize: 12,
    color: '#333',
  },
  noEnrichmentsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default TeachersAllEnrichments;
