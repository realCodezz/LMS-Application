import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import Calendar from 'react-calendar';
import { useUser } from '@/context/UserContext';
import { doc, getDoc, collection, getDocs, query, where, updateDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import Toast from 'react-native-toast-message';
import { Picker } from '@react-native-picker/picker';

interface Schedule {
    subjects: { subject: string; startTime: string; endTime: string }[];
    students: string[];
}

interface ClassInfo {
    name: string;
    schedules: { [day: string]: Schedule };
    remarks: { [date: string]: string };
}

const TeacherProfile: React.FC = () => {
    const { user } = useUser();
    const [classesInCharge, setClassesInCharge] = useState<ClassInfo[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [remarks, setRemarks] = useState<string>('');
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedDateInfo, setSelectedDateInfo] = useState<{ subjects: string[]; students: string[] }>({ subjects: [], students: [] });
    const [newSubjectName, setNewSubjectName] = useState<string>('');
    const [newSubjectStartTime, setNewSubjectStartTime] = useState<string>('');
    const [newSubjectStartAmPm, setNewSubjectStartAmPm] = useState<string>('AM');
    const [newSubjectEndTime, setNewSubjectEndTime] = useState<string>('');
    const [newSubjectEndAmPm, setNewSubjectEndAmPm] = useState<string>('AM');
    const [newStudentName, setNewStudentName] = useState<string>('');

    useEffect(() => {
        const fetchTeacherAndClassData = async () => {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, 'Users', user.id));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        const classNames = userData.classesInCharge || [];
                        const classesQuery = query(
                            collection(db, 'Classes'),
                            where('name', 'in', classNames)
                        );
                        const classDocs = await getDocs(classesQuery);

                        const classes: ClassInfo[] = classDocs.docs.map((doc) => {
                            const classData = doc.data();
                            return {
                                name: classData.name || '',
                                schedules: classData.schedules || {},
                                remarks: classData.remarks || {},
                            };
                        });

                        setClassesInCharge(classes);
                        if (classes.length > 0) setSelectedClass(classes[0].name); // Default to the first class
                    }
                } catch (error) {
                    console.error('Error fetching data:', error);
                }
            }
        };
        fetchTeacherAndClassData();
    }, [user]);

    useEffect(() => {
        const fetchStudentsForClass = async () => {
            if (selectedClass) {
                try {
                    const studentsQuery = query(
                        collection(db, 'Students'),
                        where('className', '==', selectedClass)
                    );
                    const studentDocs = await getDocs(studentsQuery);

                    const students = studentDocs.docs.map((doc) => doc.data().childFullName);

                    setSelectedDateInfo((prevInfo) => ({ ...prevInfo, students }));
                } catch (error) {
                    console.error('Error fetching students:', error);
                }
            }
        };

        fetchStudentsForClass();
    }, [selectedClass]);

    useEffect(() => {
        const updateSelectedClassData = () => {
            const selectedDay = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
            const dateKey = selectedDate.toISOString().split('T')[0];

            const selectedClassData = classesInCharge.find((cls) => cls.name === selectedClass);
            const classRemarks = selectedClassData?.remarks[dateKey] || '';

            const subjects = selectedClassData?.schedules[selectedDay]?.subjects.map(
                (sub) => `${sub.subject} (${sub.startTime} - ${sub.endTime})`
            ) || [];

            setRemarks(classRemarks);
            setSelectedDateInfo((prevInfo) => ({ ...prevInfo, subjects }));
        };

        updateSelectedClassData();
    }, [selectedClass, selectedDate, classesInCharge]);

    const handleDateChange = (value: Date | Date[]) => {
        const date = Array.isArray(value) ? value[0] : value;

        if (date instanceof Date) {
            setSelectedDate(date);
        } else {
            console.error('Invalid date selected');
        }
    };

    const handleSaveRemarks = async () => {
        if (!remarks.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Remarks cannot be empty.',
                position: 'bottom',
                visibilityTime: 3000,
            });
            return;
        }
    
        try {
            const selectedClassData = classesInCharge.find((cls) => cls.name === selectedClass);
    
            if (selectedClassData) {
                const dateKey = selectedDate.toISOString().split('T')[0];
    
                // Update remarks in local state
                selectedClassData.remarks[dateKey] = remarks;
    
                // Update Firebase
                await updateDoc(doc(db, 'Classes', selectedClass), {
                    remarks: selectedClassData.remarks,
                });
    
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Remarks saved successfully!',
                    position: 'bottom',
                    visibilityTime: 3000,
                });
            }
        } catch (error) {
            console.error('Error saving remarks:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to save remarks. Please try again.',
                position: 'bottom',
                visibilityTime: 3000,
            });
        }
    };
    

    const handleAddSubject = async () => {
        const subjectNameRegex = /^[A-Za-z ]+$/; // Only letters and spaces allowed

        if (!newSubjectName || !subjectNameRegex.test(newSubjectName)) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Subject name should only contain letters.',
                position: 'bottom',
                visibilityTime: 3000,
            });
            return;
        }

        if (!newSubjectStartTime || !newSubjectEndTime) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please select a valid start and end time.',
                position: 'bottom',
                visibilityTime: 3000,
            });
            return;
        }

        const startTime = `${newSubjectStartTime} ${newSubjectStartAmPm}`;
        const endTime = `${newSubjectEndTime} ${newSubjectEndAmPm}`;

        if (startTime === endTime) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Start and End times cannot be the same.',
                position: 'bottom',
                visibilityTime: 3000,
            });
            return;
        }

        const selectedDay = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
        const updatedClasses = classesInCharge.map((cls) => {
            if (cls.name === selectedClass) {
                if (!cls.schedules[selectedDay]) {
                    cls.schedules[selectedDay] = { subjects: [], students: [] };
                }
                cls.schedules[selectedDay].subjects.push({
                    subject: newSubjectName,
                    startTime,
                    endTime,
                });
            }
            return cls;
        });

        setClassesInCharge(updatedClasses);

        try {
            const selectedClassData = updatedClasses.find((cls) => cls.name === selectedClass);
            if (selectedClassData) {
                await updateDoc(doc(db, 'Classes', selectedClass), {
                    schedules: selectedClassData.schedules,
                });
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Subject added and saved successfully!',
                    position: 'bottom',
                    visibilityTime: 3000,
                });
            }
        } catch (error) {
            console.error('Error saving subject:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to save subject. Please try again.',
                position: 'bottom',
                visibilityTime: 3000,
            });
        }

        setNewSubjectName('');
        setNewSubjectStartTime('');
        setNewSubjectStartAmPm('AM');
        setNewSubjectEndTime('');
        setNewSubjectEndAmPm('AM');
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Teacher Profile</Text>
            <Calendar 
                onChange={(value) => handleDateChange(value as Date | Date[])} 
                value={selectedDate} 
                className="calendar"
            />
            <View style={styles.remarkContainer}>
                <Text style={styles.remarkHeader}>
                    Remarks for {selectedDate.toDateString()}:
                </Text>
                <TextInput
                    placeholder="Add your remarks here..."
                    value={remarks}
                    onChangeText={setRemarks}
                    style={styles.input}
                />
                <TouchableOpacity onPress={handleSaveRemarks} style={styles.button}>
                    <Text style={styles.buttonText}>Save Remarks</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.dropdownContainer}>
                <Text style={styles.dropdownLabel}>Select Class:</Text>
                <Picker
                    selectedValue={selectedClass}
                    onValueChange={(value: string) => setSelectedClass(value)}
                    style={styles.dropdown}
                >
                    {classesInCharge.map((cls) => (
                        <Picker.Item key={cls.name} label={cls.name} value={cls.name} />
                    ))}
                </Picker>
            </View>
            <View style={styles.infoContainer}>
                <Text style={styles.infoHeader}>Subjects on {selectedDate.toDateString()}:</Text>
                {selectedDateInfo.subjects.length > 0 ? (
                    selectedDateInfo.subjects.map((subject, index) => (
                        <Text key={index} style={styles.infoText}>{subject}</Text>
                    ))
                ) : (
                    <Text style={styles.infoText}>No subjects for this date.</Text>
                )}
                <Text style={styles.infoHeader}>Students:</Text>
                {selectedDateInfo.students.length > 0 ? (
                    selectedDateInfo.students.map((student, index) => (
                        <Text key={index} style={styles.infoText}>{student}</Text>
                    ))
                ) : (
                    <Text style={styles.infoText}>No students assigned to this class.</Text>
                )}
            </View>
            <View style={styles.remarkContainer}>
                <Text style={styles.remarkHeader}>Add Subject to {selectedDate.toDateString()}:</Text>
                <TextInput
                    placeholder="Subject Name"
                    value={newSubjectName}
                    onChangeText={setNewSubjectName}
                    style={styles.input}
                />
                <View style={styles.timePickerContainer}>
                    <View style={styles.timePickerColumn}>
                        <Text style={styles.label}>Start Time:</Text>
                        <Picker
                            selectedValue={newSubjectStartTime}
                            onValueChange={(value) => setNewSubjectStartTime(value)}
                            style={styles.dropdown}
                        >
                            {[...Array(12)].map((_, hour) => (
                                <Picker.Item
                                    key={`${hour + 1}:00`}
                                    label={`${(hour + 1).toString().padStart(2, '0')}:00`}
                                    value={`${(hour + 1).toString().padStart(2, '0')}:00`}
                                />
                            ))}
                        </Picker>
                        <Picker
                            selectedValue={newSubjectStartAmPm}
                            onValueChange={(value) => setNewSubjectStartAmPm(value)}
                            style={styles.dropdown}
                        >
                            <Picker.Item label="AM" value="AM" />
                            <Picker.Item label="PM" value="PM" />
                        </Picker>
                    </View>
                    <View style={styles.timePickerColumn}>
                        <Text style={styles.label}>End Time:</Text>
                        <Picker
                            selectedValue={newSubjectEndTime}
                            onValueChange={(value) => setNewSubjectEndTime(value)}
                            style={styles.dropdown}
                        >
                            {[...Array(12)].map((_, hour) => (
                                <Picker.Item
                                    key={`${hour + 1}:00`}
                                    label={`${(hour + 1).toString().padStart(2, '0')}:00`}
                                    value={`${(hour + 1).toString().padStart(2, '0')}:00`}
                                />
                            ))}
                        </Picker>
                        <Picker
                            selectedValue={newSubjectEndAmPm}
                            onValueChange={(value) => setNewSubjectEndAmPm(value)}
                            style={styles.dropdown}
                        >
                            <Picker.Item label="AM" value="AM" />
                            <Picker.Item label="PM" value="PM" />
                        </Picker>
                    </View>
                </View>
                <TouchableOpacity onPress={handleAddSubject} style={styles.button}>
                    <Text style={styles.buttonText}>Add Subject</Text>
                </TouchableOpacity>
            </View>
            <Toast />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#f8f9fa',
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 20,
    },
    dropdownContainer: {
        marginBottom: 20,
    },
    dropdownLabel: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
        color: '#444',
    },
    dropdown: {
        height: 50,
        backgroundColor: '#f9f9f9',
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
    },
    infoContainer: {
        marginTop: 20,
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    infoHeader: {
        fontSize: 18,
        fontWeight: '600',
        color: '#444',
        marginBottom: 10,
    },
    infoText: {
        fontSize: 16,
        color: '#555',
        marginBottom: 5,
    },
    remarkContainer: {
        marginTop: 20,
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    remarkHeader: {
        fontSize: 18,
        fontWeight: '600',
        color: '#444',
        marginBottom: 10,
    },
    input: {
        width: '100%',
        height: 40,
        paddingHorizontal: 10,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 8,
        backgroundColor: '#f9f9f9',
        marginBottom: 10,
    },
    timePickerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    timePickerColumn: {
        flex: 1,
        marginRight: 10,
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
    },
    button: {
        backgroundColor: '#007BFF',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default TeacherProfile;
