import React from "react";
import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { useAuth } from "@/context/AuthContext"; // Adjust the path if needed
import { useUser } from "@/context/UserContext";
import { Link } from "expo-router";
import Icon from "react-native-vector-icons/Ionicons"; // Adjust for your preferred icon library

export default function HomepageAdmin() {
  const { loading } = useAuth();
  const { user } = useUser();

  if (loading) {
    return <Text>Loading...</Text>; // Show loading indicator while checking auth state
  }

  return (
    <View style={styles.container}>
      {user ? (
        <View style={styles.innerContainer}>
          <Text style={styles.welcomeText}>Welcome, {user.email}!</Text>
          <Text style={styles.subText}>Role: {user.type}</Text>

          {/* Buttons */}
          <TouchableOpacity>
            <Link style={styles.button} href={"/(app)/admin/admin_create_teacher"}>
              <Icon name="people" size={24} color="#fff" />
              <Text style={styles.buttonText}>Create Teacher</Text>
            </Link>
          </TouchableOpacity>

          <TouchableOpacity>
            <Link style={styles.button} href={"/(app)/admin/admin_csv"}>
              <Icon name="document" size={24} color="#fff" />
              <Text style={styles.buttonText}>Download Enrollment CSVs</Text>
            </Link>
          </TouchableOpacity>

          <TouchableOpacity>
            <Link style={styles.button} href={"/(app)/admin/admin_generate"}>
              <Icon name="settings" size={24} color="#fff" />
              <Text style={styles.buttonText}>Generate Accounts from CSV</Text>
            </Link>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.noUserText}>No user is logged in.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  innerContainer: {
    alignItems: "center",
    width: "90%",
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subText: {
    fontSize: 16,
    color: "#555",
    marginBottom: 20,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    width: "100%",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 10,
  },
  noUserText: {
    fontSize: 18,
    color: "#ff0000",
  },
});
