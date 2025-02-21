import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types/RootStackParamList";
import { MaterialCommunityIcons } from '@expo/vector-icons';
// database imports
import 'firebase/auth'; 
import { db } from "../../../firebaseConfig"; // Import db from firebaseConfig
import { collection, getDocs, query, where } from "firebase/firestore"; // Import Firestore functions
import { useUser } from '@/context/UserContext';

interface Child {
  id: string; // Document ID
  name: string; // Child's full name
  class: string; // Child's class
}

const ChildSelect: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user } = useUser(); // Retrieve the logged-in user's data
  const [children, setChildren] = useState<Child[]>([]);

  const handleChildSelect = (childName: string, className: string) => {
    navigation.navigate('pages/CheckIn', { childName, className });  // passes childName as param over to CheckIn page
  };

   // fetch data from firestore
   useEffect(() => {
    const fetchChildren = async () => {
        if (user) {
            try {
                const studentsQuery = query(
                    collection(db, 'Students'),
                    where('parentUIDs', 'array-contains', user.id)
                );

                const querySnapshot = await getDocs(studentsQuery);

                const childrenData: Child[] = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().childFullName,
                    class: doc.data().className,
                }));

                setChildren(childrenData);
            } catch (error) {
                console.error('Error fetching children from Firestore:', error);
            }
        }
    };

    fetchChildren();
}, [user]);
  return (
    <View style={styles.container}>

      {/* Header */}
      <Text style={styles.headerText}>Please confirm child to check-in</Text>

      {/* Child List */}
      <View>
          {children.length > 0 ? (
            <View>
              {children.map(child => (
                <TouchableOpacity style={styles.childButton} key={child.id} onPress={() => handleChildSelect(child.name, child.class)}>
                  <Text style={styles.childText}>{child.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.headerText}>Loading...</Text>
          )}
      </View>

      {/* Back Navigation Button (commented out due to mobile complications) */}
      {/* <TouchableOpacity onPress = {() => navigation.navigate("(app)/homepage/homepage_parent")}>
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

  childButton: {
    width: '100%',
    paddingHorizontal: 100,
    paddingVertical: 16,
    backgroundColor: '#3B2C93', // Box color
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center',
  },

  childText: {
    color: '#fff',              // Text color inside the box
    fontSize: 18,               // Font size for readability
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'OpenSans_400Regular',
  },

  backBox: {
    paddingVertical: 5,  // Add padding if needed
    backgroundColor: '#3B2C93', // Box color
    borderRadius: 8,
    paddingHorizontal: 50,
    marginVertical: 10,
  },
  headerText: {
    fontSize: 20,               // Big enough to be readable
    fontWeight: 'bold',         // Bolded text
    textAlign: 'center',
    marginBottom: 24,           // Space below the header
    fontFamily: 'OpenSans_400Regular',
  },
});

export default ChildSelect