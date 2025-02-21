import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert, TextInput, ActivityIndicator } from 'react-native';
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types/RootStackParamList";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
// database imports
import 'firebase/auth'; 
import { db } from "../../../firebaseConfig"; // Import db from firebaseConfig
import { collection, getDoc, getDocs, query, where, updateDoc } from "firebase/firestore"; // Import Firestore functions
import { useUser } from '@/context/UserContext';

// defines params passed into here
type CheckInRouteProp = RouteProp<RootStackParamList, 'pages/CheckIn'>;

const CheckIn: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user } = useUser(); // Retrieve the logged-in user's data
  const route = useRoute<CheckInRouteProp>();
  const { childName, className } = route.params; // Access 'childName' parameter
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [remarksText, setRemarksText] = useState('');
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [studentStatus, setStudentStatus] = useState<'present' | 'absent'>('absent');
  const [checkinTime, setCheckinTime] = useState<string | null>(null);
  const [checkoutTime, setCheckoutTime] = useState<string | null>(null);

  // Fetch initial status
  useEffect(() => {
    const fetchStatus = async () => {
      if (user) {
        const dateTaken = new Date().toDateString();
        const q = query(
          collection(db, "Attendances Held"),
          where("className", "==", className),
          where("dateTaken", "==", dateTaken)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docSnap = await getDoc(querySnapshot.docs[0].ref);
          const data = docSnap.data();
          const arrayField = data?.["students"];

          if (arrayField) {
            const student = arrayField.find(
              (item: { name: string; status: string }) => item.name === childName
            );
            if (student) {
              setStudentStatus(student.status as 'present' | 'absent');
              setCheckinTime(student.checkin);
              setCheckoutTime(student.checkout);
            }
          }
        }
      }
    };

    fetchStatus();
  }, [user, className, childName]);

  const handleCheckIn = async (className: string) => {
    if (user) {
      setIsCheckingIn(true);
      try {
        const dateTaken = new Date().toDateString();
        const q = query(
          collection(db, "Attendances Held"),
          where("className", "==", className),
          where("dateTaken", "==", dateTaken)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Attendance is not available yet.',
            position: 'bottom',
            visibilityTime: 3000,
          });
        } else {
          const attendanceDoc = querySnapshot.docs[0].ref;
          const docSnap = await getDoc(attendanceDoc);
          const data = docSnap.data();
          const arrayField = data?.["students"];

          if (arrayField) {
            const indexToUpdate = arrayField.findIndex(
              (item: { name: string; status: string }) => item.name === childName
            );

            if (indexToUpdate !== -1) {
              const currentTime = new Date().toLocaleTimeString();
              arrayField[indexToUpdate].status = 'present';
              arrayField[indexToUpdate].checkin = currentTime;
              arrayField[indexToUpdate].checkout = null;

              await updateDoc(attendanceDoc, {
                "students": arrayField,
              });
              
              setStudentStatus('present');
              setCheckinTime(currentTime);
              setCheckoutTime(null);
              
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Attendance checked in successfully!',
                position: 'bottom',
                visibilityTime: 3000,
              });
            }
          }
        }
      } catch (error) {
        console.error('Error checking in:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to check in',
          position: 'bottom',
          visibilityTime: 3000,
        });
      } finally {
        setIsCheckingIn(false);
      }
    }
  };

  const handleCheckOut = async (className: string) => {
    if (user) {
      setIsCheckingOut(true);
      try {
        const dateTaken = new Date().toDateString();
        const q = query(
          collection(db, "Attendances Held"),
          where("className", "==", className),
          where("dateTaken", "==", dateTaken)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Attendance is not available yet.',
            position: 'bottom',
            visibilityTime: 3000,
          });
        } else {
          const attendanceDoc = querySnapshot.docs[0].ref;
          const docSnap = await getDoc(attendanceDoc);
          const data = docSnap.data();
          const arrayField = data?.["students"];

          if (arrayField) {
            const indexToUpdate = arrayField.findIndex(
              (item: { name: string; status: string }) => item.name === childName
            );

            if (indexToUpdate !== -1) {
              const currentTime = new Date().toLocaleTimeString();
              arrayField[indexToUpdate].status = 'absent';
              arrayField[indexToUpdate].checkout = currentTime;
              arrayField[indexToUpdate].checkin = null;

              await updateDoc(attendanceDoc, {
                "students": arrayField,
              });
              
              setStudentStatus('absent');
              setCheckinTime(null);
              setCheckoutTime(currentTime);
              
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Attendance checked out successfully!',
                position: 'bottom',
                visibilityTime: 3000,
              });
            }
          }
        }
      } catch (error) {
        console.error('Error checking out:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to check out',
          position: 'bottom',
          visibilityTime: 3000,
        });
      } finally {
        setIsCheckingOut(false);
      }
    }
  };

  const handleSendRemarks = async (className: string) => {
    if (user) {
      // check for existing document in Attendances Held collection
      const dateTaken = new Date().toDateString();
      const q = query(
        collection(db, "Attendances Held"),
        where("className", "==", className),
        where("dateTaken", "==", dateTaken)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // if no document exists, tell parent that attendance does not exist yet
        try {
          // if no document exists, tell parent that attendance does not exist yet
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Attendance is not available yet.',
            position: 'bottom',
            visibilityTime: 3000,
          });
        } catch (error) {
          console.error('Error sending remarks.', error);
          // Toast feedback for error
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Error sending remarks.',
            position: 'bottom',
            visibilityTime: 3000,
          });
        }
      }
      else {
        // if document exists, update attendance document with child's name
        const attendanceDoc = querySnapshot.docs[0].ref;
        const docSnap = await getDoc(attendanceDoc);
        const data = docSnap.data();
        const arrayField = data?.["students"];

        if (arrayField) {
          // Find the index of the map to update
          const indexToUpdate = arrayField.findIndex(
          (item: { name: string; remarks: string }) => item.name === childName
          );

          if (indexToUpdate !== -1) {
            // Update the remarks in the array
            arrayField[indexToUpdate].remarks = remarksText;
          }
        }
        try {
          // Update the document with the modified array
          await updateDoc(attendanceDoc, {
            "students": arrayField,
          });
          // Toast feedback for successful remarks send
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Remarks sent successfully!',
            position: 'bottom',
            visibilityTime: 3000,
          });
          setRemarksText(''); // Clear the input field
        } catch (error) {
          console.error('Error sending remarks.', error);
          // Toast feedback for error
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Error sending remarks.',
            position: 'bottom',
            visibilityTime: 3000,
          });
        }
      }
    }
  }

  return (
    <View style={Platform.OS === 'web' ? styles.webContainer : styles.mobileContainer}>
      <Text style={styles.headerText}>{childName}'s Attendance</Text>

      {Platform.OS === 'web' && feedbackMessage && (
        <Text style={styles.feedbackText}>{feedbackMessage}</Text>
      )}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[
            styles.button,
            styles.checkinButton,
            studentStatus === 'present' && styles.activeCheckinButton,
            isCheckingIn && styles.buttonLoading,
            Platform.OS === 'web' ? styles.webButton : styles.mobileButton
          ]} 
          onPress={() => handleCheckIn(className)}
          disabled={isCheckingIn || isCheckingOut || studentStatus === 'present'}
        >
          <View style={styles.buttonContent}>
            {isCheckingIn ? (
              <ActivityIndicator color="#3B2C93" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons
                  name={studentStatus === 'present' ? 'check-circle' : 'login'}
                  size={24}
                  color={studentStatus === 'present' ? '#fff' : '#4CAF50'}
                />
                <Text style={[
                  styles.buttonText,
                  studentStatus !== 'present' && styles.checkInText
                ]}>
                  {studentStatus === 'present' ? 'CHECKED IN' : 'CHECK IN'}
                </Text>
              </>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.button,
            styles.checkoutButton,
            (studentStatus === 'absent' && checkoutTime) && styles.activeCheckoutButton,
            isCheckingOut && styles.buttonLoading,
            Platform.OS === 'web' ? styles.webButton : styles.mobileButton
          ]} 
          onPress={() => handleCheckOut(className)}
          disabled={isCheckingIn || isCheckingOut || (studentStatus === 'absent' && checkoutTime !== null)}
        >
          <View style={styles.buttonContent}>
            {isCheckingOut ? (
              <ActivityIndicator color="#3B2C93" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons
                  name={(studentStatus === 'absent' && checkoutTime) ? 'check-circle' : 'logout'}
                  size={24}
                  color={(studentStatus === 'absent' && checkoutTime) ? '#fff' : '#FF5252'}
                />
                <Text style={[
                  styles.buttonText,
                  !(studentStatus === 'absent' && checkoutTime) && styles.checkOutText
                ]}>
                  {(studentStatus === 'absent' && checkoutTime) ? 'CHECKED OUT' : 'CHECK OUT'}
                </Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate("pages/ChildSelect")}>
        <View style={styles.backBox}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={36}
            color={'white'}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  mobileContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: Platform.OS === 'web' ? '70%' : '100%',
    marginVertical: 10,
    gap: Platform.OS === 'web' ? 20 : 10,
  },

  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1,
    borderWidth: 1,
  },

  webButton: {
    width: 140,
    height: 140,
  },

  mobileButton: {
    width: 100,
    height: 100,
  },

  checkinButton: {
    backgroundColor: 'transparent',
    borderColor: '#4CAF50',
  },

  activeCheckinButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },

  checkoutButton: {
    backgroundColor: 'transparent',
    borderColor: '#FF5252',
  },

  activeCheckoutButton: {
    backgroundColor: '#FF5252',
    borderColor: '#FF5252',
  },

  buttonContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  buttonText: {
    color: '#fff',
    fontSize: Platform.OS === 'web' ? 16 : 14,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'OpenSans_400Regular',
  },

  checkInText: {
    color: '#4CAF50',
  },

  checkOutText: {
    color: '#FF5252',
  },

  buttonLoading: {
    opacity: 0.8,
  },

  backBox: {
    paddingVertical: 5,
    backgroundColor: '#3B2C93',
    borderRadius: 8,
    paddingHorizontal: 50,
    marginVertical: 10,
  },

  headerText: {
    fontSize: Platform.OS === 'web' ? 20 : 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'OpenSans_400Regular',
  },

  feedbackText: {
    marginTop: 16,
    fontSize: 16,
    color: 'green',
    textAlign: 'center',
    fontFamily: 'OpenSans_400Regular',
  },
});

export default CheckIn;