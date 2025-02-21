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

interface Event {
  EventID: string;
  EventName: string;
  EventDescription: string;
  EventPrice: string;
  EventVenue: string;
  EventDateTime: string;
  EventImageUrl: string;
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

const EventDetails = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [attendeesModalVisible, setAttendeesModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [attendeeDetails, setAttendeeDetails] = useState<Attendee[]>([]);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [deleteConfirmationModalVisible, setDeleteConfirmationModalVisible] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
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
    const eventsQuery = query(
      collection(db, "Events"),
      where("TeacherEmail", "==", teacherEmail)
    );

    const unsubscribe = onSnapshot(eventsQuery, (querySnapshot) => {
      const fetchedEvents: Event[] = [];
      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const eventData = { ...doc.data(), EventID: doc.id } as Event;
        fetchedEvents.push(eventData);
      });
      setEvents(fetchedEvents);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching event details:", error);
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

  const uploadImage = async (imageUri: string, eventID: string) => {
    const storage = getStorage();
    const storageRef = ref(storage, `Events/event_${eventID}.jpg`);

    const response = await fetch(imageUri);
    const blob = await response.blob();

    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  const updateEvent = async () => {
    if (selectedEvent) {
      const currentDate = new Date();
      if (new Date(updatedDateTime) < currentDate) {
        showAlert("Error", "Event date and time cannot be in the past");
        return;
      }
  
      try {
        const eventRef = doc(db, "Events", selectedEvent.EventID);
        
        // Update image if a new image is selected
        let imageUrl = selectedEvent.EventImageUrl;
        if (selectedImage) {
          imageUrl = await uploadImage(selectedImage, selectedEvent.EventID);
        }

        await updateDoc(eventRef, {
          EventName: updatedName,
          EventDescription: updatedDescription,
          EventDateTime: updatedDateTime,
          EventImageUrl: imageUrl,
          EventPrice: updatedPrice, 
          EventVenue: updatedVenue, 
        });
  
        showAlert("Success", "Event updated successfully.");
        setModalVisible(false);
        setSelectedImage(null);
      } catch (error) {
        console.error("Error updating event:", error);
        showAlert("Error", "Failed to update the event.");
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

  const openAttendeesModal = useCallback((event: Event) => {
    setSelectedEvent(event);
    fetchAttendeeDetails(event.attendees);
    setAttendeesModalVisible(true);
  }, []);
  const openEditModal = (event: Event) => {
    setSelectedEvent(event);
    setUpdatedName(event.EventName);
    setUpdatedDescription(event.EventDescription);
    setUpdatedPrice(event.EventPrice);
    setUpdatedVenue(event.EventVenue);
    setUpdatedDateTime(event.EventDateTime);
    setSelectedImage(null);
    setModalVisible(true);
  };
  
  const confirmDeleteEvent = (eventID: string) => {
    setEventToDelete(eventID);
    setDeleteConfirmationModalVisible(true);
  };

  const handleDeleteEvent = async () => {
    if (eventToDelete) {
      try {
        await deleteDoc(doc(db, "Events", eventToDelete));
        showAlert("Success", "Event deleted successfully.");
        setDeleteConfirmationModalVisible(false);
      } catch (error) {
        console.error("Error deleting event:", error);
        showAlert("Error", "Failed to delete the event.");
      }
    }
  };

  const handleRemoveAttendee = (eventId: string, attendeeId: string) => {
    setAttendeeToRemove(attendeeId);
    setConfirmationModalVisible(true);
  };

  const confirmRemoveAttendee = async () => {
    if (selectedEvent && attendeeToRemove) {
      try {
        const eventRef = doc(db, "Events", selectedEvent.EventID);
        const updatedAttendees = selectedEvent.attendees.filter(
          attendeeId => attendeeId !== attendeeToRemove
        );

        await updateDoc(eventRef, {
          attendees: updatedAttendees,
          NoOfAttendees: updatedAttendees.length,
        });

        setAttendeeDetails((prevDetails) =>
          prevDetails.filter((attendee) => attendee.id !== attendeeToRemove)
        );

        showAlert("Success", "Attendee removed successfully.");
        setConfirmationModalVisible(false);
      } catch (error) {
        console.error("Error removing attendee:", error);
        showAlert("Error", "Failed to remove attendee.");
      }
    }
  };

  const sendPushNotification = async (event: Event) => {
    try {
      const usersQuery = query(
        collection(db, "Users"),
        where("role", "==", "Parent"),
        where("deviceToken", "!=", null)
      );
  
      const querySnapshot = await getDocs(usersQuery);
      const messages = querySnapshot.docs.map((doc) => ({
        to: doc.data().deviceToken,
        sound: 'default',
        title: 'New Event Notification',
        body: `A new event "${event.EventName}" has been created.`,
        data: { eventId: event.EventID },
      }));
  
      console.log("Sending notifications to the following tokens:", messages.map(msg => msg.to));
  
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await Promise.all(messages.map((message) => Notifications.scheduleNotificationAsync({
          content: message,
          trigger: null,
        })));
        showAlert("Success", "Notifications sent successfully.");
      } else {
        showAlert("Info", "Notifications can only be sent to iOS and Android devices.");
      }
    } catch (error) {
      console.error("Error sending notifications:", error);
      showAlert("Error", `Failed to send notifications: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <Text style={styles.loadingText}>Loading events...</Text>
      ) : events.length > 0 ? (
        <ScrollView>
          {events.map((event) => (
            <View key={event.EventID} style={styles.eventContainer}>
              <Text style={styles.eventName}>{event.EventName}</Text>
              <Text style={styles.eventDescription}>{event.EventDescription}</Text>
              <Text style={styles.eventDate}>Date: {formatDateTime(event.EventDateTime)}</Text>
              <Text style={styles.eventPrice}>Price: {event.EventPrice}</Text>
              <Text style={styles.eventVenue}>Venue: {event.EventVenue}</Text>
              <Text style={styles.noOfAttendees}>Attendees: {event.NoOfAttendees}</Text>
              {/* <Image 
                source={{ uri: event.EventImageUrl }} 
                style={styles.eventImage} 
              /> */}
              <View style={styles.buttonContainer}>
                <Button
                  title="Edit"
                  color="#007BFF"
                  onPress={() => openEditModal(event)}
                />
                <View style={styles.buttonSpacer} />
                <Button
                  title="View Attendees"
                  color="#28a745"
                  onPress={() => openAttendeesModal(event)}
                />
                <View style={styles.buttonSpacer} />
                <Button
                  title="Delete"
                  color="#FF6347"
                  onPress={() => confirmDeleteEvent(event.EventID)}
                />
                {/* <View style={styles.buttonSpacer} />
                <Button
                  title="Notify"
                  color="#28a745"
                  onPress={() => sendPushNotification(event)}
                /> */}
              </View>
              
            </View>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.loadingText}>No events found.</Text>
      )}

      {/* Edit Event Modal */}
      {selectedEvent && (
        <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Event</Text>
              <TextInput
                style={styles.input}
                value={updatedName}
                onChangeText={setUpdatedName}
                placeholder="Event Name"
              />
              <TextInput
                style={styles.input}
                value={updatedDescription}
                onChangeText={setUpdatedDescription}
                placeholder="Event Description"
              />
              <TextInput
                style={styles.input}
                value={updatedPrice}
                onChangeText={setUpdatedPrice}
                placeholder="Event Price"
              />
              <TextInput
                style={styles.input}
                value={updatedVenue}
                onChangeText={setUpdatedVenue}
                placeholder="Event Venue"
              />
              <UnifiedDateTimePicker onChange={setUpdatedDateTime} />
              
              {/* Image selection section */}
              <Button title="Pick New Image" onPress={handleImagePick} />
              {(selectedImage || selectedEvent.EventImageUrl) && (
                <Image 
                  source={{ uri: selectedImage || selectedEvent.EventImageUrl }} 
                  style={styles.imagePreview} 
                />
              )}

              <View style={styles.modalButtons}>
                <Button title="Cancel" onPress={() => setModalVisible(false)} />
                <View style={styles.buttonSpacer} />
                <Button title="Save" onPress={updateEvent} />
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
                    onPress={() => handleRemoveAttendee(selectedEvent!.EventID, attendee.id)}
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
            <Text>Are you sure you want to delete this event?</Text>
            <View style={styles.modalButtons}>
              <Button 
                title="Cancel" 
                onPress={() => setDeleteConfirmationModalVisible(false)} 
              />
              <View style={styles.buttonSpacer} />
              <Button 
                title="Confirm" 
                color="#FF6347" 
                onPress={handleDeleteEvent} 
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
  eventContainer: {
    marginBottom: 20,
    padding: 16,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: "#ddd",
    backgroundColor: "#f9f9f9",
  },
  eventName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  eventDescription: {
    fontSize: 14,
    marginTop: 5,
  },
  eventPrice: {
    fontSize: 12,
    color: '#333',
    marginTop: 5,
  },
  eventVenue: {
    fontSize: 12,
    color: '#333',
    marginBottom: 5,
  },
  eventDate: {
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
  eventImage: {
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


export default EventDetails;
