import React, { useState } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import Papa from 'papaparse';
import { auth, db } from '@/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, updateDoc, doc, arrayUnion, setDoc, getDocs, query, where } from 'firebase/firestore';
import CryptoJS from 'crypto-js';
import { MailSlurp } from 'mailslurp-client'; // Import MailSlurp
import { useFonts, OpenSans_400Regular } from '@expo-google-fonts/open-sans';

const mailslurp = new MailSlurp({ apiKey: "3a45c548f7da2fe3c93015948a736624102b4793339705a70a3a8524a9c3113d" }); // Replace with your API Key

interface EnrollmentEntry {
  childName: string;
  email: string;
  phoneNumber: string;
  childDOB: string;
  fullName: string;
}

export default function GenerateAccounts() {
  const [fontsLoaded] = useFonts({ OpenSans_400Regular });
  const [isProcessing, setIsProcessing] = useState(false);

  const generatePassword = () => {
    return CryptoJS.lib.WordArray.random(8).toString();
  };

  const sendEmail = async (email: string, password: string, fullName: string) => {
    try {
      const emailResponse = await mailslurp.sendEmail('7d29321c-2efd-49b6-99ad-3e4078b54ee6', {
        to: [email],
        subject: 'Your Account Credentials',
        body: `
          <h1>Welcome, ${fullName}</h1>
          <p>Your account has been created successfully. Here are your credentials:</p>
          <ul>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Password:</strong> ${password}</li>
          </ul>
          <p>Please change your password after logging in for the first time.</p>
          <p>Best regards,<br>Your Team</p>
        `,
        isHTML: true,
      });
      console.log(`Email sent to ${email}:`, emailResponse);
    } catch (error) {
      console.error(`Error sending email to ${email}:`, error);
      Alert.alert("Error", `Failed to send email to ${email}.`);
    }
  };

  const handleCSVUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        console.log("File selection was cancelled.");
        return;
      }

      const fileUri = result.assets[0].uri;
      const response = await fetch(fileUri);
      const fileContent = await response.text();

      Papa.parse(fileContent, {
        header: true,
        complete: async (results) => {
          const data: EnrollmentEntry[] = results.data as EnrollmentEntry[];
          await processEntries(data);
        },
        error: (error: any) => {
          console.error("Error parsing CSV:", error);
          Alert.alert("Error", "Failed to parse CSV.");
        },
      });
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert("Error", "Failed to pick CSV file.");
    }
  };

  const processEntries = async (entries: EnrollmentEntry[]) => {
    setIsProcessing(true);

    for (const entry of entries) {
      const { childName, email, phoneNumber, childDOB, fullName } = entry;

      if (!childName || !email || !phoneNumber || !childDOB || !fullName) {
        console.warn(`Skipping entry due to missing data: ${JSON.stringify(entry)}`);
        continue;
      }

      try {
        let parentDocId = null;
        const password = generatePassword();

        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          parentDocId = userCredential.user.uid;

          await setDoc(doc(db, 'Users', parentDocId), {
            fullName,
            email,
            phoneNumber,
            role: 'Parent',
            parentOf: [],
          });

          console.log(`Credentials for ${email}: Password: ${password}`);
        } catch (error) {
          console.error(`Error creating account for ${email}:`, error);
          Alert.alert("Error", `Failed to create account for ${email}`);
          continue;
        }

        await sendEmail(email, password, fullName);

        const studentsQuery = query(
          collection(db, 'Students'),
          where('childFullName', '==', childName),
          where('childDOB', '==', childDOB)
        );
        const querySnapshot = await getDocs(studentsQuery);

        let childRef = null;
        if (!querySnapshot.empty) {
          childRef = querySnapshot.docs[0].ref;

          await updateDoc(childRef, {
            parentUIDs: arrayUnion(parentDocId),
          });

          console.log(`Child ${childName} already exists. Linked parent ${email}.`);
        } else {
          childRef = await addDoc(collection(db, 'Students'), {
            childFullName: childName,
            childDOB,
            parentUIDs: [parentDocId],
          });

          console.log(`Child ${childName} created and linked to parent ${email}.`);
        }

        const parentDocRef = doc(db, 'Users', parentDocId);
        await updateDoc(parentDocRef, {
          parentOf: arrayUnion(childRef.id),
        });

      } catch (error) {
        console.error(`Error adding child ${childName} for parent ${email}:`, error);
      }
    }

    setIsProcessing(false);
    Alert.alert("Success", "Accounts and students created successfully.");
  };

  if (!fontsLoaded) {
    return <Text style={{ textAlign: 'center', marginTop: 20 }}>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Generate Accounts from CSV</Text>
      
      <TouchableOpacity
        style={styles.button}
        onPress={handleCSVUpload}
        disabled={isProcessing}
      >
        <Text style={styles.buttonText}>Upload CSV File</Text>
      </TouchableOpacity>
      
      {isProcessing && (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#4B0082" />
          <Text style={styles.processingText}>Processing...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4B0082',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'OpenSans_400Regular',
  },
  button: {
    backgroundColor: '#4B0082',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'OpenSans_400Regular',
  },
  processingContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  processingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'OpenSans_400Regular',
    color: '#4B0082',
  },
});
