import React, { useState } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  TouchableOpacity,
} from "react-native";
import { TextInput, Button, Snackbar, RadioButton } from "react-native-paper";
import * as DocumentPicker from "expo-document-picker";
import { storage, db, auth } from "../../../firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, doc, getDoc, Timestamp } from "firebase/firestore";
import { DatePickerModal } from "react-native-paper-dates";

const MedicalCertificates = () => {
  const router = useRouter(); // Navigation hook for back button
  const [fileType, setFileType] = useState("MC"); // Default to MC
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [file, setFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [isSnackbarOpen, setIsSnackbarOpen] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [loading, setLoading] = useState(false); // Loading state for UI feedback

  // Back button function
  const handleBack = () => {
    router.push("contactus/contact_us"); // Redirect to Contact Us page
  };

  // File Picker
  const pickFile = async () => {
    let result = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
    });

    if (!result.canceled) {
      setFile(result.assets[0]);
    } else {
      setUploadMessage("File selection canceled.");
      setIsSnackbarOpen(true);
    }
  };

  // Upload Handler
  const handleUpload = async () => {
    if (!fileType || !startDate || !endDate || !file) {
      setUploadMessage("Please complete all fields before uploading.");
      setIsSnackbarOpen(true);
      return;
    }

    try {
      setLoading(true); // Show loading indicator

      const userDocRef = doc(db, "Users", auth.currentUser?.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        setUploadMessage("User not found.");
        setIsSnackbarOpen(true);
        return;
      }

      const parentOf = userDocSnap.data()?.parentOf || [];
      if (parentOf.length === 0) {
        setUploadMessage("No linked student found for this user.");
        setIsSnackbarOpen(true);
        return;
      }

      const studentID = parentOf[0];
      const storageRef = ref(storage, `${fileType}/${studentID}/${file.name}`);
      const response = await fetch(file.uri);
      const blob = await response.blob();

      await uploadBytes(storageRef, blob);
      const fileURL = await getDownloadURL(storageRef);

      await addDoc(collection(db, "Medical Certificates and Leave of Absence"), {
        fileType,
        studentID,
        fileURL,
        startDate: Timestamp.fromDate(new Date(startDate)),
        endDate: Timestamp.fromDate(new Date(endDate)),
        dateSubmitted: Timestamp.now(),
      });

      setUploadedFileUrl(fileURL);
      setUploadMessage("File uploaded successfully!");
      setFile(null); // Clear the file after upload
    } catch (error) {
      console.error("Upload error:", error);
      setUploadMessage("Error uploading file. Please try again.");
    } finally {
      setLoading(false); // Hide loading indicator
    }

    setIsSnackbarOpen(true);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Back to Contact Us</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Upload Medical Certificate / LOA</Text>

        {/* File Type Selection */}
        <Text style={styles.subTitle}>Select File Type:</Text>
        <RadioButton.Group onValueChange={(value) => setFileType(value)} value={fileType}>
          <View style={styles.radioContainer}>
            <RadioButton value="MC" />
            <Text>Medical Certificate</Text>
          </View>
          <View style={styles.radioContainer}>
            <RadioButton value="LOA" />
            <Text>Leave of Absence</Text>
          </View>
        </RadioButton.Group>

        {/* Date Pickers - Works on Web & Mobile */}
        <Text style={styles.subTitle}>Start Date:</Text>
        <Button mode="outlined" onPress={() => setShowStartPicker(true)}>
          {startDate ? new Date(startDate).toDateString() : "Select Start Date"}
        </Button>
        <DatePickerModal
          locale="en"
          mode="single"
          visible={showStartPicker}
          onDismiss={() => setShowStartPicker(false)}
          date={startDate}
          onConfirm={(params) => {
            setStartDate(params.date);
            setShowStartPicker(false);
          }}
        />

        <Text style={styles.subTitle}>End Date:</Text>
        <Button mode="outlined" onPress={() => setShowEndPicker(true)}>
          {endDate ? new Date(endDate).toDateString() : "Select End Date"}
        </Button>
        <DatePickerModal
          locale="en"
          mode="single"
          visible={showEndPicker}
          onDismiss={() => setShowEndPicker(false)}
          date={endDate}
          onConfirm={(params) => {
            setEndDate(params.date);
            setShowEndPicker(false);
          }}
        />

        {/* File Picker */}
        <Button icon="file-upload" mode="contained" onPress={pickFile} style={styles.uploadButton}>
          {file ? "Change File" : "Select File"}
        </Button>
        {file && <Text style={styles.fileText}>Selected: {file.name}</Text>}

        {/* Upload Button */}
        <Button
          mode="contained"
          onPress={handleUpload}
          style={styles.uploadButton}
          disabled={!file || loading} // Disable if no file is selected
        >
          {loading ? <ActivityIndicator color="#fff" /> : "Upload File"}
        </Button>

        {/* Uploaded File Preview */}
        {uploadedFileUrl && (
          <View style={styles.previewContainer}>
            <Text style={styles.subTitle}>Uploaded File:</Text>
            {file?.name?.endsWith(".pdf") ? (
              <Text style={styles.link} onPress={() => Linking.openURL(uploadedFileUrl)}>
                Open PDF
              </Text>
            ) : (
              <Image source={{ uri: uploadedFileUrl }} style={styles.uploadedImage} />
            )}
          </View>
        )}

        {/* Snackbar Notification */}
        <Snackbar visible={isSnackbarOpen} onDismiss={() => setIsSnackbarOpen(false)} duration={3000}>
          {uploadMessage}
        </Snackbar>
      </View>
    </ScrollView>
  );
};

export default MedicalCertificates;

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
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
    color: "#4B0082",
    textAlign: "center",
    marginBottom: 20,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 10,
  },
  radioContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  uploadButton: {
    marginVertical: 10,
  },
  fileText: {
    fontSize: 14,
    color: "#555",
    marginVertical: 5,
  },
  previewContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  uploadedImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginTop: 10,
  },
  link: {
    color: "#4B0082",
    textDecorationLine: "underline",
  },
});
