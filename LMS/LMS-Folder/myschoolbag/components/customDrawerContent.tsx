import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  Modal,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateDoc, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { useUser } from "@/context/UserContext";
import { DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import Ionicons from "react-native-vector-icons/Ionicons";

export default function CustomDrawerContent(props: any) {
  const { user, setSelectedChild } = useUser();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [value, setValue] = useState<string>(user?.selectedChild?.id || "");
  const [items, setItems] = useState<{ label: string; value: string }[]>([]);

  // 🔹 Fetch Profile Picture (Fix Missing Profile)
  useEffect(() => {
    const fetchProfilePicture = async () => {
      if (user?.id) {
        try {
          const userRef = doc(db, "Users", user.id);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const profilePic = userSnap.data()?.profilePicture || null;
            setProfileImage(profilePic);
          }
        } catch (error) {
          console.error("Error fetching profile picture:", error);
        }
      }
    };

    fetchProfilePicture();
  }, [user?.id]); // Only re-run when user ID changes

  // 🔹 Fetch Children from Firestore (Removes Debug Logs)
  useEffect(() => {
    const fetchChildren = async () => {
      if (user?.parentOf && Array.isArray(user.parentOf) && user.parentOf.length > 0) {
        try {
          const childPromises = user.parentOf.map(async (childId) => {
            const childDoc = await getDoc(doc(db, "Students", childId));
            if (childDoc.exists()) {
              const childData = childDoc.data();
              return { label: childData.childFullName || "No Name Found", value: childId };
            }
            return null;
          });

          const resolvedChildren = await Promise.all(childPromises);
          const filteredChildren = resolvedChildren.filter(Boolean) as { label: string; value: string }[];

          setItems(filteredChildren);

          if (filteredChildren.length === 1) {
            setValue(filteredChildren[0].value);
            setSelectedChild(filteredChildren[0].value);
          }
        } catch (error) {
          console.error("Error fetching children:", error);
        }
      }
    };

    fetchChildren();
  }, [user, setSelectedChild]);

  // 🔹 Pick & Upload Profile Picture
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const selectedImage = result.assets[0].uri;
      setProfileImage(selectedImage);
      await uploadImage(selectedImage);
    }
  };

  const uploadImage = async (uri: string) => {
    if (!user?.id) return;

    try {
      const storage = getStorage();
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `profile_pictures/${user.id}.jpg`);

      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      await updateDoc(doc(db, "Users", user.id), { profilePicture: downloadURL });
      setProfileImage(downloadURL);
    } catch (error) {
      Alert.alert("Error", "Failed to upload image.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#1E3A8A" }}>
      <DrawerContentScrollView {...props} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: "center", padding: 20 }}>
          <Pressable onPress={pickImage}>
            <Image
              style={{ height: 250, width: 250, borderRadius: 5, marginBottom: 10 }}
              source={
                profileImage ? { uri: profileImage } : require("../assets/images/myschoolbag_logo.jpg")
              }
            />
          </Pressable>
          <Text style={{ color: "#FFF", fontSize: 30, fontWeight: "bold" }}>{user?.name}</Text>

          {user?.type === "Parent" && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ color: "#FFF", fontSize: 20, marginBottom: 10 }}>👶 Parent</Text>
              <Pressable onPress={() => setModalVisible(true)} style={styles.dropdownButton}>
                <Text style={styles.dropdownButtonText}>
                  {value ? items.find((child) => child.value === value)?.label || "Select a child" : "Select a child"}
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        <DrawerItemList {...props} itemStyle={{ marginLeft: 10 }} labelStyle={{ color: "#FFF", fontSize: 16 }} />
      </DrawerContentScrollView>

      {/* Modal for Child Selection */}
      <Modal visible={modalVisible} animationType="fade" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select a Child</Text>
            <FlatList
              data={items}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setValue(item.value);
                    setSelectedChild(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
            <Pressable onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Logout Button */}
      <Pressable onPress={async () => await auth.signOut()} style={{ padding: 20, flexDirection: "row", alignItems: "center" }}>
        <Ionicons name="log-out-outline" size={20} color="#FFF" style={{ marginRight: 10 }} />
        <Text style={{ color: "#FFF", fontSize: 16 }}>Logout</Text>
      </Pressable>
    </View>
  );
}


const styles = StyleSheet.create({
  dropdownButton: { backgroundColor: "#FFF", borderRadius: 5, paddingVertical: 8, paddingHorizontal: 12 },
  dropdownButtonText: { color: "#000", fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#FFF", borderRadius: 10, padding: 20, width: "80%" },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  modalItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: "#CCC" },
  modalItemText: { fontSize: 16, color: "#000" },
  closeButton: { marginTop: 20, backgroundColor: "#1E3A8A", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5, alignSelf: "center" },
  closeButtonText: { color: "#FFF", fontSize: 16 },
});
