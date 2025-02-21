import React, { useState } from "react";
import { View, Text, Button, TextInput, StyleSheet, Platform, Alert, Image } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from 'expo-image-picker';
import { db, storage } from "../../../firebaseConfig";
import { addDoc, collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext"; 
import { useUser } from '@/context/UserContext'; 

// Unified DateTimePicker component
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

// Main CreateEvents component
export default function CreateEvents() {
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventPrice, setEventPrice] = useState("");
  const [eventVenue, setEventVenue] = useState("");
  const [eventDateTime, setEventDateTime] = useState<string>("");
  const [eventImage, setEventImage] = useState<string | null>(null);
  const [eventCreated, setEventCreated] = useState(false);
  const router = useRouter();

  const { user } = useUser();
  const teacherEmail = user?.email || "default_email@example.com";

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const getNextEventID = async () => {
    try {
      const eventsRef = collection(db, "Events");
      const q = query(eventsRef, orderBy("EventID", "desc"), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return 1;
      }

      const highestEvent = querySnapshot.docs[0].data();
      return (highestEvent.EventID || 0) + 1;
    } catch (error) {
      console.error("Error getting next eventID:", error);
      throw new Error("Error getting next eventID");
    }
  };

  const pickImage = async () => {
    // Request permission first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setEventImage(result.assets[0].uri);
    }
  };

  const handleCreateEvent = async () => {
    if (!eventName || !eventDescription || !eventDateTime || !eventImage || !eventPrice || !eventVenue) {
      showAlert("Error", "Please fill in all fields and upload an image");
      return;
    }

    const currentDate = new Date();
    if (new Date(eventDateTime) < currentDate) {
      showAlert("Error", "Event date and time cannot be in the past");
      return;
    }

    try {
      const newEventID = await getNextEventID();

      // Convert URI to blob for upload
      const response = await fetch(eventImage!);
      const blob = await response.blob();
      const imageRef = ref(storage, `Events/${newEventID}_image`);
      await uploadBytes(imageRef, blob);
      const imageUrl = await getDownloadURL(imageRef);

      await addDoc(collection(db, "Events"), {
        EventID: newEventID,
        EventName: eventName,
        EventDescription: eventDescription,
        EventPrice: eventPrice,
        EventVenue: eventVenue,
        EventDateTime: eventDateTime,
        NoOfAttendees: 0,
        attendees: [],
        TeacherEmail: teacherEmail,
        EventImageUrl: imageUrl,
      });

      showAlert("Success", "Event created successfully!");
      setEventCreated(true);
      router.push("/events/teachersallevents");
    } catch (error: unknown) {
      const e = error as Error;
      console.error(e.message);
      showAlert("Error", "Failed to create event");
    }
  };

  const styles = StyleSheet.create({
    container: { 
      flex: 1, 
      justifyContent: "center", 
      alignItems: "center", 
      padding: 20 
    },
    input: { 
      height: 40, 
      margin: 12, 
      borderWidth: 1, 
      padding: 10, 
      width: "90%",
      borderColor: '#888' 
    },
    placeholderText: {
      color: '#888', // Lighter color for placeholders
      fontSize: 14
    },
    button: { 
      marginTop: 20,
      width: '90%'
    },
    imagePreview: { 
      width: 200, 
      height: 200, 
      marginVertical: 10 
    }
  });

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        onChangeText={setEventName}
        value={eventName}
        placeholder="Event Name"
        placeholderTextColor={styles.placeholderText.color}
      />
      <TextInput
        style={styles.input}
        onChangeText={setEventDescription}
        value={eventDescription}
        placeholder="Event Description"
        placeholderTextColor={styles.placeholderText.color}
      />
      <TextInput
        style={styles.input}
        onChangeText={setEventPrice}
        value={eventPrice}
        placeholder="Event Price"
        keyboardType="numeric"
        placeholderTextColor={styles.placeholderText.color}
      />
      <TextInput
        style={styles.input}
        onChangeText={setEventVenue}
        value={eventVenue}
        placeholder="Event Venue"
        placeholderTextColor={styles.placeholderText.color}
      />
      
      {/* Rest of the component remains the same */}
      <UnifiedDateTimePicker onChange={setEventDateTime} />
      <Button title="Pick an image" onPress={pickImage} />
      {eventImage && <Image source={{ uri: eventImage }} style={styles.imagePreview} />}
      <View style={styles.button}>
        <Button title="Create Event" onPress={handleCreateEvent} />
      </View>
    </View>
  );
}