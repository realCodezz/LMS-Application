import React, { useState } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { auth, db } from "../../../firebaseConfig";
import { collection, addDoc, Timestamp } from "firebase/firestore";

export default function Feedback() {
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter(); // Router for navigation

  // Handle back button
  const handleBack = () => {
    router.push("contactus/contact_us"); // Redirect to Contact Us page
  };

  // Handle feedback submission
  const handleFeedbackSubmit = async () => {
    if (!feedback.trim()) {
      Alert.alert("Error", "Please enter your feedback or suggestion.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Save feedback to Firestore
      await addDoc(collection(db, "Feedback"), {
        parentUID: auth.currentUser?.uid,
        feedbackText: feedback.trim(),
        submittedAt: Timestamp.now(),
      });

      Alert.alert("Thank You!", "Your feedback has been submitted.");
      setFeedback(""); // Clear the input field
    } catch (error) {
      console.error("Error submitting feedback:", error);
      Alert.alert("Error", "Unable to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Text style={styles.backButtonText}>Back to Contact Us</Text>
      </TouchableOpacity>

      <Text style={styles.title}>We value your feedback!</Text>
      <Text style={styles.subTitle}>
        Please let us know your thoughts, suggestions, or concerns.
      </Text>

      <TextInput
        style={styles.textInput}
        multiline
        placeholder="Enter your feedback or suggestion here..."
        placeholderTextColor="#808080"
        value={feedback}
        onChangeText={setFeedback}
      />

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleFeedbackSubmit}
        disabled={isSubmitting}
      >
        <Text style={styles.submitButtonText}>
          {isSubmitting ? "Submitting..." : "Submit Feedback"}
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
    justifyContent: "top",
    alignItems: "center",
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#4B0082", // Indigo
    textAlign: "center",
  },
  subTitle: {
    fontSize: 16,
    marginBottom: 20,
    color: "#808080", // Gray
    textAlign: "center",
  },
  textInput: {
    width: "100%",
    height: 150,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: "top",
    backgroundColor: "#f9f9f9",
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: "#28ccbc", // Teal
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
