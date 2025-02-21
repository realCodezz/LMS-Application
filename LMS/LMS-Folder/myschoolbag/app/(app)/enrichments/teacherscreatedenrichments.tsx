import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Button, Alert, Modal, TextInput, Platform, Image } from 'react-native';
import { db } from "../../../firebaseConfig";
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc, getDoc, QueryDocumentSnapshot, DocumentData, getDocs } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as Notifications from 'expo-notifications';

import { useAuth } from "@/context/AuthContext"; 
import { useUser } from '@/context/UserContext'; 
import DateTimePicker from "@react-native-community/datetimepicker";

interface Enrichment {
  EnrichmentID: string;
  EnrichmentName: string;
  EnrichmentDescription: string;
  EnrichmentPrice: string;
  EnrichmentVenue: string;
  EnrichmentDateTime: string;
  EnrichmentImageUrl: string;
  NoOfAttendees: number;
  TeacherEmail: string;
  attendees: string[]; // Array of document IDs from Students
}

interface Attendee {
  id: string; // Document ID
  fullName: string; // `childFullName` field
}

// Unified DateTimePicker component for both web and mobile
const UnifiedDateTimePicker: React.FC<{ onChange: (date: string) => void }> = ({ onChange }) => {
  const [date, setDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const handleMobileDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      onChange(selectedDate.toISOString());
    }
  };

  const handleWebDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(event.target.value);
    setDate(selectedDate);
    onChange(selectedDate.toISOString());
  };

  if (Platform.OS === "web") {
    return (
      <View>
        <Text>Select Date and Time:</Text>
        <input
          type="datetime-local"
          onChange={handleWebDateChange}
          style={{ marginTop: 10, padding: 5, fontSize: 16 }}
        />
      </View>
    );
  }

  return (
    <View>
      <Text>Select Date and Time:</Text>
      <Button title="Pick Date and Time" onPress={() => setShowPicker(true)} />
      {date && <Text>Selected: {date.toLocaleString()}</Text>}
      {showPicker && (
        <DateTimePicker
          value={date || new Date()}
          mode="datetime"
          display={Platform.OS === "ios" ? "inline" : "default"}
          themeVariant={Platform.OS === "ios" ? "light" : undefined}
          onChange={handleMobileDateChange}
        />
      )}
    </View>
  );
};

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-GB');
};

const EnrichmentDetails = () => {
  const [enrichments, setEnrichments] = useState<Enrichment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [attendeesModalVisible, setAttendeesModalVisible] = useState(false);
  const [selectedEnrichment, setSelectedEnrichment] = useState<Enrichment | null>(null);
  const [attendeeDetails, setAttendeeDetails] = useState<Attendee[]>([]);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [deleteConfirmationModalVisible, setDeleteConfirmationModalVisible] = useState(false);
  const [enrichmentToDelete, setEnrichmentToDelete] = useState<string | null>(null);
  const [attendeeToRemove, setAttendeeToRemove] = useState<string>("");

  const { user } = useUser();
  const teacherEmail = user?.email || "default_email@example.com";

  const [updatedName, setUpdatedName] = useState("");
  const [updatedDescription, setUpdatedDescription] = useState("");
  const [updatedDateTime, setUpdatedDateTime] = useState("");
  const [updatedPrice, setUpdatedPrice] = useState("");
  const [updatedVenue, setUpdatedVenue] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const enrichmentsQuery = query(
      collection(db, "Enrichments"),
      where("TeacherEmail", "==", teacherEmail)
    );

    const unsubscribe = onSnapshot(enrichmentsQuery, (querySnapshot) => {
      const fetchedEnrichments: Enrichment[] = [];
      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const enrichmentData = { ...doc.data(), EnrichmentID: doc.id } as Enrichment;
        fetchedEnrichments.push(enrichmentData);
      });
      setEnrichments(fetchedEnrichments);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching enrichment details:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [teacherEmail]);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (imageUri: string, enrichmentID: string) => {
    const storage = getStorage();
    const storageRef = ref(storage, `Enrichments/enrichment_${enrichmentID}.jpg`);

    const response = await fetch(imageUri);
    const blob = await response.blob();

    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  const updateEnrichment = async () => {
    if (selectedEnrichment) {
      const currentDate = new Date();
      if (new Date(updatedDateTime) < currentDate) {
        showAlert("Error", "Enrichment date and time cannot be in the past");
        return;
      }
  
      try {
        const enrichmentRef = doc(db, "Enrichments", selectedEnrichment.EnrichmentID);
        
        // Update image if a new image is selected
        let imageUrl = selectedEnrichment.EnrichmentImageUrl;
        if (selectedImage) {
          imageUrl = await uploadImage(selectedImage, selectedEnrichment.EnrichmentID);
        }

        await updateDoc(enrichmentRef, {
          EnrichmentName: updatedName,
          EnrichmentDescription: updatedDescription,
          EnrichmentDateTime: updatedDateTime,
          EnrichmentImageUrl: imageUrl,
          EnrichmentPrice: updatedPrice, 
          EnrichmentVenue: updatedVenue, 
        });
  
        showAlert("Success", "Enrichment updated successfully.");
        setModalVisible(false);
        setSelectedImage(null);
      } catch (error) {
        console.error("Error updating enrichment:", error);
        showAlert("Error", "Failed to update the enrichment.");
      }
    }
  };
  const fetchAttendeeDetails = async (attendeeIds: string[]) => {
    const fetchedDetails: Attendee[] = [];
    for (const attendeeId of attendeeIds) {
      try {
        const studentDoc = await getDoc(doc(db, "Students", attendeeId));
        if (studentDoc.exists()) {
          fetchedDetails.push({
            id: attendeeId,
            fullName: studentDoc.data().childFullName || "Unknown",
          });
        }
      } catch (error) {
        console.error(`Error fetching attendee ${attendeeId}:`, error);
      }
    }
    setAttendeeDetails(fetchedDetails);
  };

  const openAttendeesModal = useCallback((enrichment: Enrichment) => {
    setSelectedEnrichment(enrichment);
    fetchAttendeeDetails(enrichment.attendees);
    setAttendeesModalVisible(true);
  }, []);
  const openEditModal = (enrichment: Enrichment) => {
    setSelectedEnrichment(enrichment);
    setUpdatedName(enrichment.EnrichmentName);
    setUpdatedDescription(enrichment.EnrichmentDescription);
    setUpdatedPrice(enrichment.EnrichmentPrice);
    setUpdatedVenue(enrichment.EnrichmentVenue);
    setUpdatedDateTime(enrichment.EnrichmentDateTime);
    setSelectedImage(null);
    setModalVisible(true);
  };
  
  const confirmDeleteEnrichment = (enrichmentID: string) => {
    setEnrichmentToDelete(enrichmentID);
    setDeleteConfirmationModalVisible(true);
  };

  const handleDeleteEnrichment = async () => {
    if (enrichmentToDelete) {
      try {
        await deleteDoc(doc(db, "Enrichments", enrichmentToDelete));
        Alert.alert("Success", "Enrichment deleted successfully.");
        setDeleteConfirmationModalVisible(false);
      } catch (error) {
        console.error("Error deleting enrichment:", error);
        Alert.alert("Error", "Failed to delete the enrichment.");
      }
    }
  };

  const handleRemoveAttendee = (enrichmentId: string, attendeeId: string) => {
    setAttendeeToRemove(attendeeId);
    setConfirmationModalVisible(true);
  };

  const confirmRemoveAttendee = async () => {
    if (selectedEnrichment && attendeeToRemove) {
      try {
        const enrichmentRef = doc(db, "Enrichments", selectedEnrichment.EnrichmentID);
        const updatedAttendees = selectedEnrichment.attendees.filter(
          attendeeId => attendeeId !== attendeeToRemove
        );

        await updateDoc(enrichmentRef, {
          attendees: updatedAttendees,
          NoOfAttendees: updatedAttendees.length,
        });

        setAttendeeDetails((prevDetails) =>
          prevDetails.filter((attendee) => attendee.id !== attendeeToRemove)
        );

        Alert.alert("Success", "Attendee removed successfully.");
        setConfirmationModalVisible(false);
      } catch (error) {
        console.error("Error removing attendee:", error);
        Alert.alert("Error", "Failed to remove attendee.");
      }
    }
  };
  const sendNotificationsToParents = async (enrichmentName: string) => {
    try {
      // Retrieve all parent documents from the 'Users' collection
      const usersCollection = collection(db, 'Users');
      const usersSnapshot = await getDocs(usersCollection);
  
      // Initialize an array to store device tokens
      const tokens: string[] = [];
  
      console.log('Retrieved users snapshot:', usersSnapshot);
  
      // Loop through each user document to extract the deviceToken
      usersSnapshot.forEach((docSnapshot) => {
        const userData = docSnapshot.data(); // Get the data of the user document
        console.log('User data:', userData); // Log user data to check if deviceToken exists
  
        const deviceToken = userData.deviceToken; // Get the deviceToken
        const role = userData.role; // Get the role field (make sure it's a "Parent")
        
        // Only send notifications to users with a "Parent" role and a valid deviceToken
        if (role === 'Parent' && deviceToken) {
          console.log('Valid device token found for:', userData.fullName);
          tokens.push(deviceToken); // Add valid deviceToken to tokens array
        } else if (role !== 'Parent') {
          console.log(`Skipping user ${userData.fullName} (role is not "Parent")`);
        } else {
          console.log(`Skipping user ${userData.fullName} (no device token)`);
        }
      });
  
      // Log the list of tokens to check
      console.log('Retrieved device tokens:', tokens);
  
      // If no device tokens were found, exit the function
      if (tokens.length === 0) {
        console.log('No parent tokens found. Notifications will not be sent.');
        return;
      }
  
      // Create messages for all tokens
      const messages = tokens.map((token) => ({
        to: token,
        sound: 'default',
        title: 'New Enrichment Created',
        body: `A new enrichment "${enrichmentName}" has been created.`,
        data: { enrichmentName },
      }));
  
      // Send notifications to each parent
      for (const message of messages) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: message.title,
            body: message.body,
            data: message.data,
          },
          trigger: null, // null trigger means immediate notification
        });
      }
  
      console.log('Notifications sent successfully.');
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  };
  //Add this line at the bottom <Button title="Send Notifications to Parents" onPress={() => { console.log('Notification button is pressed:', event.EventName); sendNotificationsToParents(event.EventName);}}/> 

  return (
    <View style={styles.container}>
      {loading ? (
        <Text style={styles.loadingText}>Loading enrichments...</Text>
      ) : enrichments.length > 0 ? (
        <ScrollView>
          {enrichments.map((enrichment) => (
            <View key={enrichment.EnrichmentID} style={styles.enrichmentContainer}>
              <Text style={styles.enrichmentName}>{enrichment.EnrichmentName}</Text>
              <Text style={styles.enrichmentDescription}>{enrichment.EnrichmentDescription}</Text>
              <Text style={styles.enrichmentDate}>Date: {formatDateTime(enrichment.EnrichmentDateTime)}</Text>
              <Text style={styles.enrichmentPrice}>Price: {enrichment.EnrichmentPrice}</Text>
              <Text style={styles.enrichmentVenue}>Venue: {enrichment.EnrichmentVenue}</Text>
              <Text style={styles.noOfAttendees}>Attendees: {enrichment.NoOfAttendees}</Text>
              {/* <Image 
                source={{ uri: event.EventImageUrl }} 
                style={styles.eventImage} 
              /> */}
              <View style={styles.buttonContainer}>
                <Button
                  title="Edit"
                  color="#007BFF"
                  onPress={() => openEditModal(enrichment)}
                />
                <View style={styles.buttonSpacer} />
                <Button
                  title="View Attendees"
                  color="#28a745"
                  onPress={() => openAttendeesModal(enrichment)}
                />
                <View style={styles.buttonSpacer} />
                <Button
                  title="Delete"
                  color="#FF6347"
                  onPress={() => confirmDeleteEnrichment(enrichment.EnrichmentID)}
                />
                                <View style={styles.buttonSpacer} />


              </View>
              
            </View>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.loadingText}>No enrichments found.</Text>
      )}

      {/* Edit Event Modal */}
      {selectedEnrichment && (
        <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Enrichment</Text>
              <TextInput
                style={styles.input}
                value={updatedName}
                onChangeText={setUpdatedName}
                placeholder="Enrichment Name"
              />
              <TextInput
                style={styles.input}
                value={updatedDescription}
                onChangeText={setUpdatedDescription}
                placeholder="Enrichment Description"
              />
              <TextInput
                style={styles.input}
                value={updatedPrice}
                onChangeText={setUpdatedPrice}
                placeholder="Enrichment Price"
              />
              <TextInput
                style={styles.input}
                value={updatedVenue}
                onChangeText={setUpdatedVenue}
                placeholder="Enrichment Venue"
              />
              <UnifiedDateTimePicker onChange={setUpdatedDateTime} />
              
              {/* Image selection section */}
              <Button title="Pick New Image" onPress={handleImagePick} />
              {(selectedImage || selectedEnrichment.EnrichmentImageUrl) && (
                <Image 
                  source={{ uri: selectedImage || selectedEnrichment.EnrichmentImageUrl }} 
                  style={styles.imagePreview} 
                />
              )}

              <View style={styles.modalButtons}>
                <Button title="Cancel" onPress={() => setModalVisible(false)} />
                <View style={styles.buttonSpacer} />
                <Button title="Save" onPress={updateEnrichment} />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Attendees Modal */}
      <Modal visible={attendeesModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Attendees</Text>
            {attendeeDetails.length > 0 ? (
              attendeeDetails.map((attendee) => (
                <View key={attendee.id} style={styles.attendeeContainer}>
                  <Text>{attendee.fullName}</Text>
                  <Button
                    title="Remove"
                    color="#FF6347"
                    onPress={() => handleRemoveAttendee(selectedEnrichment!.EnrichmentID, attendee.id)}
                  />
                </View>
              ))
            ) : (
              <Text>No attendees found.</Text>
            )}
            <View style={styles.modalButtons}>
              <Button title="Close" onPress={() => setAttendeesModalVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal for Removing Attendee */}
      <Modal visible={confirmationModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Are you sure you want to remove this attendee?</Text>
            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => setConfirmationModalVisible(false)} />
              <View style={styles.buttonSpacer} />
              <Button title="Confirm" onPress={confirmRemoveAttendee} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        visible={deleteConfirmationModalVisible} 
        animationType="slide" 
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Deletion</Text>
            <Text>Are you sure you want to delete this enrichment?</Text>
            <View style={styles.modalButtons}>
              <Button 
                title="Cancel" 
                onPress={() => setDeleteConfirmationModalVisible(false)} 
              />
              <View style={styles.buttonSpacer} />
              <Button 
                title="Confirm" 
                color="#FF6347" 
                onPress={handleDeleteEnrichment} 
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  loadingText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 18,
    fontWeight: "bold",
  },
  enrichmentContainer: {
    marginBottom: 20,
    padding: 16,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: "#ddd",
    backgroundColor: "#f9f9f9",
  },
  enrichmentName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  enrichmentDescription: {
    fontSize: 14,
    marginTop: 5,
  },
  enrichmentPrice: {
    fontSize: 12,
    color: '#333',
    marginTop: 5,
  },
  enrichmentVenue: {
    fontSize: 12,
    color: '#333',
    marginBottom: 5,
  },
  enrichmentDate: {
    fontSize: 12,
    marginTop: 5,
  },
  noOfAttendees: {
    fontSize: 14,
    marginTop: 5,
  },
  buttonContainer: {
    marginTop: 15,
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonSpacer: {
    width: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 8,
    borderRadius: 5,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  attendeeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    marginVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  enrichmentImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    marginVertical: 10,
    borderRadius: 10,
  },
  imagePreview: { 
    width: 200, 
    height: 200, 
    marginVertical: 10,
    alignSelf: 'center',
    borderRadius: 10,
  },
});


export default EnrichmentDetails;
