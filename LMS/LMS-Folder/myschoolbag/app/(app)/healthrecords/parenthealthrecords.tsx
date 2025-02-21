import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { db, auth, storage } from "../../../firebaseConfig";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { useUser } from '@/context/UserContext'; 
import * as DocumentPicker from "expo-document-picker";

const ParentHealthRecords = () => {
  const [activeTab, setActiveTab] = useState("Allergies");
  const [allergies, setAllergies] = useState([]);
  const [newAllergy, setNewAllergy] = useState("");
  const [editingAllergy, setEditingAllergy] = useState(null); // Track the allergy being edited
  const [medicalCertificates, setMedicalCertificates] = useState([]);
  const [file, setFile] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchAllergies();
    fetchMedicalCertificates();
  }, []);

  // Fetch Allergies
  const fetchAllergies = async () => {
    const q = query(
      collection(db, "Allergies"),
      where("parentUID", "==", auth.currentUser?.uid)
    );
    const querySnapshot = await getDocs(q);
    const results = [];
    querySnapshot.forEach((doc) => results.push({ id: doc.id, ...doc.data() }));
    setAllergies(results);
  };

  // Fetch Medical Certificates
  const fetchMedicalCertificates = async () => {
    const q = query(
      collection(db, "Medical Certificates"),
      where("parentUID", "==", auth.currentUser?.uid)
    );
    const querySnapshot = await getDocs(q);
    const results = [];
    querySnapshot.forEach((doc) => results.push({ id: doc.id, ...doc.data() }));
    setMedicalCertificates(results);
  };

  // Add or Update Allergy
  const saveAllergy = async () => {
    if (!newAllergy) {
      Alert.alert("Error", "Allergy cannot be empty!");
      return;
    }
    try {
      if (editingAllergy) {
        const allergyRef = doc(db, "Allergies", editingAllergy.id);
        await updateDoc(allergyRef, { allergy: newAllergy });
        Alert.alert("Success", "Allergy updated successfully!");
      } else {
        await addDoc(collection(db, "Allergies"), {
          parentUID: auth.currentUser?.uid,
          allergy: newAllergy,
          dateAdded: Timestamp.now(),
        });
        Alert.alert("Success", "Allergy added successfully!");
      }
      setNewAllergy("");
      setEditingAllergy(null);
      fetchAllergies(); // Refresh the list
    } catch (error) {
      Alert.alert("Error", "Failed to save allergy.");
    }
  };

  // Edit Allergy
  const editAllergy = (allergy) => {
    setNewAllergy(allergy.allergy);
    setEditingAllergy(allergy);
  };

  // Delete Allergy
  const deleteAllergy = async (id) => {
    try {
      await deleteDoc(doc(db, "Allergies", id));
      Alert.alert("Success", "Allergy deleted successfully!");
      fetchAllergies(); // Refresh the list
    } catch (error) {
      Alert.alert("Error", "Failed to delete allergy.");
    }
  };

  // Upload Medical Certificate
  const uploadMedicalCertificate = async () => {
    if (!startDate || !endDate || !file) {
      Alert.alert("Error", "Please fill out all fields and select a file.");
      return;
    }

    try {
      const response = await fetch(file.uri);
      const blob = await response.blob();

      const fileRef = ref(storage, `MedicalCertificates/${file.name}`);
      await uploadBytes(fileRef, blob);
      const fileURL = await getDownloadURL(fileRef);

      await addDoc(collection(db, "Medical Certificates"), {
        parentUID: auth.currentUser?.uid,
        fileURL,
        startDate,
        endDate,
        uploadedAt: Timestamp.now(),
      });

      Alert.alert("Success", "Medical Certificate uploaded successfully!");
      setFile(null);
      setStartDate("");
      setEndDate("");
      fetchMedicalCertificates(); // Refresh the list
    } catch (error) {
      Alert.alert("Error", "Failed to upload medical certificate.");
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync();
    if (result.type === "success") {
      setFile(result);
    }
  };

  return (
    <View style={styles.container}>
      {/* <Text style={styles.header}>Parent Health Records</Text> */}
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "Allergies" && styles.activeTab]}
          onPress={() => setActiveTab("Allergies")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "Allergies" && styles.activeTabText,
            ]}
          >
            Allergies
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "Medical Certificates" && styles.activeTab,
          ]}
          onPress={() => setActiveTab("Medical Certificates")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "Medical Certificates" && styles.activeTabText,
            ]}
          >
            Medical Certificates
          </Text>
        </TouchableOpacity>
      </View>

      {/* Allergy Section */}
      {activeTab === "Allergies" && (
        <View>
          <TextInput
            style={styles.input}
            placeholder="Type your allergy here"
            value={newAllergy}
            onChangeText={setNewAllergy}
          />
          <Button
            title={editingAllergy ? "Update Allergy" : "Add Allergy"}
            color="#27CCBC"
            onPress={saveAllergy}
          />
          <Text style={styles.subHeader}>Record of Allergies</Text>
          <FlatList
            data={allergies}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.listItem}>
                <Text>{item.allergy}</Text>
                <View style={styles.actions}>
                  <Button title="Edit" onPress={() => editAllergy(item)} />
                  <Button
                    title="Delete"
                    color="red"
                    onPress={() => deleteAllergy(item.id)}
                  />
                </View>
              </View>
            )}
          />
        </View>
      )}

      {/* Medical Certificates Section */}
      {activeTab === "Medical Certificates" && (
        <View>
          <TextInput
            style={styles.input}
            placeholder="Start Date (DD-MM-YYYY)"
            value={startDate}
            onChangeText={setStartDate}
          />
          <TextInput
            style={styles.input}
            placeholder="End Date (DD-MM-YYYY)"
            value={endDate}
            onChangeText={setEndDate}
          />
          <Button title="Select File" color="#3B2C93" onPress={pickDocument} />
          {file && <Text>Selected File: {file.name}</Text>}
          <Button
            title="Upload Medical Certificate"
            color="#27CCBC"
            onPress={uploadMedicalCertificate}
          />
          <Text style={styles.subHeader}>Uploaded Medical Certificates</Text>
          <FlatList
            data={medicalCertificates}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.listItem}>
                <Text>
                  Start Date: {item.startDate}, End Date: {item.endDate}
                </Text>
                {item.fileURL && (
                  <Text style={styles.link} onPress={() => Linking.openURL(item.fileURL)}>
                    View File
                  </Text>
                )}
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3B2C93",
    marginBottom: 16,
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  tab: {
    padding: 10,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#3B2C93",
  },
  tabText: {
    fontSize: 20,
    color: "#808080",
  },
  activeTabText: {
    color: "#3B2C93",
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  subHeader: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3B2C93",
    marginTop: 20,
    marginBottom: 10,
  },
  listItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  link: {
    color: "#27CCBC",
    textDecorationLine: "underline",
  },
});

export default ParentHealthRecords;
