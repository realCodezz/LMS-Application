import React, { useState, useEffect } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet, Text, Alert, ScrollView } from "react-native";
import { auth, db } from "../../../firebaseConfig"; // Replace with your Firebase configuration file
import { collection, getDocs, setDoc, doc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useFonts, OpenSans_400Regular } from "@expo-google-fonts/open-sans";

// Define the type for a class document
interface ClassData {
  id: string;
  name: string;
}

const AddUserForm: React.FC = () => {
  const [fontsLoaded] = useFonts({ OpenSans_400Regular });
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "Classes"));
        const classList: ClassData[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name as string,
        }));
        setClasses(classList);
      } catch (error) {
        console.error("Error fetching classes:", error);
        Alert.alert("Error", "Failed to fetch classes.");
      }
    };

    fetchClasses();
  }, []);

  const handleAddClass = (classId: string) => {
    if (!selectedClasses.includes(classId)) {
      setSelectedClasses((prev) => [...prev, classId]);
    }
  };

  const handleRemoveClass = (classId: string) => {
    setSelectedClasses((prev) => prev.filter((id) => id !== classId));
  };

  const handleSubmit = async () => {
    if (!email || !password || !fullName || !phoneNumber || !role) {
      Alert.alert("Error", "All fields except classesInCharge are required.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "Users", user.uid), {
        email,
        fullName,
        phoneNumber,
        role,
        classesInCharge: selectedClasses,
      });

      Alert.alert("Success", "User added successfully!");
      setEmail("");
      setPassword("");
      setFullName("");
      setPhoneNumber("");
      setRole("");
      setSelectedClasses([]);
    } catch (error: any) {
      console.error("Error adding user:", error);
      Alert.alert("Error", error.message || "Failed to add user. Please try again.");
    }
  };

  if (!fontsLoaded) {
    return <Text style={{ textAlign: "center", marginTop: 20 }}>Loading...</Text>;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add New Teacher</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Enter email"
        placeholderTextColor="#808080"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Enter password"
        secureTextEntry={true}
        placeholderTextColor="#808080"
      />

      <Text style={styles.label}>Full Name</Text>
      <TextInput
        style={styles.input}
        value={fullName}
        onChangeText={setFullName}
        placeholder="Enter full name"
        placeholderTextColor="#808080"
      />

      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        placeholder="Enter phone number"
        keyboardType="phone-pad"
        placeholderTextColor="#808080"
      />

      <Text style={styles.label}>Role</Text>
      <TextInput
        style={styles.input}
        value={role}
        onChangeText={setRole}
        placeholder="Enter role (e.g., Teacher, Admin)"
        placeholderTextColor="#808080"
      />

      <Text style={styles.label}>Classes in Charge</Text>
      {classes.map((cls) => (
        <View key={cls.id} style={styles.classItem}>
          <Text style={styles.classText}>{cls.name}</Text>
          {selectedClasses.includes(cls.id) ? (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveClass(cls.id)}
            >
              <Text style={styles.buttonText}>Remove</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleAddClass(cls.id)}
            >
              <Text style={styles.buttonText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Add User</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#FFF",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4B0082",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "OpenSans_400Regular",
  },
  label: {
    fontSize: 16,
    color: "#4B0082",
    marginBottom: 8,
    fontFamily: "OpenSans_400Regular",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    fontSize: 16,
    fontFamily: "OpenSans_400Regular",
    color: "#000",
  },
  classItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    backgroundColor: "#F9F9F9",
    padding: 10,
    borderRadius: 8,
  },
  classText: {
    fontSize: 16,
    fontFamily: "OpenSans_400Regular",
    color: "#333",
  },
  addButton: {
    backgroundColor: "#4B0082",
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  removeButton: {
    backgroundColor: "#FF6B6B",
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  submitButton: {
    backgroundColor: "#4B0082",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "OpenSans_400Regular",
  },
});

export default AddUserForm;
