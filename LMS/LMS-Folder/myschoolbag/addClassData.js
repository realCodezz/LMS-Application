import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebaseConfig.js"; 

// this script is to add data for Class Collection
const classesData = {
  K0: {
    name: "K0",
    schedules: {
      Monday: {
        subjects: [
          { subject: "Math", time: "10:00 AM - 11:00 AM" },
          { subject: "Science", time: "11:00 AM - 12:00 PM" }
        ],
        students: ["Tan Ah Doe", "Waow Doe"]
      },
      Wednesday: {
        subjects: [
          { subject: "English", time: "10:00 AM - 11:00 AM" }
        ],
        students: ["Waow Doe"]
      }
    },
    remarks: {
      "2025-01-14": "Finish Math homework."
    }
  },
  K1: {
    name: "K1",
    schedules: {
      Monday: {
        subjects: [
          { subject: "Mother Tongue", time: "1:00 PM - 2:00 PM" },
          { subject: "Science", time: "2:00 PM - 3:00 PM" }
        ],
        students: ["Johnny Sin", "Konny Tan"]
      },
      Tuesday: {
        subjects: [
          { subject: "English", time: "8:00 AM - 9:00 AM" }
        ],
        students: ["Johnny Sin"]
      }
    },
    remarks: {
      "2025-01-12": "Prepare for Science quiz."
    }
  },
  K2: {
    name: "K2",
    schedules: {
      Thursday: {
        subjects: [
          { subject: "Math", time: "9:00 AM - 10:00 AM" },
          { subject: "Art", time: "10:30 AM - 11:30 AM" }
        ],
        students: ["Alice Tan", "Bob Lee"]
      },
      Friday: {
        subjects: [
          { subject: "Music", time: "1:00 PM - 2:00 PM" }
        ],
        students: ["Alice Tan"]
      }
    },
    remarks: {
      "2025-01-16": "Music practice session."
    }
  }
};


const addClassesData = async () => {
  try {
    for (const [className, classData] of Object.entries(classesData)) {
      await setDoc(doc(db, "Classes", className), classData);
      console.log(`Class data for ${className} added successfully!`);
    }
  } catch (error) {
    console.error("Error adding class data: ", error);
  }
};

addClassesData();
