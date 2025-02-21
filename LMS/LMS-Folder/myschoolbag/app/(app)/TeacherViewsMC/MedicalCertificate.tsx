import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Linking,
  ScrollView,
} from "react-native";
import { db } from "../../../firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";

const TeacherMCLOA = () => {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<string[]>(["K1", "K2"]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch students for the selected class
  const fetchStudents = async (className: string) => {
    setLoading(true);
    try {
      const studentsCollection = collection(db, "Students");
      const studentsQuery = query(
        studentsCollection,
        where("className", "==", className)
      );
      const studentsSnapshot = await getDocs(studentsQuery);
      const studentsData = studentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setStudents(studentsData);
      setFilteredStudents(studentsData);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch MC/LOA records for the selected student
  const fetchRecords = async (studentID: string) => {
    setLoading(true);
    try {
      const recordsCollection = collection(
        db,
        "Medical Certificates and Leave of Absence"
      );
      const recordsQuery = query(
        recordsCollection,
        where("studentID", "==", studentID)
      );
      const recordsSnapshot = await getDocs(recordsQuery);
      const recordsData = recordsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRecords(recordsData);
    } catch (error) {
      console.error("Error fetching records:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    const filtered = students.filter((student) =>
      student.childFullName.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredStudents(filtered);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Student Leave & Medical Records</Text>

      {loading && <ActivityIndicator size="large" color="#4B0082" />}

      {/* Class Selection */}
      {!selectedClass && (
        <ScrollView contentContainerStyle={styles.centerContent}>
          <Text style={styles.subTitle}>Select a Class</Text>
          {classes.map((className) => (
            <TouchableOpacity
              key={className}
              style={styles.card}
              onPress={() => {
                setSelectedClass(className);
                fetchStudents(className);
              }}
            >
              <Text style={styles.cardText}>{className}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Student Selection */}
      {selectedClass && !selectedStudent && (
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedClass(null)}
          >
            <Text style={styles.backButtonText}>Back to Class Selection</Text>
          </TouchableOpacity>
          <Text style={styles.subTitle}>Students in {selectedClass}</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search Students"
            value={searchQuery}
            onChangeText={handleSearchChange}
          />
          <FlatList
            data={filteredStudents}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => {
                  setSelectedStudent(item.id);
                  fetchRecords(item.id);
                }}
              >
                <Text style={styles.cardText}>{item.childFullName}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* MC/LOA Records */}
      {selectedStudent && (
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setSelectedStudent(null);
              setRecords([]);
            }}
          >
            <Text style={styles.backButtonText}>Back to Students List</Text>
          </TouchableOpacity>
          <Text style={styles.subTitle}>
            Records for{" "}
            {students.find((s) => s.id === selectedStudent)?.childFullName}
          </Text>
          {records.length === 0 ? (
            <Text style={styles.noRecordsText}>
              No records found for this student.
            </Text>
          ) : (
            records.map((record) => (
              <View key={record.id} style={styles.record}>
                <Text style={styles.recordText}>
                  File Type: {record.fileType || "N/A"}
                </Text>
                <Text style={styles.recordText}>
                  Start Date:{" "}
                  {record.startDate
                    ? new Date(record.startDate.seconds * 1000).toLocaleDateString()
                    : "N/A"}
                </Text>
                <Text style={styles.recordText}>
                  End Date:{" "}
                  {record.endDate
                    ? new Date(record.endDate.seconds * 1000).toLocaleDateString()
                    : "N/A"}
                </Text>
                <Text style={styles.recordText}>
                  Date Submitted:{" "}
                  {record.dateSubmitted
                    ? new Date(record.dateSubmitted.seconds * 1000).toLocaleDateString()
                    : "N/A"}
                </Text>
                {record.fileURL && (
                  <TouchableOpacity
                    onPress={() =>
                      Linking.openURL(record.fileURL).catch((err) =>
                        console.error("Failed to open URL:", err)
                      )
                    }
                  >
                    <Text style={styles.link}>View File</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
};

export default TeacherMCLOA;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4B0082",
    textAlign: "center",
    marginBottom: 20,
  },
  subTitle: {
    fontSize: 20,
    color: "#4B0082",
    marginBottom: 10,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#f3f3f3",
    padding: 25,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  cardText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4B0082",
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    color: "#4B0082",
    textDecorationLine: "underline",
    fontSize: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  content: {
    flex: 1,
  },
  record: {
    marginBottom: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
  },
  recordText: {
    fontSize: 14,
    marginBottom: 5,
  },
  noRecordsText: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginTop: 20,
  },
  link: {
    color: "#4B0082",
    textDecorationLine: "underline",
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
});

export default TeacherMCLOA;