import { Slot } from "expo-router";
import { StyleSheet, View, Text } from 'react-native';
import { AuthProvider } from "@/context/AuthContext";
import { UserProvider,  } from '@/context/UserContext';
import { ThemeProvider } from "@/context/ThemeContext";
import Toast from 'react-native-toast-message';
import { useFonts, OpenSans_400Regular } from "@expo-google-fonts/open-sans";
import React from "react";



export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    OpenSans_400Regular,
  });

  if (!fontsLoaded) {
    return <View style={styles.loadingText}>
      <Text>loading...</Text>
    </View>;
  }
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserProvider>
          <Slot/>
          <Toast />
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    fontFamily: "OpenSans_400Regular", // Apply globally here if needed
  },
  loadingText: {
    fontFamily: "OpenSans_400Regular",
    fontSize: 16,
    textAlign: "center",
    marginTop: "50%", // Center the loading text
  },
});