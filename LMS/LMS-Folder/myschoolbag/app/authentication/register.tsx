import React from "react";
import { Text, View, StyleSheet, TextInput, Button } from "react-native";
import { auth, db } from "../../firebaseConfig"; // Import both auth and db from firebaseConfig
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, doc, setDoc } from "firebase/firestore"; // Import Firestore functions
import { Redirect } from "expo-router";

export default function Register() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [role, setRole] = React.useState('');
  const [classesInCharge, setClassesInCharge] = React.useState(['']); // Array for multiple classes
  const [parentOf, setParentOf] = React.useState('');
  const [registered, setRegistered] = React.useState(false);


  const handleRegister = () => {
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        const authUID = user.uid;

        // Set up Firestore document
        return setDoc(doc(db, "Users", authUID), {
          authUID: authUID,
          classesInCharge: classesInCharge, // Array of class names
          email: email,
          firstName: firstName,
          lastName: lastName,
          parentOf: parentOf,
          role: role,
        });
      })
      .then(() => {
        alert("User registered successfully!");
        setRegistered(true);
      })
      .catch((error) => {
        alert(`Error: ${error.message}`);
      });
  };

  if(registered){
    return <Redirect href={"/authentication/Login"}/>
  }

  const styles = StyleSheet.create({
    input: { height: 40, margin: 12, borderWidth: 1, padding: 10, width: '80%' },
    button: { marginTop: 20 },
  });

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <TextInput
        style={styles.input}
        onChangeText={setFirstName}
        value={firstName}
        placeholder="First Name"
      />
      <TextInput
        style={styles.input}
        onChangeText={setLastName}
        value={lastName}
        placeholder="Last Name"
      />
      <TextInput
        style={styles.input}
        onChangeText={setEmail}
        value={email}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        onChangeText={setPassword}
        value={password}
        placeholder="Password"
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        onChangeText={setRole}
        value={role}
        placeholder="Role (e.g., parent, teacher)"
      />
      <TextInput
        style={styles.input}
        onChangeText={(text) => setClassesInCharge(text.split(','))}
        value={classesInCharge.join(',')}
        placeholder="Classes In Charge (comma-separated)"
      />
      <TextInput
        style={styles.input}
        onChangeText={setParentOf}
        value={parentOf}
        placeholder="Parent Of"
      />
      <View style={styles.button}>
        <Button
          title="Register"
          onPress={handleRegister}
        />
      </View>
    </View>
  );
}
