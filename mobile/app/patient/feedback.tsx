import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import feedbackService from '../../services/feedbackService';
import Colors from '../../constants/Colors';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import RatingInput from '../../components/RatingInput';
import LoadingScreen from '../../components/LoadingScreen';

export default function PatientFeedbackScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [doctorRating, setDoctorRating] = useState<number>(5);
  const [doctorFeedback, setDoctorFeedback] = useState('');
  const [therapistRating, setTherapistRating] = useState<number>(5);
  const [therapistFeedback, setTherapistFeedback] = useState('');
  const [overallRating, setOverallRating] = useState<number>(5);
  const [overallFeedback, setOverallFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Protected Route Check
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'patient')) {
      router.replace('/login');
    }
  }, [user, authLoading]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await feedbackService.submitFeedback({
        doctorRating,
        doctorFeedback: doctorFeedback.trim() || undefined,
        therapistRating,
        therapistFeedback: therapistFeedback.trim() || undefined,
        overallRating,
        overallFeedback: overallFeedback.trim() || undefined,
      });

      Alert.alert(
        'Thank You! ⭐',
        'Your ratings and feedback have been submitted directly to your care team.',
        [{ text: 'OK', onPress: () => router.replace('/patient') }]
      );
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return <LoadingScreen message="Loading Feedback Portal..." />;
  }

  return (
    <View style={styles.container}>
      <Header title="Rate Your Experience" subtitle="Provide Feedback for Doctor & Therapist" showLogout={false} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner Card */}
        <Card style={styles.bannerCard}>
          <Text style={styles.bannerTitle}>⭐ We Value Your Feedback</Text>
          <Text style={styles.bannerSub}>
            Your ratings help us maintain the highest standard of Ayurvedic Panchakarma care.
          </Text>
        </Card>

        {/* Doctor Rating */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>👨‍⚕️ Rate Your Doctor</Text>
          <RatingInput
            label="Doctor Care & Consultation Quality"
            rating={doctorRating}
            onRatingChange={setDoctorRating}
          />
          <Input
            label="Doctor Comments (Optional)"
            placeholder="Share details about your medical consultation..."
            multiline
            numberOfLines={3}
            style={{ height: 75, textAlignVertical: 'top' }}
            value={doctorFeedback}
            onChangeText={setDoctorFeedback}
          />
        </Card>

        {/* Therapist Rating */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🧘 Rate Your Therapist</Text>
          <RatingInput
            label="Therapist Care & Session Execution"
            rating={therapistRating}
            onRatingChange={setTherapistRating}
          />
          <Input
            label="Therapist Comments (Optional)"
            placeholder="Share feedback on your Panchakarma sessions..."
            multiline
            numberOfLines={3}
            style={{ height: 75, textAlignVertical: 'top' }}
            value={therapistFeedback}
            onChangeText={setTherapistFeedback}
          />
        </Card>

        {/* Overall Clinic Rating */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🌿 Overall Clinic Experience</Text>
          <RatingInput
            label="Overall Satisfaction Rating (Required)"
            rating={overallRating}
            onRatingChange={setOverallRating}
          />
          <Input
            label="Overall Experience Comments"
            placeholder="Any additional feedback or suggestions for AyurSutra..."
            multiline
            numberOfLines={3}
            style={{ height: 80, textAlignVertical: 'top' }}
            value={overallFeedback}
            onChangeText={setOverallFeedback}
          />

          <Button
            title="Submit Care Review"
            onPress={handleSubmit}
            loading={submitting}
            style={{ marginTop: 14 }}
          />
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  bannerCard: {
    backgroundColor: '#fffbe6',
    borderColor: '#ffe58f',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#d48806',
    marginBottom: 4,
  },
  bannerSub: {
    fontSize: 12,
    color: Colors.text,
  },
  sectionCard: {
    marginVertical: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
});
