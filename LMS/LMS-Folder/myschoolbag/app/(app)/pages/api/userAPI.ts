// app/pages/api/userAPI.ts

interface ChildData {
    id: string;
    name: string;
    grade: string;
    age: number;
}

// Mock function to simulate API call
export const fetchChildrenData = async (parentId: string): Promise<ChildData[]> => {
    // Replace this mock data with an actual API call as needed
    return [
        { id: '1', name: 'John Doe', grade: '5th Grade', age: 10 },
        { id: '2', name: 'Jane Doe', grade: '3rd Grade', age: 8 },
        // Add more children data as needed
    ];
};
