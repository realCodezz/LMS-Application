import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types/RootStackParamList";
import { MaterialCommunityIcons } from '@expo/vector-icons';

const DummyTemplate: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>

      {/* Header */}
      <Text style={styles.headerText}>Dummy UwU</Text>

      {/* whatever stuff to put in between */}
      <View style={styles.placeholderBox}>
        <Text style={styles.placeholderText}>PLACEHOLDER</Text>
      </View>

      {/* Back Navigation Button */}
      <TouchableOpacity onPress = {() => navigation.goBack()}>
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
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  placeholderBox: {
    padding: 50,
    backgroundColor: 'grey',
    marginVertical: 30,
  },

  placeholderText: {
    color: '#fff',              // Text color inside the box
    fontSize: 18,               // Font size for readability
    fontWeight: 'bold',
    justifyContent: 'center',
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
  },
});

export default DummyTemplate;