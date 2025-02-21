import React from "react";
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import { auth } from "../../firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter, Link } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useFonts, OpenSans_400Regular } from "@expo-google-fonts/open-sans";
import { useUser } from "@/context/UserContext";
import { useEffect } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig"; // Ensure this is correctly imported
import * as Notifications from 'expo-notifications';
import Toast from 'react-native-toast-message';

// const requestNotificationPermissions = async (userId: string) => {
  // try {
   //// Check if the token already exists in Firestore
    // const userDocRef = doc(db, 'Users', userId);
    // const userDoc = await getDoc(userDocRef);
    // if (userDoc.exists() && userDoc.data().deviceToken) {
      // console.log('Token already exists:', userDoc.data().deviceToken);
    ////  Removed the 'return' here to allow updating the deviceToken
    // }
// 
    // const { status } = await Notifications.getPermissionsAsync();
    // console.log('Current notification permission status:', status);
    // 
    // if (status !== 'granted') {
      // const { status: newStatus } = await Notifications.requestPermissionsAsync();
      // console.log('New notification permission status:', newStatus);
      // if (newStatus !== 'granted') {
        // Toast.show({
          // type: 'error',
          // text1: 'Permission Denied',
          // text2: 'Please enable notifications to receive updates.',
          // position: 'top',
          // visibilityTime: 4000,
        // });
        // return;
      // }
    // }
// 
   //// Get the Expo push notification token
    // const token = (await Notifications.getExpoPushTokenAsync()).data;
    // console.log('Expo push notification token:', token);
    // 
    // if (token) {
    //  Store the token in Firestore (or your DB of choice)
      // await setDoc(userDocRef, { deviceToken: token }, { merge: true });
      // console.log('Token stored successfully in Firestore:', token);
    // } else {
      // console.error('Failed to get the token');
    // }
  // } catch (error) {
    // console.error('Error storing token:', error);
  // }
// };


export default function Login() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const { userAuth } = useAuth(); // Retrieve userAuth from context
  const { user } = useUser(); // Retrieve user from context
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    OpenSans_400Regular,
  });
  useEffect(() => {
    if (userAuth) {
      //requestNotificationPermissions(userAuth.uid);
    }
  }, [userAuth]);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Toast.show({
        type: 'success',
        text1: 'Welcome back!',
        text2: 'Successfully logged in',
        position: 'top',
        visibilityTime: 3000,
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: error.message,
        position: 'top',
        visibilityTime: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle navigation as a side effect when userAuth and user change
  React.useEffect(() => {
    if (userAuth) {
      switch (user?.type) {
        case "Admin":
          router.replace("/homepage/homepage_admin");
          break;
        case "Teacher":
          router.replace("/homepage/homepage_teacher");
          break;
        case "Parent":
          router.replace("/homepage/child_selection");
          break;
      }
    }
  }, [userAuth, user, router]);

  if (!fontsLoaded) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <View style={styles.circle} />
      <View style={styles.circle_logo_container}>
        <Image
          style={styles.circle_logo}
          source={require("../../assets/images/myschoolbag_logo.jpg")}
        />
      </View>

      <View style={styles.input_container}>
        <TextInput
          style={styles.input}
          onChangeText={setEmail}
          value={email}
          placeholder="Username"
          placeholderTextColor="#808080"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          onChangeText={setPassword}
          value={password}
          placeholder="Password"
          placeholderTextColor="#808080"
          secureTextEntry
        />
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>
        <Link href="/authentication/reset_password" style={styles.forgotPassword}>
          <Text style={styles.forgotPassword}>Reset Password?</Text>
        </Link>
        <Link href="/enrollment/enrollment" style={styles.enrollmentLink}>
          <Text style={styles.enrollmentText}>Go to Enrollment</Text>
        </Link>
      </View>
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  input_container: {
    paddingTop: Platform.OS === "web" ? "10%" : 200,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: "#808080",
    color: "#000",
    padding: 10,
    width: Platform.OS === "web" ? "50%" : "75%",
    fontSize: 16,
    textAlign: "left",
    fontFamily: "OpenSans_400Regular",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#4B0082",
    paddingVertical: 15,
    width: "20%",
    minWidth: 150,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "OpenSans_400Regular",
  },
  circle: {
    width: 500,
    height: 500,
    borderRadius: 1000,
    backgroundColor: "#28ccbc",
    position: "absolute",
    bottom: "70%",
  },
  circle_logo_container: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 1000,
    backgroundColor: "#28ccbc",
    justifyContent: "center",
    alignItems: "center",
    bottom: "62%",
  },
  circle_logo: {
    width: 240,
    height: 240,
    borderRadius: 1000,
    backgroundColor: "#28ccbc",
  },
  forgotPassword: {
    color: "#808080",
    fontSize: 14,
    marginTop: 10,
    fontFamily: "OpenSans_400Regular",
  },
  enrollmentLink: {
    marginTop: 20,
    textAlign: "center",
  },
  enrollmentText: {
    color: "#4B0082",
    fontSize: 16,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
});
