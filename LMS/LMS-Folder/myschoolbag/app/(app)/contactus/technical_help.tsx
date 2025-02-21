import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  FlatList,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { auth, db, storage } from "../../../firebaseConfig";
import {
  collection,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "expo-router";

export default function TechnicalHelp() {
  const [issueCategory, setIssueCategory] = useState("");
  const [description, setDescription] = useState("");
  const [contactPreference, setContactPreference] = useState("Email");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const issueCategories = [
    "Event Registration Issues",
    "Photo Download Issues",
    "Payment Problems",
    "File Upload Errors",
    "Others",
  ];

  // Handle file selection
  const handleFileSelect = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*", // Accept all file types
        copyToCacheDirectory: true,
      });

      if (result.type === "success") {
        setSelectedFile(result);
        Alert.alert("File Selected", `File: ${result.name}`);
      }
    } catch (error) {
      console.error("Error selecting file:", error);
      Alert.alert("Error", "Unable to select file. Please try again.");
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!issueCategory || !description.trim()) {
      Alert.alert("Error", "Please complete all required fields.");
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      let fileUrl = null;
  
      if (selectedFile) {
        const response = await fetch(selectedFile.uri);
        const blob = await response.blob();
  
        // Upload file to Firebase Storage
        const fileRef = ref(
          storage,
          `technical_help/${auth.currentUser?.uid}/${selectedFile.name}`
        );
        await uploadBytes(fileRef, blob);
        fileUrl = await getDownloadURL(fileRef);
      }
  
      // Save technical help request to Firestore
      await addDoc(collection(db, "Technical Help"), {
        parentUID: auth.currentUser?.uid,
        issueCategory,
        description,
        contactPreference,
        fileUrl, // Firebase Storage URL (if file is uploaded)
        submittedAt: Timestamp.now(),
      });
  
      // Success Message
      Alert.alert(
        "Success",
        "Your request has been submitted successfully! Our team will review your issue and get back to you shortly.",
        [
          {
            text: "OK",
            onPress: () => {
              // Reset form fields
              setIssueCategory("");
              setDescription("");
              setContactPreference("Email");
              setSelectedFile(null);
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error submitting technical help:", error);
      Alert.alert("Error", "Unable to submit your request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const router = useRouter(); // Router for navigation

  // Handle back button
  const handleBack = () => {
    router.push("contactus/contact_us"); // Redirect to Contact Us page
  };

   

  return (
    <View style={styles.container}>
              {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
      <Text style={styles.backButtonText}>Back to Contact Us</Text>
      </TouchableOpacity>    

      <Text style={styles.title}>Technical Help</Text>  

      {/* Issue Category */}
      <Text style={styles.label}>Select Issue Category:</Text>
      <FlatList
        data={issueCategories}
        horizontal
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryButton,
              issueCategory === item && styles.categoryButtonSelected,
            ]}
            onPress={() => setIssueCategory(item)}
          >
            <Text
              style={[
                styles.categoryButtonText,
                issueCategory === item && styles.categoryButtonTextSelected,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Description */}
      <Text style={styles.label}>Describe the Issue:</Text>
      <TextInput
        style={styles.textInput}
        multiline
        placeholder="Enter a detailed description..."
        placeholderTextColor="#808080"
        value={description}
        onChangeText={setDescription}
      />

      {/* File Attachment */}
      <TouchableOpacity style={styles.fileButton} onPress={handleFileSelect}>
        <Text style={styles.fileButtonText}>
          {selectedFile ? `Selected: ${selectedFile.name}` : "Attach a File (optional)"}
        </Text>
      </TouchableOpacity>

      {/* Contact Preference */}
      <Text style={styles.label}>Preferred Contact Method:</Text>
      <FlatList
        data={["Email", "Phone"]}
        horizontal
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.contactButton,
              contactPreference === item && styles.contactButtonSelected,
            ]}
            onPress={() => setContactPreference(item)}
          >
            <Text
              style={[
                styles.contactButtonText,
                contactPreference === item && styles.contactButtonTextSelected,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Submit Button */}
      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Text style={styles.submitButtonText}>
          {isSubmitting ? "Submitting..." : "Submit Request"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#fff",
      padding: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 16,
      color: "#4B0082",
      textAlign: "center",
    },
    label: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 8,
      color: "#4B0082",
    },
    backButton: {
      backgroundColor: "#4B0082",
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
      marginBottom: 20,
      alignSelf: "flex-start",
    },
    backButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
    categoryButton: {
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 20,
      paddingVertical: 8, // Adjusted for shorter height
      paddingHorizontal: 16,
      marginRight: 8,
      height: 50, // Set a fixed height
      justifyContent: "center", // Center text vertically
      alignItems: "center", // Center text horizontally
    },
    categoryButtonSelected: {
      backgroundColor: "#4B0082",
    },
    categoryButtonText: {
      fontSize: 14,
      color: "#4B0082",
    },
    categoryButtonTextSelected: {
      color: "#fff",
    },
    textInput: {
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      textAlignVertical: "top",
      height: 80, // Reduced height
      marginBottom: 16,
      backgroundColor: "#f9f9f9",
    },
    fileButton: {
      backgroundColor: "#28ccbc",
      paddingVertical: 10, // Reduced padding
      borderRadius: 8,
      marginBottom: 16,
      alignItems: "center",
    },
    fileButtonText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "bold",
    },
    contactButton: {
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 20,
      paddingVertical: 8, // Adjusted for shorter height
      paddingHorizontal: 16,
      marginRight: 8,
      height: 50, // Set a fixed height
      justifyContent: "center", // Center text vertically
      alignItems: "center", // Center text horizontally
    },
    contactButtonSelected: {
      backgroundColor: "#4B0082",
    },
    contactButtonText: {
      fontSize: 14,
      color: "#4B0082",
    },
    contactButtonTextSelected: {
      color: "#fff",
    },
    submitButton: {
      backgroundColor: "#4B0082",
      paddingVertical: 15,
      borderRadius: 8,
      alignItems: "center",
    },
    submitButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
  });
