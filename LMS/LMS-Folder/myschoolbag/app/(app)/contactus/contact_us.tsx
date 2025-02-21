import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";

export default function ContactUs() {
  const router = useRouter(); // Hook to navigate between pages

  const options = [
    {
      title: "Upload Medical Certificate/Leave of Absence",
      route: "contactus/medical_certificates",
    },
    { title: "Feedback or Suggestions", route: "contactus/feedback" },
    { title: "Technical Help", route: "contactus/technical_help" },
  ];

  const handleOptionPress = (route) => {
    router.push(route); // Navigate to the corresponding feature
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {options.map((item) => (
        <TouchableOpacity
          key={item.title}
          style={styles.optionBox}
          onPress={() => handleOptionPress(item.route)}
        >
          <Text style={styles.optionText}>{item.title}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#4B0082", // Indigo
    textAlign: "center",
  },
  optionBox: {
    width: "100%",
    paddingVertical: 20,
    marginVertical: 10,
    backgroundColor: "#28ccbc", // Teal
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});

