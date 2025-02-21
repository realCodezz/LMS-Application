import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types/RootStackParamList";
import { MaterialCommunityIcons } from '@expo/vector-icons';
// database imports
import 'firebase/auth'; 
import { db } from "@/firebaseConfig"; // Import db from firebaseConfig
import { doc, getDoc } from "firebase/firestore"; // Import Firestore functions
import { useUser } from '@/context/UserContext';

const ClassSelect: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user } = useUser(); // Retrieve the logged-in user's data
  const [classesInCharge, setClassesInCharge] = useState<string[]>([]);

  const handleClassSelect = (className: string) => {
    navigation.navigate('pages/Attendance', { className }); // passes className param over to Attendance page
  };

  // fetch data from firestore
  useEffect(() => {
    const fetchClasses  = async () => {
      try {
        if (user) {
          const classesDoc = doc(db, 'Users', user.id);
          const classesDocSnap = await getDoc(classesDoc);

          if (classesDocSnap.exists()) {
            const data = classesDocSnap.data();
            setClassesInCharge(data.classesInCharge as string[]);
          } else {
            console.log('No such document!');
          }
        }
      } catch (error) {
        console.error('Error fetching data', error);
      }
    };
    fetchClasses();
  }, []);

  return (
    <View style={styles.container}>

      {/* Header */}
      <Text style={styles.headerText}>Please choose a class to check attendance for</Text>

      {/* Class List */}
      <View>
          {classesInCharge.length > 0 ? (
            <View>
              {classesInCharge.map((className, index) => (
                <TouchableOpacity style={styles.classButton} key={index} onPress={() => handleClassSelect(className)}>
                  <Text style={styles.classButtonText}>{className}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            // loading indicator
            <Text style={styles.headerText}>Loading...</Text>
          )}
      </View>

      {/* Back Navigation Button (commented out due to mobile complications)*/}
      {/* <TouchableOpacity onPress = {() => navigation.navigate("(app)/homepage/homepage_teacher")}>
          <View style={styles.backBox}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={36}
              color={'white'}
            />
          </View>
      </TouchableOpacity> */}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerText: {
    fontSize: 20,               // Big enough to be readable
    fontWeight: 'bold',         // Bolded text
    textAlign: 'center',
    marginBottom: 24,           // Space below the header
    fontFamily: 'OpenSans_400Regular',
  },

  classButton: {
    width: '100%',
    paddingHorizontal: 100,
    paddingVertical: 16,
    backgroundColor: '#3B2C93', // Box color
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center',
  },
  
  classButtonText: {
    color: '#fff',              // Text color inside the box
    fontSize: 18,               // Font size for readability
    fontWeight: 'bold',
    fontFamily: 'OpenSans_400Regular',
  },

  backBox: {
    paddingVertical: 5,  // Add padding if needed
    backgroundColor: '#3B2C93', // Box color
    borderRadius: 8,
    paddingHorizontal: 50,
    marginVertical: 10,
  },

});

export default ClassSelect;