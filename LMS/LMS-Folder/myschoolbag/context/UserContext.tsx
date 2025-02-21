import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/firebaseConfig";
import { useRouter } from "expo-router";
import { Storage } from "@/utils/storage";

interface CustomUser {
  id: string;
  name: string;
  email: string;
  type: "admin" | "teacher" | "parent" | "Admin" | "Teacher" | "Parent";
  phoneNumber?: string;
  parentOf?: string[];
  selectedChild?: {
    id: string;
    name: string;
    dob: string;
    className: string; // Added className for the selected child
  } | null; // Ensure this is typed as nullable
}

interface UserContextType {
  user: CustomUser | null;
  loading: boolean;
  login: (userData: CustomUser) => void;
  logout: () => void;
  setSelectedChild: (childId: string) => void; // Updated to take `childId` instead of child object
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { userAuth: firebaseUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, "Users", firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const savedSelectedChild = JSON.parse(
            await Storage.getItem("selectedChild") || "null"
          );
          setUser({
            id: firebaseUser.uid,
            name: userData.fullName,
            email: userData.email,
            type: userData.role,
            phoneNumber: userData.phoneNumber,
            parentOf: userData.parentOf,
            selectedChild: savedSelectedChild,
          });
        }
      } else {
        setUser(null);
        await Storage.removeItem("selectedChild"); // Clear platform-appropriate storage
        router.replace("/authentication/Login"); // Redirect to login page
      }
      setLoading(false);
    };

    if (!authLoading) fetchUserData();
  }, [firebaseUser, authLoading, router]);

  const login = (userData: CustomUser) => setUser(userData);

  const logout = async () => {
    try {
      await signOut(auth); // Firebase sign-out
      setUser(null); // Clear user state
      await Storage.removeItem("selectedChild");
      router.replace("/authentication/Login"); // Redirect to login page
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const setSelectedChild = async (childId: string) => {
    if (!user || !user.parentOf || !user.parentOf.includes(childId)) {
      console.error("Child ID not found for the current user.");
      return;
    }

    try {
      const childDoc = await getDoc(doc(db, "Students", childId)); // Fetch child's details
      if (childDoc.exists()) {
        const childData = childDoc.data();
        const selectedChild = {
          id: childId,
          name: childData.childFullName,
          dob: childData.childDOB,
          className: childData.className, // Include className
        };

        setUser((prevUser) => {
          if (prevUser) {
            const updatedUser = { ...prevUser, selectedChild };
            Storage.setItem("selectedChild", JSON.stringify(selectedChild)); // Save to platform-appropriate storage
            return updatedUser;
          }
          return prevUser;
        });
      } else {
        console.error("Child document not found in Firestore.");
      }
    } catch (error) {
      console.error("Error fetching child details:", error);
    }
  };

  return (
    <UserContext.Provider
      value={{ user, loading, login, logout, setSelectedChild }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
