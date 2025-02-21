// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   TouchableOpacity,
//   Alert,
//   StyleSheet,
// } from "react-native";
// import { auth, db, storage } from "../../../firebaseConfig";
// import * as DocumentPicker from "expo-document-picker";
// import {
//   collection,
//   query,
//   where,
//   getDocs,
//   addDoc,
//   Timestamp,
// } from "firebase/firestore";
// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import { useRouter } from "expo-router";

// export default function LeaveOfAbsence() {
//   const [leaveDocuments, setLeaveDocuments] = useState([]); // Store uploaded leave documents
//   const [selectedDate, setSelectedDate] = useState(new Date()); // Selected date
//   const [showDatePicker, setShowDatePicker] = useState(false); // Toggle date picker
//   const router = useRouter(); // Navigation router

//   useEffect(() => {
//     fetchLeaveDocuments(); // Load all leave documents on mount
//   }, []);

//   // Fetch leave of absence documents from Firestore
//   const fetchLeaveDocuments = async (date = null) => {
//     try {
//       const q = query(
//         collection(db, "Leave of Absence"),
//         where("parentUID", "==", auth.currentUser?.uid)
//       );

//       const querySnapshot = await getDocs(q);
//       const results = [];
//       querySnapshot.forEach((doc) => {
//         const data = doc.data();
//         if (
//           date &&
//           data.uploadTimestamp.toDate().toDateString() !== date.toDateString()
//         ) {
//           return; // Filter by selected date
//         }
//         results.push({ id: doc.id, ...data });
//       });
//       setLeaveDocuments(results);
//     } catch (error) {
//       console.error("Error fetching leave documents:", error);
//     }
//   };

//   // Handle file upload
//   const handleFileUpload = async () => {
//     try {
//       const result = await DocumentPicker.getDocumentAsync({
//         type: "*/*", // Accept all file types
//         copyToCacheDirectory: true,
//       });

//       if (result.type === "success") {
//         const fileName = result.name;
//         const fileUri = result.uri;

//         // Convert file URI to Blob
//         const response = await fetch(fileUri);
//         const blob = await response.blob();

//         // Create a storage reference
//         const fileRef = ref(storage, `uploads/${auth.currentUser?.uid}/${fileName}`);

//         // Upload the file to Firebase Storage
//         await uploadBytes(fileRef, blob);

//         // Get the file's download URL
//         const fileUrl = await getDownloadURL(fileRef);

//         // Save file details to Firestore
//         await addDoc(collection(db, "Leave of Absence"), {
//           parentUID: auth.currentUser?.uid,
//           fileName,
//           fileUrl, // Firebase Storage URL
//           uploadTimestamp: Timestamp.now(),
//         });

//         Alert.alert("Success", `${fileName} uploaded successfully.`);
//         fetchLeaveDocuments(); // Refresh the list to show the uploaded file
//       }
//     } catch (error) {
//       console.error("File upload error:", error);
//       Alert.alert("Error", "File upload failed. Please try again.");
//     }
//   };

//   // Handle date selection
//   const handleDateChange = (event, selectedDate) => {
//     setShowDatePicker(false); // Hide date picker
//     if (selectedDate) {
//       setSelectedDate(selectedDate);
//       fetchLeaveDocuments(selectedDate); // Filter leave documents by selected date
//     }
//   };

//   // Back button handler
//   const handleBack = () => {
//     router.push("/contactus/contact_us"); // Redirect to Contact Us page
//   };

//   return (
//     <View style={styles.container}>
//       <TouchableOpacity style={styles.backButton} onPress={handleBack}>
//         <Text style={styles.backButtonText}>Back to Contact Us</Text>
//       </TouchableOpacity>
      
//       <Text style={styles.title}>Leave of Absence</Text>

//       {/* Upload Button */}
//       <TouchableOpacity style={styles.uploadButton} onPress={handleFileUpload}>
//         <Text style={styles.uploadButtonText}>Upload Leave Document</Text>
//       </TouchableOpacity>

//       {/* Date Picker */}
//       <View style={styles.datePickerContainer}>
//         <TouchableOpacity
//           style={styles.datePickerButton}
//           onPress={() => setShowDatePicker(true)}
//         >
//           <Text style={styles.datePickerText}>
//             {`Filter by Date: ${selectedDate.toDateString()}`}
//           </Text>
//         </TouchableOpacity>
//         {showDatePicker && (
//           <DateTimePicker
//             value={selectedDate}
//             mode="date"
//             display="default"
//             onChange={handleDateChange}
//           />
//         )}
//       </View>

//       {/* Uploaded Files */}
//       <Text style={styles.subTitle}>Upload History</Text>
//       <FlatList
//         data={leaveDocuments}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item }) => (
//           <View style={styles.fileContainer}>
//             <Text style={styles.fileName}>{item.fileName}</Text>
//             <Text style={styles.fileDate}>
//               Uploaded on: {item.uploadTimestamp.toDate().toDateString()}
//             </Text>
//           </View>
//         )}
//         ListEmptyComponent={
//           <Text style={styles.noDataText}>No leave documents found.</Text>
//         }
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#fff",
//     padding: 16,
//   },
//   backButton: {
//     backgroundColor: "#4B0082",
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//     borderRadius: 8,
//     marginBottom: 20,
//     alignSelf: "flex-start",
//   },
//   backButtonText: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: "bold",
//     marginBottom: 16,
//     color: "#4B0082", // Indigo
//   },
//   uploadButton: {
//     backgroundColor: "#28ccbc",
//     paddingVertical: 12,
//     borderRadius: 8,
//     marginBottom: 16,
//     alignItems: "center",
//   },
//   uploadButtonText: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   datePickerContainer: {
//     marginBottom: 16,
//   },
//   datePickerButton: {
//     backgroundColor: "#4B0082",
//     paddingVertical: 10,
//     borderRadius: 8,
//     alignItems: "center",
//   },
//   datePickerText: {
//     color: "#fff",
//     fontSize: 14,
//   },
//   subTitle: {
//     fontSize: 20,
//     fontWeight: "bold",
//     marginBottom: 10,
//   },
//   fileContainer: {
//     padding: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: "#ddd",
//   },
//   fileName: {
//     fontSize: 16,
//     color: "#000",
//   },
//   fileDate: {
//     fontSize: 12,
//     color: "#808080",
//   },
//   noDataText: {
//     textAlign: "center",
//     fontSize: 16,
//     color: "#808080",
//     marginTop: 20,
//   },
// });
