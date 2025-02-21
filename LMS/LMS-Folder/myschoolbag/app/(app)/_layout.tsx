import { Redirect, Stack, useRouter } from "expo-router";
import { Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { useRef } from 'react';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import CustomDrawerContent from "@/components/customDrawerContent";
import { AuthProvider, useAuth } from "@/context/AuthContext"; // Adjust the path if needed
import { UserProvider, useUser } from '@/context/UserContext';


export default function RootLayout() {
  const { userAuth, loading } = useAuth();
  const { user } = useUser();
  const drawer = useRef<DrawerNavigationProp<any>>(null);

  
  interface AlbumRouteParams {
    toggleKebabMenu?: () => void;
    toggleSortMenu?: () => void;
  }

  // You can keep the splash screen open, or render a loading screen like we do here.
  if (loading) {
    return <Text>Loading...</Text>;
  }

  if(!userAuth){
    return <Redirect href={"/authentication/Login"}/>
  }

  if(user?.type == 'Teacher'){
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <UserProvider>
            <Drawer drawerContent={CustomDrawerContent}>
              <Drawer.Screen
                name="homepage/homepage_teacher" // This is the name of the page and must match the url from root
                options={{
                  headerShown: true,
                  drawerLabel: 'Home',
                  title: 'Home',
                  drawerItemStyle: { marginLeft: 10 },
                  drawerLabelStyle: { color: '#FFF', fontSize: 16 },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons
                }}
              />
              <Drawer.Screen
                name="events/teachersallevents" // This is the name of the page and must match the url from root
                options={{
                  headerShown: true,
                  drawerLabel: 'Events',
                  title: 'Events',
                  drawerItemStyle: { marginLeft: 10 },
                  drawerLabelStyle: { color: '#FFF', fontSize: 16 },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons
                }}
              />
              <Drawer.Screen
                name="events/creatingevents" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="events/teacherscreatedevents" // This is the name of the page and must match the url from root
                options={{
                  headerShown: true,
                  drawerLabel: 'Events Created',
                  title: 'Events Created',
                  drawerItemStyle: { marginLeft: 10 },
                  drawerLabelStyle: { color: '#FFF', fontSize: 16 },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons
                }}
              />
              <Drawer.Screen
                name="enrichments/teachersallenrichments" // This is the name of the page and must match the url from root
                options={{
                  headerShown: true,
                  drawerLabel: 'Enrichments',
                  title: 'Enrichments',
                  drawerItemStyle: { marginLeft: 10 },
                  drawerLabelStyle: { color: '#FFF', fontSize: 16 },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons
                }}
              />
              <Drawer.Screen
                name="enrichments/creatingenrichments" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="enrichments/teacherscreatedenrichments" // This is the name of the page and must match the url from root
                options={{
                  headerShown: true,
                  drawerLabel: 'Enrichments Created',
                  title: 'Enrichments Created',
                  drawerItemStyle: { marginLeft: 10 },
                  drawerLabelStyle: { color: '#FFF', fontSize: 16 },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons
                }}
              />
              <Drawer.Screen
                name="pages/ClassSelect" // This is the name of the page and must match the url from root
                options={{
                  headerShown: true,
                  drawerLabel: 'Attendance',
                  title: 'Attendance',
                  drawerItemStyle: { marginLeft: 10 },
                  drawerLabelStyle: { color: '#FFF', fontSize: 16 },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons
                }}
              />
              <Drawer.Screen
                name="index"
                options={{
                  headerLeft: () => (
                    <TouchableOpacity 
                      style={{ paddingLeft: 15, paddingRight: 11 }}
                      onPress={() => drawer.current?.openDrawer()}
                    >
                      <Ionicons name="menu" size={24} color="#FFF" />
                    </TouchableOpacity>
                  ),
                  headerStyle: {
                    backgroundColor: '#4B0082',
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF',
                }}
              />
              <Drawer.Screen
                name="TeacherViewsMC/MedicalCertificate" // This is the name of the page and must match the url from root
                options={{
                  headerShown: true,
                  drawerLabel: 'Leave & Medical Records',
                  title: 'Medical Certificate/ Leave of Absence',
                  drawerItemStyle: { marginLeft: 10 },
                  drawerLabelStyle: { color: '#FFF', fontSize: 16 },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons
                }}
              />
              <Drawer.Screen
                name="pages/TeacherProfile"
                options={{
                  headerShown: true,
                  drawerLabel: 'Teacher Profile',
                  title: 'Teacher Profile',
                  drawerItemStyle: { marginLeft: 10 },
                  drawerLabelStyle: { color: '#FFF', fontSize: 16 },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons
                }}
              />
              <Drawer.Screen
                name="homepage/homepage_admin" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="admin/admin_create_teacher" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="healthrecords/parenthealthrecords" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="admin/admin_csv" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="admin/admin_generate" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="AboutUs/AboutUs" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="contactus/contact_us" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="contactus/feedback" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="contactus/leave_of_absence" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="contactus/medical_certificates" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="contactus/technical_help" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="homepage/child_selection" // This is the name of the page and must match the url from root
                options={{
                  headerShown: false,
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="homepage/homepage_parent" // This is the name of the page and must match the url from root
                options={{
                  headerShown: false,
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="pages/Attendance" // This is the name of the page and must match the url from root
                options={{
                  title: 'Attendance',
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="pages/CheckIn" // This is the name of the page and must match the url from root
                options={{
                  title: 'Check In',
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="pages/ChildSelect" // This is the name of the page and must match the url from root
                options={{
                  title: 'Child Select',
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="pages/DummyTemplate" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="pages/ParentProfile" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="enrichments/parentsallenrichments" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="events/parentsallevents" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="album/Album" // This is the name of the page and must match the url from root
                options={({route})=>({
                  headerShown: true,
                  drawerLabel: 'Album',
                  title: 'Album',
                  drawerItemStyle: { marginLeft: 10 },
                  drawerLabelStyle: { color: '#FFF', fontSize: 16 },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerRight: () => {
                    const params = route.params as AlbumRouteParams; // Use the custom type here
                    return (
                      <TouchableOpacity
                        style={{ marginRight: 16 }}
                        onPress={() => {
                          if (params.toggleSortMenu) {
                            params.toggleSortMenu();
                          }
                        }}
                      >
                        <Ionicons name="funnel-outline" size={24} color="#FFF" />
                      </TouchableOpacity>
                    );
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons
                })}
              />
              <Drawer.Screen
                name="album/[id]"
                options={({ navigation, route }) => ({
                  title: 'Album',
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082',
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: '700',
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF',
                  headerLeft: () => {
                    const router = useRouter();
                    return (
                      <TouchableOpacity
                        style={{ paddingLeft: 15, paddingRight: 11 }}
                        onPress={() => router.push('/album/Album')}
                      >
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                      </TouchableOpacity>
                    );
                  },
                  headerRight: () => {
                    const params = route.params as AlbumRouteParams; // Use the custom type here
                    return (
                      <TouchableOpacity
                        style={{ marginRight: 16 }}
                        onPress={() => {
                          if (params.toggleKebabMenu) {
                            params.toggleKebabMenu();
                          }
                        }}
                      >
                        <Ionicons name="ellipsis-vertical" size={24} color="#FFF" />
                      </TouchableOpacity>
                    );
                  },
                })}
              />
              <Drawer.Screen
                name="album/CreateAlbumModal" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="album/EditAlbumModal" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="album/FacialRecognition" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="album/FacialRecognition forbidden" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
            </Drawer>
          </UserProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    );
  }
  else if(user?.type == 'Parent'){
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <UserProvider>
            <Drawer drawerContent={CustomDrawerContent}>
              <Drawer.Screen
                name="homepage/homepage_parent" // This is the name of the page and must match the url from root
                options={{
                  headerShown: true,
                  drawerLabel: 'Home Parent',
                  title: 'overview',
                  drawerItemStyle: { marginLeft: 10 },
                  drawerLabelStyle: { color: '#FFF', fontSize: 16 },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons
                }}
              />
              <Drawer.Screen
                name="events/parentsallevents" // This is the name of the page and must match the url from root
                options={{
                  headerShown: true,
                  drawerLabel: 'Events',
                  title: 'Events',
                  drawerItemStyle: { marginLeft: 10 },
                  drawerLabelStyle: { color: '#FFF', fontSize: 16 },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons
                }}
              />
              <Drawer.Screen
                name="enrichments/parentsallenrichments" // This is the name of the page and must match the url from root
                options={{
                  headerShown: true,
                  drawerLabel: 'Enrichment Classes',
                  title: 'Enrichments',
                  drawerItemStyle: { marginLeft: 10 },
                  drawerLabelStyle: { color: '#FFF', fontSize: 16 },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons
                }}
              />
              <Drawer.Screen
                name="pages/ParentProfile" // This is the name of the page and must match the route
                options={{
                    headerShown: true,
                    drawerLabel: 'Parent Profile', 
                    title: 'Profile',
                    drawerItemStyle: { marginLeft: 10 }, 
                    drawerLabelStyle: { color: '#FFF', fontSize: 16 },
                    headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons
                }}
              />
              <Drawer.Screen
                name="pages/ChildSelect" // This is the name of the page and must match the route
                options={{
                  title: 'Child Select',
                  headerShown: true,
                  drawerLabel: 'Check In', // Label displayed in the drawer
                  drawerItemStyle: { marginLeft: 10 }, // Make it visible
                  drawerLabelStyle: { color: '#FFF', fontSize: 16 },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons
                }}
              />
              <Drawer.Screen
                name="AboutUs/AboutUs" // This is the name of the page and must match the route
                options={{
                    headerShown: true,
                    drawerLabel: 'About Us', // Label displayed in the drawer
                    drawerItemStyle: { marginLeft: 10 }, // Make it visible
                    drawerLabelStyle: { color: '#FFF', fontSize: 16 },
                    headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons
                }}
              />
              <Drawer.Screen
                name="contactus/contact_us" // This is the name of the page and must match the route
                options={{
                    headerShown: true,
                    drawerLabel: 'Contact Us', 
                    title: 'Contact Us',
                    drawerItemStyle: { marginLeft: 10 }, 
                    drawerLabelStyle: { color: '#FFF', fontSize: 16 },
                    headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons
                }}
              />
              <Drawer.Screen
                name="contactus/feedback" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="contactus/leave_of_absence" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="contactus/medical_certificates" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="contactus/technical_help" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="homepage/homepage_admin" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="homepage/homepage_teacher" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="homepage/child_selection" // This is the name of the page and must match the url from root
                options={{
                  headerShown: false,
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="TeacherViewsMC/MedicalCertificate" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="admin/admin_create_teacher" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="admin/admin_csv" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="admin/admin_generate" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="pages/DummyTemplate" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="pages/TeacherProfile" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="pages/ClassSelect" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="events/creatingevents" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="events/teachersallevents" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="events/teacherscreatedevents" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="pages/CheckIn" // This is the name of the page and must match the url from root
                options={{
                  title: 'Check In',
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="pages/Attendance" // This is the name of the page and must match the url from root
                options={{
                  title: 'Attendance',
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="enrichments/creatingenrichments" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="enrichments/teachersallenrichments" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="enrichments/teacherscreatedenrichments" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="album/Album" // This is the name of the page and must match the url from root
                options={{
                  headerShown: true,
                  drawerLabel: 'Album',
                  title: 'Album',
                  drawerItemStyle: { marginLeft: 10 },
                  drawerLabelStyle: { color: '#FFF', fontSize: 16 },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons
                }}
              />
              <Drawer.Screen
                name="album/CreateAlbumModal" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="album/EditAlbumModal" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="album/[id]"
                options={({ navigation, route }) => ({
                  title: 'Album',
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082',
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: '700',
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF',
                  headerLeft: () => {
                    const router = useRouter();
                    return (
                      <TouchableOpacity
                        style={{ paddingLeft: 15, paddingRight: 11 }}
                        onPress={() => router.push('/album/Album')}
                      >
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                      </TouchableOpacity>
                    );
                  },
                  headerRight: () => {
                    const params = route.params as AlbumRouteParams; // Use the custom type here
                    return (
                      <TouchableOpacity
                        style={{ marginRight: 16 }}
                        onPress={() => {
                          if (params.toggleKebabMenu) {
                            params.toggleKebabMenu();
                          }
                        }}
                      >
                        <Ionicons name="ellipsis-vertical" size={24} color="#FFF" />
                      </TouchableOpacity>
                    );
                  },
                })}
              />
              <Drawer.Screen
                name="healthrecords/parenthealthrecords"
                options={{
                  headerShown: true,
                  drawerLabel: 'Health Records',
                  title: 'Health Records',
                  drawerItemStyle: { marginLeft: 10 },
                  drawerLabelStyle: { color: '#FFF', fontSize: 16 },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons
                }}
              />
            </Drawer>
          </UserProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    );
  }
  else if(user?.type == 'Admin'){
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <UserProvider>
            <Drawer drawerContent={CustomDrawerContent}>
              <Drawer.Screen
                name="homepage/homepage_admin" // This is the name of the page and must match the url from root
                options={{
                  headerShown: true,
                  drawerLabel: 'Home',
                  title: 'overview',
                  drawerItemStyle: { marginLeft: 10 },
                  drawerLabelStyle: { color: '#FFF', fontSize: 16 },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons
                }}
              />
              <Drawer.Screen
                name="pages/AdminProfile" // This is the name of the page and must match the url from root
                options={{
                  headerShown: true,
                  drawerLabel: 'Admin Profile',
                  title: 'Admin Profile',
                  drawerItemStyle: { marginLeft: 10 },
                  drawerLabelStyle: { color: '#FFF', fontSize: 16 },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons
                }}
              />
              <Drawer.Screen
                name="admin/admin_csv" // This is the name of the page and must match the url from root
                options={{
                  headerShown: true,
                  drawerLabel: 'Download Enrollment Drive',
                  title: 'Download Enrollment Drive',
                  drawerItemStyle: { marginLeft: 10 },
                  drawerLabelStyle: { color: '#FFF', fontSize: 16 },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons
                }}
              />
              <Drawer.Screen
                name="admin/admin_generate" // This is the name of the page and must match the url from root
                options={{
                  headerShown: true,
                  drawerLabel: 'Generate Accounts',
                  title: 'Generate Accounts',
                  drawerItemStyle: { marginLeft: 10 },
                  drawerLabelStyle: { color: '#FFF', fontSize: 16 },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons
                }}
              />
              <Drawer.Screen
                name="admin/admin_create_teacher" // This is the name of the page and must match the url from root
                options={{
                  headerShown: true,
                  drawerLabel: 'Create New Teacher',
                  title: 'Create New Teacher',
                  drawerItemStyle: { marginLeft: 10 },
                  drawerLabelStyle: { color: '#FFF', fontSize: 16 },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons
                }}
              />
              <Drawer.Screen
                name="index" // This is the name of the page and must match the url from root
                options={{}}
              />
              <Drawer.Screen
                name="homepage/homepage_parent" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="homepage/homepage_teacher" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="healthrecords/parenthealthrecords" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="pages/Attendance" // This is the name of the page and must match the url from root
                options={{
                  title: 'Attendance',
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="pages/CheckIn" // This is the name of the page and must match the url from root
                options={{
                  title: 'Check In',
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="pages/ChildSelect" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="pages/ClassSelect" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="pages/DummyTemplate" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="pages/ParentProfile" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="pages/TeacherProfile" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="TeacherViewsMC/MedicalCertificate" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="enrichments/creatingenrichments" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="enrichments/teachersallenrichments" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="enrichments/teacherscreatedenrichments" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="enrichments/parentsallenrichments" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="events/parentsallevents" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="events/creatingevents" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="events/teachersallevents" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="events/teacherscreatedevents" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="AboutUs/AboutUs" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="contactus/contact_us" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="contactus/feedback" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="contactus/leave_of_absence" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="contactus/medical_certificates" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="contactus/technical_help" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="homepage/child_selection" // This is the name of the page and must match the url from root
                options={{
                  headerShown: false,
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="album/Album" // This is the name of the page and must match the url from root
                options={{
                  headerShown: true,
                  drawerLabel: 'Album',
                  title: 'Album',
                  drawerItemStyle: { marginLeft: 10 },
                  drawerLabelStyle: { color: '#FFF', fontSize: 16 },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons
                }}
              />
              <Drawer.Screen
                name="album/[id]"
                options={({ navigation, route }) => ({
                  title: 'Album',
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082',
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: '700',
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF',
                  headerLeft: () => {
                    const router = useRouter();
                    return (
                      <TouchableOpacity
                        style={{ paddingLeft: 15, paddingRight: 11 }}
                        onPress={() => router.push('/album/Album')}
                      >
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                      </TouchableOpacity>
                    );
                  },
                  headerRight: () => {
                    const params = route.params as AlbumRouteParams; // Use the custom type here
                    return (
                      <TouchableOpacity
                        style={{ marginRight: 16 }}
                        onPress={() => {
                          if (params.toggleKebabMenu) {
                            params.toggleKebabMenu();
                          }
                        }}
                      >
                        <Ionicons name="ellipsis-vertical" size={24} color="#FFF" />
                      </TouchableOpacity>
                    );
                  },
                })}
              />
              <Drawer.Screen
                name="album/CreateAlbumModal" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="album/EditAlbumModal" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
            </Drawer>
            <Drawer.Screen
                name="album/FacialRecognition" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
              <Drawer.Screen
                name="album/FacialRecognition forbidden" // This is the name of the page and must match the url from root
                options={{
                  drawerItemStyle: { display: 'none' },
                  headerStyle: {
                    backgroundColor: '#4B0082', // Indigo bar for this screen
                  },
                  headerTitleStyle: {
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFF',
                  },
                  headerTintColor: '#FFF', // Tint color for back button and icons // use this if you dont want the page to show up
                }}
              />
          </UserProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    );
  }
}
