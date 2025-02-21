import React, { useEffect, useState } from "react";
import { 
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity 
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import { db, storage } from "@/firebaseConfig";
import { useUser } from "@/context/UserContext";
import Ionicons from "react-native-vector-icons/Ionicons"; // 🔹 Added for camera icon

interface Child {
  id: string;
  childFullName: string;
  childDOB: string;
  className: string;
  profilePic?: string;
}

interface SubjectSchedule {
  subject: string;
  startTime: string;
  endTime: string;
}

interface Schedule {
  [day: string]: { subjects: SubjectSchedule[] };
}

const ParentProfile: React.FC = () => {
  const { user } = useUser();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [selectedChildInfo, setSelectedChildInfo] = useState<Child | null>(null);
  const [schedule, setSchedule] = useState<Schedule>({});
  const [childProfilePic, setChildProfilePic] = useState<string | null>(null);

  // 🔹 Fetch children from Firestore
  useEffect(() => {
    const fetchChildren = async () => {
      if (!user) return;

      try {
        const q = query(collection(db, "Students"), where("parentUIDs", "array-contains", user.id));
        const querySnapshot = await getDocs(q);

        const childList: Child[] = querySnapshot.docs.map((doc) => {
          const childData = doc.data() as Child;
          return { 
            id: doc.id, 
            childFullName: childData.childFullName, 
            childDOB: childData.childDOB, 
            className: childData.className, 
            profilePic: childData.profilePic ?? undefined 
          };
        });

        setChildren(childList);
        if (childList.length > 0) {
          setSelectedChild(childList[0].id);
        }
      } catch (error) {
        console.error("Error fetching children:", error);
      }
    };

    fetchChildren();
  }, [user]);

  // 🔹 Fetch schedule for selected child's class
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!selectedChild) return;

      const childData = children.find((child) => child.id === selectedChild);
      if (!childData) return;

      setSelectedChildInfo(childData);
      setChildProfilePic(childData.profilePic || null);

      try {
        const q = query(collection(db, "Classes"), where("name", "==", childData.className));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const classData = querySnapshot.docs[0].data();
          setSchedule(classData.schedules || {});
        }
      } catch (error) {
        console.error("Error fetching schedule:", error);
      }
    };

    fetchSchedule();
  }, [selectedChild, children]);

  // 🔹 Handle image selection and upload
  const handleImagePick = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const response = await fetch(uri);
      const blob = await response.blob();

      const childRef = ref(storage, `profile_pictures/${selectedChild}`);
      await uploadBytes(childRef, blob);
      const downloadURL = await getDownloadURL(childRef);

      setChildProfilePic(downloadURL);

      // Update Firestore with new profile picture URL
      if (selectedChild) {
        await updateDoc(doc(db, "Students", selectedChild), { profilePic: downloadURL });
      }
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Parent Profile</Text>

      {/* Select Child Dropdown */}
      <Text style={styles.label}>Select Child</Text>
      <Picker
        selectedValue={selectedChild}
        onValueChange={(value) => setSelectedChild(value)}
        style={styles.picker}
      >
        {children.map((child) => (
          <Picker.Item key={child.id} label={child.childFullName} value={child.id} />
        ))}
      </Picker>

      {/* Display Child Information */}
      {selectedChildInfo && (
        <View style={styles.childInfoContainer}>
          {/* Profile Picture with Camera Button */}
          <View style={styles.imageContainer}>
            <Image
              source={childProfilePic ? { uri: childProfilePic } : require("../../../assets/images/nophoto.jpg")}
              style={styles.profileImage}
            />
            <TouchableOpacity onPress={handleImagePick} style={styles.cameraButton}>
              <Ionicons name="camera-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <Text style={styles.childName}>{selectedChildInfo.childFullName}</Text>
          <Text style={styles.childDetails}>Date of Birth: {selectedChildInfo.childDOB}</Text>
          <Text style={styles.childDetails}>Class: {selectedChildInfo.className}</Text>
        </View>
      )}

      {/* Display Schedule */}
      <View style={styles.scheduleContainer}>
        <Text style={styles.sectionHeader}>Class Schedule</Text>
        {Object.entries(schedule).length > 0 ? (
          Object.entries(schedule).map(([day, data]) => (
            <View key={day} style={styles.daySchedule}>
              <Text style={styles.dayHeader}>{day}</Text>
              {data.subjects.map((subject, index) => (
                <Text key={index} style={styles.subjectText}>
                  {subject.subject} ({subject.startTime} - {subject.endTime})
                </Text>
              ))}
            </View>
          ))
        ) : (
          <Text style={styles.noSchedule}>No schedule available.</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#f8f9fa" },
  header: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  label: { fontSize: 18, fontWeight: "600", marginBottom: 5 },
  picker: { height: 50, backgroundColor: "#f0f0f0", borderRadius: 8 },
  scheduleContainer: { marginTop: 20, padding: 15, backgroundColor: "#fff", borderRadius: 10 },
  sectionHeader: { fontSize: 22, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  daySchedule: { marginBottom: 15 },
  dayHeader: { fontSize: 18, fontWeight: "bold", color: "#333" },
  subjectText: { fontSize: 16, color: "#555" },
  noSchedule: { fontSize: 16, color: "#777", textAlign: "center", marginTop: 10 },
  childInfoContainer: { alignItems: "center", marginVertical: 20, padding: 15, backgroundColor: "#fff", borderRadius: 10 },
  imageContainer: { position: "relative" },
  profileImage: { width: 120, height: 120, borderRadius: 60, marginBottom: 10 },
  cameraButton: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "#6200ea",
    borderRadius: 20,
    width: 35,
    height: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  childName: { fontSize: 20, fontWeight: "bold", marginBottom: 5 },
  childDetails: { fontSize: 16, color: "#555" },
});

export default ParentProfile;
