import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity, Platform, Image, RefreshControl, ActivityIndicator } from 'react-native';
import { TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types/RootStackParamList";
import { RouteProp, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useFonts, OpenSans_400Regular } from '@expo-google-fonts/open-sans';
// database imports
import 'firebase/auth'; 
import { db } from "../../../firebaseConfig";
import { storage } from '../../../firebaseConfig';
import { collection, getDoc, getDocs, query, where, addDoc, deleteDoc, updateDoc, onSnapshot, Timestamp } from "firebase/firestore";
import { ref, getDownloadURL } from 'firebase/storage';
import { Dimensions } from 'react-native';
import { useUser } from '@/context/UserContext';

// defines params passed into here
type AttendanceRouteProp = RouteProp<RootStackParamList, 'pages/Attendance'>;

interface Student {
  checkin: string | null;
  checkout: string | null;
  id: string;
  name: string;
  status: 'present' | 'absent';
  remarks: string;
  profilePicture?: string;
}

interface AttendanceData {
  className: string;
  dateTaken: string;
  students: {
    name: string;
    checkin: string | null;
    checkout: string | null;
    status: string;
    remarks: string;
  }[];
}

const Attendance: React.FC = () => {
  // Load OpenSans font
  const [fontsLoaded] = useFonts({
    OpenSans_400Regular,
  });

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user } = useUser();
  const [date] = useState<Date>(new Date());
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const route = useRoute<AttendanceRouteProp>();
  const { className } = route.params;
  const [students, setStudents] = useState<Student[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'absent'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  const defaultProfileImage = require('../../../assets/images/nophoto.jpg');

  // Add state for editing remarks
  const [editingRemarks, setEditingRemarks] = useState<{ [key: string]: string }>({});
  const [isEditingRemarks, setIsEditingRemarks] = useState<{ [key: string]: boolean }>({});
  const [savingRemarks, setSavingRemarks] = useState<{ [key: string]: boolean }>({});

  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    month: 'long', 
    day: '2-digit', 
    year: 'numeric' 
  };
  const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(date);

  const formattedDate = `${parts.find(p => p.type === 'weekday')?.value}, ` +
                      `${parts.find(p => p.type === 'month')?.value} ` +
                      `${parts.find(p => p.type === 'day')?.value} ` +
                      `${parts.find(p => p.type === 'year')?.value}`;

  // Set up real-time listener for attendance updates
  useEffect(() => {
    if (user) {
      const dateTaken = new Date().toDateString();
      const attendanceQuery = query(
        collection(db, "Attendances Held"),
        where("className", "==", className),
        where("dateTaken", "==", dateTaken)
      );

      // Subscribe to real-time updates
      const unsubscribe = onSnapshot(attendanceQuery, async (querySnapshot) => {
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const data = doc.data();
          
          // Map the students data with profile pictures
          const updatedStudents = await Promise.all(
            data.students.map(async (student: any, index: number) => {
              let profilePicture = null;
              try {
                const storageRef = ref(storage, `profilePictures/${student.name}`);
                profilePicture = await getDownloadURL(storageRef);
              } catch (error) {
                console.log('No profile picture found for student:', student.name);
              }

              return {
                id: index.toString(),
                name: student.name,
                checkin: student.checkin,
                checkout: student.checkout,
                status: student.status,
                remarks: student.remarks,
                profilePicture,
              };
            })
          );

          setStudents(updatedStudents);
        } else {
          // If no attendance document exists yet, create one
          const studentsQuery = query(
            collection(db, 'Students'),
            where('className', '==', className)
          );

          const studentsSnapshot = await getDocs(studentsQuery);
          const studentData = await Promise.all(
            studentsSnapshot.docs.map(async (doc, index) => {
              let profilePicture = null;
              try {
                const storageRef = ref(storage, `profilePictures/${doc.data().childFullName}`);
                profilePicture = await getDownloadURL(storageRef);
              } catch (error) {
                console.log('No profile picture found for student:', doc.data().childFullName);
              }

              return {
                id: index.toString(),
                name: doc.data().childFullName,
                checkin: null,
                checkout: null,
                status: 'absent',
                remarks: '',
                profilePicture,
              };
            })
          );

          // Create new attendance document
          const attendanceData = {
            className: className,
            dateTaken: dateTaken,
            students: studentData,
          };

          await addDoc(collection(db, 'Attendances Held'), attendanceData);
          setStudents(studentData);
        }
        setIsLoading(false);
      }, (error) => {
        console.error("Error listening to attendance updates:", error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to get real-time updates',
          position: 'bottom',
          visibilityTime: 3000,
        });
        setIsLoading(false);
      });

      // Cleanup subscription on unmount
      return () => unsubscribe();
    }
  }, [user, className]);

  // Filter students based on status
  const filteredStudents = useMemo(() => {
    switch (statusFilter) {
      case 'present':
        return students.filter(student => student.status === 'present');
      case 'absent':
        return students.filter(student => student.status === 'absent');
      default:
        return students;
    }
  }, [students, statusFilter]);

  // Get counts for the status tabs
  const studentCounts = useMemo(() => ({
    all: students.length,
    present: students.filter(s => s.status === 'present').length,
    absent: students.filter(s => s.status === 'absent').length,
  }), [students]);

  // Handle starting to edit remarks
  const startEditingRemarks = (studentName: string, currentRemarks: string) => {
    setEditingRemarks(prev => ({ ...prev, [studentName]: currentRemarks }));
    setIsEditingRemarks(prev => ({ ...prev, [studentName]: true }));
  };

  // Handle remarks change (local state only)
  const handleRemarksChange = (studentName: string, remarks: string) => {
    setEditingRemarks(prev => ({ ...prev, [studentName]: remarks }));
  };

  // Handle confirming remarks change
  const confirmRemarksChange = async (studentName: string) => {
    if (user) {
      setSavingRemarks(prev => ({ ...prev, [studentName]: true }));
      const dateTaken = new Date().toDateString();
      const q = query(
        collection(db, "Attendances Held"),
        where("className", "==", className),
        where("dateTaken", "==", dateTaken)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const attendanceDoc = querySnapshot.docs[0].ref;
        const docSnap = await getDoc(attendanceDoc);
        const data = docSnap.data();
        const arrayField = data?.["students"];

        if (arrayField) {
          const indexToUpdate = arrayField.findIndex(
            (item: { name: string }) => item.name === studentName
          );

          if (indexToUpdate !== -1) {
            arrayField[indexToUpdate].remarks = editingRemarks[studentName] || '';

            try {
              await updateDoc(attendanceDoc, {
                "students": arrayField,
              });
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Remarks updated successfully',
                position: 'bottom',
                visibilityTime: 3000,
              });
            } catch (error) {
              console.error('Error updating remarks:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to update remarks',
                position: 'bottom',
                visibilityTime: 3000,
              });
            }
          }
        }
      }
      setSavingRemarks(prev => ({ ...prev, [studentName]: false }));
    }
    // Clear editing state
    setIsEditingRemarks(prev => ({ ...prev, [studentName]: false }));
  };

  // Handle discarding remarks changes
  const discardRemarksChange = (studentName: string) => {
    setIsEditingRemarks(prev => ({ ...prev, [studentName]: false }));
    setEditingRemarks(prev => ({ ...prev, [studentName]: '' }));
  };

  // Updates student as present by teacher
  const handleCheckIn = async (childName: string, className: string) => {
    if (user) {
      const dateTaken = new Date().toDateString();
      const q = query(
        collection(db, "Attendances Held"),
        where("className", "==", className),
        where("dateTaken", "==", dateTaken)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const attendanceDoc = querySnapshot.docs[0].ref;
        const docSnap = await getDoc(attendanceDoc);
        const data = docSnap.data();
        const arrayField = data?.["students"];

        if (arrayField) {
          const indexToUpdate = arrayField.findIndex(
            (item: { name: string; status: string }) => item.name === childName
          );

          if (indexToUpdate !== -1) {
            arrayField[indexToUpdate].status = 'present';
            arrayField[indexToUpdate].checkin = new Date().toLocaleTimeString();
            arrayField[indexToUpdate].checkout = null;

            try {
              await updateDoc(attendanceDoc, {
                "students": arrayField,
              });
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Attendance checked in successfully!',
                position: 'bottom',
                visibilityTime: 3000,
              });
            } catch (error) {
              console.error('Error updating attendance:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to update attendance',
                position: 'bottom',
                visibilityTime: 3000,
              });
            }
          }
        }
      }
    }
  };

  // Updates student as absent by teacher
  const handleCheckOut = async (childName: string, className: string) => {
    if (user) {
      const dateTaken = new Date().toDateString();
      const q = query(
        collection(db, "Attendances Held"),
        where("className", "==", className),
        where("dateTaken", "==", dateTaken)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const attendanceDoc = querySnapshot.docs[0].ref;
        const docSnap = await getDoc(attendanceDoc);
        const data = docSnap.data();
        const arrayField = data?.["students"];

        if (arrayField) {
          const indexToUpdate = arrayField.findIndex(
            (item: { name: string; status: string }) => item.name === childName
          );

          if (indexToUpdate !== -1) {
            arrayField[indexToUpdate].status = 'absent';
            arrayField[indexToUpdate].checkout = new Date().toLocaleTimeString();

            try {
              await updateDoc(attendanceDoc, {
                "students": arrayField,
              });
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Attendance checked out successfully!',
                position: 'bottom',
                visibilityTime: 3000,
              });
            } catch (error) {
              console.error('Error updating attendance:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to update attendance',
                position: 'bottom',
                visibilityTime: 3000,
              });
            }
          }
        }
      }
    }
  };

  // Send attendance to Firestore
  const handleSaveAttendance = async () => {

    // check for existing document in Attendances Held collection 
    const dateTaken = new Date().toDateString();
    const q = query(
      collection(db, "Attendances"),
      where("className", "==", className),
      where("dateTaken", "==", dateTaken)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // if document does not exist, create new document in Attendances collection
      const currentDate = new Date().toDateString();
      const attendanceData: AttendanceData = {
        className: className,
        dateTaken: currentDate,
        students: students.map((student) => ({
          name: student.name,
          checkin: null,
          checkout: null,
          status: student.status || 'null', // Handle null status
          remarks: student.remarks,
        })),
      };

      try {
        await addDoc(collection(db, 'Attendances'), attendanceData);
        // Toast feedback for attendance saved
        Toast.show({
              type: 'success',
              text1: 'Success',
              text2: 'Attendance has been saved for ' + formattedDate,
              position: 'bottom',
              visibilityTime: 3000,
        });
      } catch (error) {
        console.error('Error saving attendance:', error);
        // Toast feedback for error
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to save attendance.',
          position: 'bottom',
          visibilityTime: 3000,
        });
      }
    }
    else {
      // // if document exists, update existing document in Attendances collection (delete and recreate)
      const heldRef = querySnapshot.docs[0].ref;
      await deleteDoc(heldRef);

      const currentDate = new Date().toDateString();
      const attendanceData: AttendanceData = {
        className: className,
        dateTaken: currentDate,
        students: students.map((student) => ({
          name: student.name,
          checkin: null,
          checkout: null,
          status: student.status || 'null', // Handle null status 
          remarks: student.remarks,
        })),
      };

      try {
        await addDoc(collection(db, 'Attendances'), attendanceData);
        // Toast feedback for attendance updated
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Attendance has been updated for ' + date.toDateString(),
          position: 'bottom',
          visibilityTime: 3000,
    });
      } catch (error) {
        console.error('Error updating attendance:', error);
        // Toast feedback for error
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to update attendance.',
          position: 'bottom',
          visibilityTime: 3000,
        });
      }
    }
  };

  const renderContent = () => {
    if (!fontsLoaded || isLoading) {
      return (
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#3B2C93" />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <Text style={styles.header}>{className} - Attendance</Text>
        <Text style={styles.date}>{formattedDate}</Text>
        
        {/* Status Filter Tabs */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              statusFilter === 'all' && styles.activeFilterTab
            ]}
            onPress={() => setStatusFilter('all')}
          >
            <Text style={[
              styles.filterText,
              statusFilter === 'all' && styles.activeFilterText
            ]}>All ({studentCounts.all})</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterTab,
              statusFilter === 'present' && styles.activeFilterTab,
              styles.presentTab
            ]}
            onPress={() => setStatusFilter('present')}
          >
            <Text style={[
              styles.filterText,
              statusFilter === 'present' && styles.activeFilterText
            ]}>Present ({studentCounts.present})</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterTab,
              statusFilter === 'absent' && styles.activeFilterTab,
              styles.absentTab
            ]}
            onPress={() => setStatusFilter('absent')}
          >
            <Text style={[
              styles.filterText,
              statusFilter === 'absent' && styles.activeFilterText
            ]}>Absent ({studentCounts.absent})</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.studentCard}>
              <View style={styles.studentInfo}>
                <Image 
                  source={item.profilePicture ? { uri: item.profilePicture } : defaultProfileImage}
                  style={styles.profilePicture}
                />
                <View style={styles.studentDetails}>
                  <Text style={styles.studentName}>{item.name}</Text>
                  <Text style={styles.timeInfo}>
                    Check-in: {item.checkin || 'Not checked in'}
                  </Text>
                  <Text style={styles.timeInfo}>
                    Check-out: {item.checkout || 'Not checked out'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.checkInButton,
                    item.status === 'present' && styles.activeCheckInButton,
                  ]}
                  onPress={() => handleCheckIn(item.name, className)}
                >
                  <View style={styles.buttonContent}>
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={20}
                      color={item.status === 'present' ? '#fff' : '#4CAF50'}
                    />
                    <Text style={[
                      styles.buttonText,
                      item.status !== 'present' && styles.checkInText
                    ]}>
                      {item.status === 'present' ? 'Checked In' : 'Check In'}
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.checkOutButton,
                    item.checkout && styles.activeCheckOutButton,
                  ]}
                  onPress={() => handleCheckOut(item.name, className)}
                >
                  <View style={styles.buttonContent}>
                    <MaterialCommunityIcons
                      name="close-circle"
                      size={20}
                      color={item.checkout ? '#fff' : '#FF5252'}
                    />
                    <Text style={[
                      styles.buttonText,
                      !item.checkout && styles.checkOutText
                    ]}>
                      {item.checkout ? 'Checked Out' : 'Check Out'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
              
              {/* Remarks section */}
              <View style={styles.remarksContainer}>
                {isEditingRemarks[item.name] ? (
                  <>
                    <TextInput
                      style={styles.remarksInput}
                      placeholder="Add remarks..."
                      value={editingRemarks[item.name]}
                      onChangeText={(text) => handleRemarksChange(item.name, text)}
                    />
                    <View style={styles.remarksButtonContainer}>
                      <TouchableOpacity
                        style={[styles.remarksButton, styles.confirmButton]}
                        onPress={() => confirmRemarksChange(item.name)}
                        disabled={savingRemarks[item.name]}
                      >
                        {savingRemarks[item.name] ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.remarksButtonText}>✓</Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.remarksButton, styles.discardButton]}
                        onPress={() => discardRemarksChange(item.name)}
                        disabled={savingRemarks[item.name]}
                      >
                        <Text style={styles.remarksButtonText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.remarksDisplay}
                    onPress={() => startEditingRemarks(item.name, item.remarks || '')}
                  >
                    <Text style={styles.remarksText}>
                      {item.remarks || 'Add remarks...'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                // fetchStudentsForClass();
              }}
            />
          }
        />
        <Toast />
      </View>
    );
  };

  return renderContent();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f8f8',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    fontFamily: 'OpenSans_400Regular',
    alignSelf: 'center'
  },
  date: {
    fontSize: 16,
    marginBottom: 16,
    color: '#666',
    fontFamily: 'OpenSans_400Regular',
    alignSelf: 'center'
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#3B2C93',
    ...Platform.select({
      web: {
        maxWidth: 800,
        alignSelf: 'center',
        width: '100%',
      },
    }),
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  activeFilterTab: {
    backgroundColor: '#27CCBC',
  },
  presentTab: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'OpenSans_400Regular',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  studentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    ...Platform.select({
      web: {
        width: '100%',
        maxWidth: 800,
        alignSelf: 'center',
      },
      default: {
        width: '100%',
      },
    }),
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  profilePicture: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
    fontFamily: 'OpenSans_400Regular',
  },
  timeInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
    fontFamily: 'OpenSans_400Regular',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    ...Platform.select({
      web: {
        gap: 16,
      },
      default: {
        gap: 8,
      },
    }),
  },
  button: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  checkInButton: {
    backgroundColor: 'transparent',
    borderColor: '#4CAF50',
  },
  activeCheckInButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkOutButton: {
    backgroundColor: 'transparent',
    borderColor: '#FF5252',
  },
  activeCheckOutButton: {
    backgroundColor: '#FF5252',
    borderColor: '#FF5252',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: 'OpenSans_400Regular',
  },
  checkInText: {
    color: '#4CAF50',
    fontFamily: 'OpenSans_400Regular',
  },
  checkOutText: {
    color: '#FF5252',
    fontFamily: 'OpenSans_400Regular',
  },
  remarksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 5,
  },
  remarksInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 8,
    marginRight: 10,
    backgroundColor: '#fff',
  },
  remarksDisplay: {
    flex: 1,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    minHeight: 40,
    justifyContent: 'center',
  },
  remarksText: {
    color: '#666',
  },
  remarksButtonContainer: {
    flexDirection: 'row',
    gap: 5,
  },
  remarksButton: {
    padding: 8,
    borderRadius: 5,
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#27CCBC',
  },
  discardButton: {
    backgroundColor: '#ff4444',
  },
  remarksButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default Attendance;