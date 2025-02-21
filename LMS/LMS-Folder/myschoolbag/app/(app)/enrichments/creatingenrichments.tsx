import React, { useState } from "react";
import { View, Text, Button, TextInput, StyleSheet, Platform, Alert, Image } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from 'expo-image-picker';
import { db, storage } from "../../../firebaseConfig";
import { addDoc, collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "expo-router";
import { useUser } from '@/context/UserContext';

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

export default function CreateEnrichments() {
  const [enrichmentName, setEnrichmentName] = useState("");
  const [enrichmentDescription, setEnrichmentDescription] = useState("");
  const [enrichmentDateTime, setEnrichmentDateTime] = useState<string>("");
  const [enrichmentImage, setEnrichmentImage] = useState<string | null>(null);
  const [enrichmentVenue, setEnrichmentVenue] = useState("");
  const [enrichmentPrice, setEnrichmentPrice] = useState("");
  const [enrichmentCreated, setEnrichmentCreated] = useState(false);
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

  const getNextEnrichmentID = async () => {
    try {
      const enrichmentsRef = collection(db, "Enrichments");
      const q = query(enrichmentsRef, orderBy("EnrichmentID", "desc"), limit(1));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return 1;
      }
      const highestEnrichment = querySnapshot.docs[0].data();
      return (highestEnrichment.EnrichmentID || 0) + 1;
    } catch (error) {
      console.error("Error getting next enrichmentID:", error);
      throw new Error("Error getting next enrichmentID");
    }
  };

  const pickImage = async () => {
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
      setEnrichmentImage(result.assets[0].uri);
    }
  };

  const handleCreateEnrichment = async () => {
    if (!enrichmentName || !enrichmentDescription || !enrichmentDateTime || !enrichmentImage || !enrichmentVenue || !enrichmentPrice) {
      showAlert("Error", "Please fill in all fields and upload an image");
      return;
    }

    const currentDate = new Date();
    if (new Date(enrichmentDateTime) < currentDate) {
      showAlert("Error", "Enrichment date and time cannot be in the past");
      return;
    }

    try {
      const newEnrichmentID = await getNextEnrichmentID();

      const response = await fetch(enrichmentImage!);
      const blob = await response.blob();
      const imageRef = ref(storage, `Enrichments/${newEnrichmentID}_image`);
      await uploadBytes(imageRef, blob);
      const imageUrl = await getDownloadURL(imageRef);

      await addDoc(collection(db, "Enrichments"), {
        EnrichmentID: newEnrichmentID,
        EnrichmentName: enrichmentName,
        EnrichmentDescription: enrichmentDescription,
        EnrichmentDateTime: enrichmentDateTime,
        NoOfAttendees: 0,
        attendees: [],
        EnrichmentVenue: enrichmentVenue,
        EnrichmentPrice: enrichmentPrice,
        TeacherEmail: teacherEmail,
        EnrichmentImageUrl: imageUrl,
      });

      showAlert("Success", "Enrichment created successfully!");
      setEnrichmentCreated(true);
      router.push("/enrichments/teachersallenrichments");
    } catch (error: unknown) {
      const e = error as Error;
      console.error(e.message);
      showAlert("Error", "Failed to create enrichment");
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
        onChangeText={setEnrichmentName}
        value={enrichmentName}
        placeholder="Enrichment Name"
        placeholderTextColor={styles.placeholderText.color}
      />
      <TextInput
        style={styles.input}
        onChangeText={setEnrichmentDescription}
        value={enrichmentDescription}
        placeholder="Enrichment Description"
        placeholderTextColor={styles.placeholderText.color}
      />
      <TextInput
        style={styles.input}
        onChangeText={setEnrichmentVenue}
        value={enrichmentVenue}
        placeholder="Enrichment Venue"
        placeholderTextColor={styles.placeholderText.color}
      />
      <TextInput
        style={styles.input}
        onChangeText={setEnrichmentPrice}
        value={enrichmentPrice}
        placeholder="Enrichment Price"
        keyboardType="numeric"
        placeholderTextColor={styles.placeholderText.color}
      />
      <UnifiedDateTimePicker onChange={setEnrichmentDateTime} />
      <Button title="Pick an image" onPress={pickImage} />
      {enrichmentImage && <Image source={{ uri: enrichmentImage }} style={styles.imagePreview} />}
      <View style={styles.button}>
        <Button title="Create Enrichment" onPress={handleCreateEnrichment} />
      </View>
    </View>
  );
}