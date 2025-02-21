export type RootStackParamList = {
    "index": undefined;
    "authentication/Login": undefined; // Add this if Login route is intended
    "pages/ParentProfile": undefined;
    "pages/AdminProfile": undefined;
    "pages/TeacherProfile": undefined;
    "pages/ClassSelect": undefined;
    "pages/Attendance": { className: string };
    "pages/ChildSelect": undefined;
    "pages/CheckIn": { childName: string, className: string };
    "(app)/homepage/homepage_parent" : undefined;
    "(app)/homepage/homepage_teacher" : undefined;
};

/* Add any new pages that are to be redirected here */
/* Replace 'undefined' with any parameters that are to be passed INTO the page in question */
