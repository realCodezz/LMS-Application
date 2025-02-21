import React from 'react';
import { Text, View, StyleSheet, ScrollView, Image } from 'react-native';

export default function AboutUs() {
  return (
    <ScrollView style={styles.container}>
      {/* Header Section
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to MySchoolBag Nursery</Text>
        <Image source={{ uri: 'https://example.com/nursery-illustration.png' }} style={styles.headerImage} />
      </View> */}

      {/* Mission and Vision Section */}
      <View style={styles.section}>
        <Text style={styles.heading}>Mission and Vision</Text>
        <Text style={styles.paragraph}>
          At <Text style={styles.bold}>MySchoolBag Nursery</Text>, we inspire young minds to grow with curiosity and creativity in a safe, inclusive environment.
        </Text>
      </View>

      {/* Philosophy Section */}
      <View style={styles.section}>
        <Text style={styles.heading}>Our Philosophy</Text>
        <Text style={styles.paragraph}>
          We believe that each child is unique and should be nurtured to develop their full potential. Our philosophy emphasizes hands-on learning, emotional support, and fostering independence. We provide a space where children feel valued and encouraged to explore their interests.
        </Text>
      </View>

      {/* Core Values Section */}
      <View style={[styles.section, styles.sectionDivider]}>
        <Text style={styles.heading}>Our Core Values</Text>
        <View style={styles.valuesContainer}>
          <View style={styles.valueCard}>
            <Image
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1256/1256651.png' }}
              style={styles.iconRounded}
            />
            <Text style={styles.bold}>Inclusivity</Text>
          </View>
          <View style={styles.valueCard}>
            <Image
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/616/616489.png' }}
              style={styles.iconRounded}
            />
            <Text style={styles.bold}>Creativity</Text>
          </View>
          <View style={styles.valueCard}>
            <Image
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1995/1995525.png' }}
              style={styles.iconRounded}
            />
            <Text style={styles.bold}>Growth</Text>
          </View>
        </View>
      </View>

      {/* Programs Section */}
      <View style={styles.section}>
        <Text style={styles.heading}>Our Programs</Text>
        <Text style={styles.paragraph}>
          We offer a variety of programs designed to meet the developmental needs of children at different ages:
        </Text>
        <Text style={styles.paragraph}>
          - <Text style={styles.bold}>Infant Program</Text>: A safe and nurturing environment for infants to explore.
          {"\n"}- <Text style={styles.bold}>Toddler Program</Text>: Encourages social skills and motor development through play.
          {"\n"}- <Text style={styles.bold}>Preschool Program</Text>: Prepares children for school with a curriculum focused on literacy, numeracy, and creativity.
          {"\n"}- <Text style={styles.bold}>After-School Program</Text>: Engages school-age children in creative and recreational activities.
        </Text>
      </View>

      {/* Meet Our Team Section */}
      <View style={styles.section}>
        <Text style={styles.heading}>Meet Our Team</Text>
        <Text style={styles.paragraph}>
          Our dedicated team of teachers and caregivers are passionate about early childhood education. Each member is trained in child development and brings a unique set of skills to create a warm and stimulating environment for our children.
        </Text>
      </View>

      {/* Testimonials Section */}
      <View style={styles.section}>
        <Text style={styles.heading}>What Parents Say</Text>
        <Text style={styles.testimonial}>
          "My child loves going to MySchoolBag Nursery every day. The teachers are so caring, and my child has learned so much in just a few months!" - <Text style={styles.bold}>Sarah L.</Text>
        </Text>
        <Text style={styles.testimonial}>
          "The environment at MySchoolBag Nursery is welcoming and safe. I highly recommend it to any parent looking for quality early childhood education." - <Text style={styles.bold}>David K.</Text>
        </Text>
      </View>

      {/* Contact Section */}
      <View style={styles.section}>
        <Text style={styles.heading}>Get in Touch</Text>
        <Text style={styles.paragraph}>
          Reach out to us for more information or to schedule a visit:
          {"\n"}<Text style={styles.bold}>Phone:</Text> (+65) 6433 5432
          {"\n"}<Text style={styles.bold}>Email:</Text> contact@myschoolbag.com
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#dfe7fd',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3d5a80',
    marginBottom: 10,
    textAlign: 'center',
  },
  headerImage: {
    width: '90%',
    height: 20,
    resizeMode: 'contain',
    borderRadius: 15,
  },
  section: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginVertical: 10,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionDivider: {
    borderTopWidth: 2,
    borderTopColor: '#e0e0e0',
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3d5a80',
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 16,
    color: '#6c757d',
    lineHeight: 24,
  },
  bold: {
    fontWeight: 'bold',
    color: '#3d5a80',
  },
  valuesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  valueCard: {
    alignItems: 'center',
    width: 100,
  },
  iconRounded: {
    width: 60,
    height: 60,
    marginBottom: 10,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    resizeMode: 'contain',
  },
  testimonial: {
    fontSize: 16,
    color: '#6c757d',
    fontStyle: 'italic',
    marginVertical: 5,
    lineHeight: 24,
  },
});
