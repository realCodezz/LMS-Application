import React, { useState, useEffect } from 'react';
import { doc, getDoc } from "firebase/firestore";
import { useUser } from "@/context/UserContext";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebaseConfig";
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

const SelectChildPage: React.FC = () => {
    const { user, setSelectedChild } = useUser();
    const [children, setChildren] = useState<{ id: string; name: string; dob: string; className: string }[]>([]);
    const [loading2, setLoading] = useState(true);
    const router = useRouter(); 
    const { userAuth, loading } = useAuth();

    useEffect(() => {
        const fetchChildren = async () => {
            if (user?.parentOf) {
                const childPromises = user.parentOf.map(async (childId) => {
                    const childDoc = await getDoc(doc(db, "Students", childId));
                    if (childDoc.exists()) {
                        const childData = childDoc.data();
                        return {
                            id: childId,
                            name: childData.childFullName,
                            dob: childData.childDOB,
                            className: childData.className,
                        };
                    }
                });
    
                const resolvedChildren = await Promise.all(childPromises);
                const validChildren = resolvedChildren.filter(Boolean) as { id: string; name: string; dob: string; className: string}[];
    
                setChildren(validChildren);
    
                // Automatically assign if there's only one child
                if (validChildren.length === 1) {
                    setSelectedChild(validChildren[0].id);
                }
            }
            setLoading(false);
        };
    
        fetchChildren();
    }, [user]);

    if (loading || !userAuth || !user) {
        return <Text style={styles.loadingText}>Loading...</Text>;
    }

    if (loading2) {
        return <ActivityIndicator size="large" color="#0000ff" />;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Select a Child</Text>
            <FlatList
                data={children}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                renderItem={({ item }) => (
                    <View style={styles.childCard}>
                        <Text style={styles.childText}>{item.name}</Text>
                        <Text style={styles.childTextSmall}>DOB: {item.dob}</Text>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => {
                                setSelectedChild(item.id);
                                router.push("/homepage/homepage_parent");
                            }}
                        >
                            <Text style={styles.buttonText}>Select</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4B0082',
        textAlign: 'center',
        marginBottom: 20,
    },
    listContainer: {
        paddingBottom: 20,
    },
    childCard: {
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        padding: 20,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    childText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
        fontFamily: 'OpenSans_400Regular',
    },
    childTextSmall: {
        fontSize: 14,
        color: '#555',
        marginBottom: 15,
        fontFamily: 'OpenSans_400Regular',
    },
    button: {
        backgroundColor: '#4B0082',
        paddingVertical: 12,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'OpenSans_400Regular',
    },
    loadingText: {
        fontSize: 18,
        color: '#555',
        textAlign: 'center',
        marginTop: 20,
        fontFamily: 'OpenSans_400Regular',
    },
});

export default SelectChildPage;
