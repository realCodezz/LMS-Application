import React, { useState } from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import DatePicker from 'react-datepicker'; // For web
import 'react-datepicker/dist/react-datepicker.css';
import { db } from '@/firebaseConfig'; // Import your Firebase configuration
import { collection, addDoc, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useFonts, OpenSans_400Regular } from '@expo-google-fonts/open-sans';

export default function EnrolPage() {
  const driveName = 'drive_2024'; // Admin-defined drive name
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [childName, setChildName] = useState('');
  const [childDOB, setChildDOB] = useState(new Date());
  const [showDOBPicker, setShowDOBPicker] = useState(false);
  const [fontsLoaded] = useFonts({ OpenSans_400Regular });

  const handleSubmit = async () => {
    try {
      const driveDocRef = doc(db, 'enrollmentDrives', driveName);
      const driveDocSnapshot = await getDoc(driveDocRef);

      if (!driveDocSnapshot.exists()) {
        await setDoc(driveDocRef, {
          dateCreated: serverTimestamp(),
        });
      }

      await addDoc(collection(db, 'enrollmentDrives', driveName, 'registrations'), {
        fullName,
        email,
        phoneNumber,
        childName,
        childDOB: childDOB.toISOString().split('T')[0],
      });

      Alert.alert('Success', 'Registration submitted successfully!');
    } catch (error) {
      console.error('Error adding registration: ', error);
      Alert.alert('Error', 'There was an error submitting the registration.');
    }
  };

  if (!fontsLoaded) {
    return <Text style={{ textAlign: 'center', marginTop: 20 }}>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Enrollment Form</Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={fullName}
          onChangeText={setFullName}
          placeholderTextColor="#808080"
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholderTextColor="#808080"
        />
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          placeholderTextColor="#808080"
        />
        <TextInput
          style={styles.input}
          placeholder="Child's Name"
          value={childName}
          onChangeText={setChildName}
          placeholderTextColor="#808080"
        />

        <View style={styles.dobContainer}>
          <Text style={styles.label}>Child's Date of Birth</Text>
          {Platform.OS === 'web' ? (
            <DatePicker
              selected={childDOB}
              onChange={(date: Date | null) => {
                if (date) setChildDOB(date);
              }}
              dateFormat="yyyy-MM-dd"
              className="react-datepicker-wrapper"
            />
          ) : (
            <>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDOBPicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {childDOB.toISOString().split('T')[0]}
                </Text>
              </TouchableOpacity>
              {showDOBPicker && (
                <DateTimePicker
                  value={childDOB}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) setChildDOB(selectedDate);
                    setShowDOBPicker(false);
                  }}
                />
              )}
            </>
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  form: {
    flex: 1,
    padding: 20,
    marginTop: 150
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4B0082',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'OpenSans_400Regular',
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#CCC',
    color: '#000',
    padding: 10,
    fontSize: 16,
    fontFamily: 'OpenSans_400Regular',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4B0082',
    marginBottom: 5,
    fontFamily: 'OpenSans_400Regular',
  },
  dobContainer: {
    marginBottom: 20,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F9F9F9',
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#4B0082',
    fontFamily: 'OpenSans_400Regular',
  },
  submitButton: {
    backgroundColor: '#4B0082',
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 20,
    alignSelf: 'stretch',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'OpenSans_400Regular',
  },
});
