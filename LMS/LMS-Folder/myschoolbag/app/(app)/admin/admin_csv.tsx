import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { db } from '@/firebaseConfig';
import { collection, getDocs } from "firebase/firestore";
import { Parser } from '@json2csv/plainjs';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useFonts, OpenSans_400Regular } from '@expo-google-fonts/open-sans';

export default function Admin_csv() {
  const [fontsLoaded] = useFonts({ OpenSans_400Regular });
  const [drives, setDrives] = useState<{ id: string }[]>([]);
  const [selectedDrive, setSelectedDrive] = useState('');

  useEffect(() => {
    const fetchDrives = async () => {
      try {
        console.log("Attempting to fetch drives...");
        const drivesCollection = await getDocs(collection(db, 'enrollmentDrives'));

        if (drivesCollection.empty) {
          console.log("No drives found in Firestore.");
          Alert.alert("No recruitment drives found.");
        } else {
          const drivesList = drivesCollection.docs.map((doc) => ({
            id: doc.id,
          }));
          console.log("Fetched drives:", drivesList);
          setDrives(drivesList);
        }
      } catch (error) {
        console.error("Error fetching drives:", error);
        Alert.alert("Error", "Could not fetch recruitment drives.");
      }
    };

    fetchDrives();
  }, []);

  const generateCSV = async () => {
    if (!selectedDrive) {
      Alert.alert("Please select a recruitment drive.");
      return;
    }

    try {
      console.log(`Generating CSV for drive: ${selectedDrive}`);
      const registrationsCollection = await getDocs(
        collection(db, 'enrollmentDrives', selectedDrive, 'registrations')
      );
      const registrations = registrationsCollection.docs.map((doc) => doc.data());

      if (registrations.length === 0) {
        Alert.alert("No registrations found for the selected drive.");
        return;
      }

      // Convert registrations data to CSV
      const parser = new Parser();
      const csv = parser.parse(registrations);

      if (Platform.OS === 'web') {
        // Web: Create a Blob and trigger a download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `recruitment_drive_${selectedDrive}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // Mobile: Use expo-file-system and expo-sharing
        const fileUri = FileSystem.documentDirectory + `recruitment_drive_${selectedDrive}.csv`;
        await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
        await Sharing.shareAsync(fileUri);
      }
    } catch (error) {
      console.error("Error generating CSV:", error);
      Alert.alert("Error", "Could not generate CSV.");
    }
  };

  // Show a loading screen until fonts are loaded
  if (!fontsLoaded) {
    return <Text style={{ textAlign: 'center', marginTop: 20 }}>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Download Recruitment Drive CSV</Text>
      
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedDrive}
          style={styles.picker}
          onValueChange={(itemValue) => setSelectedDrive(itemValue)}
        >
          <Picker.Item label="Select Recruitment Drive" value="" />
          {drives.map((drive) => (
            <Picker.Item key={drive.id} label={drive.id} value={drive.id} />
          ))}
        </Picker>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={generateCSV}
      >
        <Text style={styles.buttonText}>Generate CSV</Text>
      </TouchableOpacity>
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
  pickerContainer: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCC',
    marginBottom: 20,
  },
  picker: {
    height: 50,
    width: '100%',
    fontSize: 16,
    fontFamily: 'OpenSans_400Regular',
    color: '#000',
  },
  button: {
    backgroundColor: '#4B0082',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'OpenSans_400Regular',
  },
});
