import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import appointmentService from '../../services/appointmentService';
import prescriptionService from '../../services/prescriptionService';
import feedbackService from '../../services/feedbackService';
import { Appointment } from '../../types/appointment';
import { Prescription } from '../../types/prescription';
import { Feedback } from '../../types/feedback';
import Colors from '../../constants/Colors';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';
import Card from '../../components/Card';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorView from '../../components/ErrorView';
import OutcomeAnalyticsCard from '../../components/OutcomeAnalyticsCard';
import { filterTodayAppointments, filterUpcomingAppointments } from '../../utils/appointmentDateUtils';

export default function DoctorDashboardScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Protected Route Check
  useFocusEffect(
    useCallback(() => {
      if (!authLoading && (!user || user.role !== 'doctor')) {
        router.replace('/login');
      }
    }, [user, authLoading])
  );

  const fetchData = async () => {
    if (!user) return;
    setError(null);
    try {
      const [apptsData, rxData, fbData] = await Promise.all([
        appointmentService.getAppointments({ doctorId: user._id }),
        prescriptionService.getByDoctorId(user._id),
        feedbackService.getDoctorFeedback(),
      ]);
      setAppointments(apptsData);
      setPrescriptions(rxData);
      setFeedbackList(fbData);
    } catch (err: any) {
      setError(err.message || 'Failed to load doctor dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (user && user.role === 'doctor') {
        fetchData();
      }
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (authLoading || (loading && !refreshing)) {
    return <LoadingScreen message="Loading Doctor Consultation Hub..." />;
  }

  // Calculate Metrics using shared timezone-safe date utils
  const todayAppts = filterTodayAppointments(appointments, true);
  const upcomingAppts = filterUpcomingAppointments(appointments, true);

  const activeTreatments = prescriptions.filter((p) => p.status === 'in-progress').length;
  const completedTreatments = prescriptions.filter((p) => p.status === 'completed').length;

  // Average Rating
  const validRatings = feedbackList.map((f) => f.doctorRating || f.overallRating).filter(Boolean);
  const avgRating = validRatings.length > 0
    ? (validRatings.reduce((a, b) => a + b, 0) / validRatings.length).toFixed(1)
    : '5.0';

  return (
    <View style={styles.container}>
      <Header
        title={user?.full_name || 'Dr. Physician'}
        subtitle={user?.designation || 'Senior Ayurvedic Physician'}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {error ? <ErrorView message={error} onRetry={fetchData} /> : null}

        {/* Doctor Summary Banner */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatarDoc}>
              <Text style={styles.avatarText}>👨‍⚕️</Text>
            </View>
            <View style={styles.profileTextContainer}>
              <Text style={styles.docName}>{user?.full_name}</Text>
              <Text style={styles.docSpecialty}>{user?.designation || 'Senior Ayurvedic Physician'}</Text>
              <Text style={styles.docMeta}>✉️ {user?.email} • 📞 {user?.phone || 'N/A'}</Text>
            </View>
          </View>
        </Card>

        {/* Key Metrics Grid */}
        <View style={styles.statsGrid}>
          <StatCard title="Today's Consultations" value={todayAppts.length} icon="📅" color={Colors.primary} />
          <StatCard title="Active Treatments" value={activeTreatments} icon="🌿" color={Colors.warning} />
          <StatCard title="Completed Plans" value={completedTreatments} icon="✅" color={Colors.success} />
          <StatCard title="Patient Rating" value={`★ ${avgRating}`} icon="⭐" color={Colors.secondary} />
        </View>

        {/* 🌟 PHASE 1 ADDITIVE FEATURE: Outcome Analytics Dashboard */}
        <OutcomeAnalyticsCard role="doctor" />

        {/* Today's Consultations Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Consultations ({todayAppts.length})</Text>
          <TouchableOpacity onPress={() => router.push('/doctor/appointments')}>
            <Text style={styles.seeAllText}>View All →</Text>
          </TouchableOpacity>
        </View>

        {todayAppts.length === 0 ? (
          <Card style={styles.subCard}>
            <Text style={styles.emptyText}>No consultations scheduled for today.</Text>
          </Card>
        ) : (
          todayAppts.map((item) => (
            <Card key={item._id} style={styles.todayCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.patientName}>
                  👤 {typeof item.patientId === 'object' ? item.patientId.full_name : 'Patient'}
                </Text>
                <Text style={styles.timeBadge}>{item.appointment_time}</Text>
              </View>
              <Text style={styles.cardDetail}>Treatment: {item.treatment}</Text>
              <Text style={styles.cardDetail}>Status: {item.status.toUpperCase()}</Text>
            </Card>
          ))
        )}

        {/* Upcoming Consultations Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
        </View>
        {upcomingAppts.length === 0 ? (
          <Card style={styles.subCard}>
            <Text style={styles.emptyText}>No upcoming appointments scheduled.</Text>
          </Card>
        ) : (
          upcomingAppts.slice(0, 3).map((item) => (
            <Card key={item._id} style={styles.upcomingCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.patientNameSmall}>
                  👤 {typeof item.patientId === 'object' ? item.patientId.full_name : 'Patient'}
                </Text>
                <Text style={styles.dateBadge}>
                  {new Date(item.appointment_date).toLocaleDateString()} at {item.appointment_time}
                </Text>
              </View>
              <Text style={styles.cardDetailSmall}>Service: {item.treatment}</Text>
            </Card>
          ))
        )}

        {/* Patient Feedback Summary */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Patient Feedback</Text>
          <TouchableOpacity onPress={() => router.push('/doctor/more')}>
            <Text style={styles.seeAllText}>View All →</Text>
          </TouchableOpacity>
        </View>
        {feedbackList.length === 0 ? (
          <Card style={styles.subCard}>
            <Text style={styles.emptyText}>No feedback reviews submitted yet.</Text>
          </Card>
        ) : (
          feedbackList.slice(0, 2).map((fb) => (
            <Card key={fb._id} style={styles.feedbackCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.feedbackAuthor}>
                  👤 {typeof fb.patientId === 'object' ? fb.patientId.full_name : 'Patient'}
                </Text>
                <Text style={styles.starText}>★ {fb.doctorRating || fb.overallRating} / 5</Text>
              </View>
              {fb.doctorFeedback ? (
                <Text style={styles.feedbackText}>"{fb.doctorFeedback}"</Text>
              ) : fb.overallFeedback ? (
                <Text style={styles.feedbackText}>"{fb.overallFeedback}"</Text>
              ) : null}
            </Card>
          ))
        )}
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
  profileCard: {
    backgroundColor: Colors.white,
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarDoc: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 26,
  },
  profileTextContainer: {
    flex: 1,
  },
  docName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  docSpecialty: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 2,
  },
  docMeta: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  todayCard: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    marginVertical: 4,
  },
  upcomingCard: {
    marginVertical: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  patientNameSmall: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  timeBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dateBadge: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  cardDetail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cardDetailSmall: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  subCard: {
    padding: 12,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  feedbackCard: {
    backgroundColor: '#fffbe6',
    borderColor: '#ffe58f',
    marginVertical: 4,
  },
  feedbackAuthor: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  starText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.warning,
  },
  feedbackText: {
    fontSize: 12,
    color: Colors.text,
    fontStyle: 'italic',
    marginTop: 4,
  },
});
