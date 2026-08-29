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
import userService from '../../services/userService';
import { Appointment } from '../../types/appointment';
import { Prescription } from '../../types/prescription';
import { User } from '../../types/user';
import Colors from '../../constants/Colors';
import Header from '../../components/Header';
import Card from '../../components/Card';
import ProgressBar from '../../components/ProgressBar';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorView from '../../components/ErrorView';
import OutcomeAnalyticsCard from '../../components/OutcomeAnalyticsCard';
import AIChatbotModal from '../../components/AIChatbotModal';
import PatientTreatmentRecommendationModal from '../../components/PatientTreatmentRecommendationModal';
import { filterTodayAppointments, filterUpcomingAppointments } from '../../utils/appointmentDateUtils';

export default function PatientHomeScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [assignedDoctor, setAssignedDoctor] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Modal states
  const [showChatModal, setShowChatModal] = useState(false);
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);

  // Protected Route Check
  useFocusEffect(
    useCallback(() => {
      if (!authLoading && (!user || user.role !== 'patient')) {
        router.replace('/login');
      }
    }, [user, authLoading])
  );

  const fetchData = async () => {
    if (!user) return;
    setError(null);
    try {
      const [apptsData, rxData] = await Promise.all([
        appointmentService.getAppointments({ patientId: user._id }),
        prescriptionService.getByPatientId(user._id),
      ]);
      setAppointments(apptsData);
      setPrescriptions(rxData);

      // Fetch assigned doctor if exists
      if (user.assignedDoctor) {
        const docId = typeof user.assignedDoctor === 'object' ? user.assignedDoctor._id : user.assignedDoctor;
        if (docId) {
          try {
            const doc = await userService.getUserById(docId);
            setAssignedDoctor(doc);
          } catch {
            // Non-fatal if assigned doctor fetch fails
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load home dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (user && user.role === 'patient') {
        fetchData();
      }
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (authLoading || (loading && !refreshing)) {
    return <LoadingScreen message="Welcome to AyurSutra..." />;
  }

  // Filter Today's & Upcoming Appointments using timezone-safe date utils
  const todayAppts = filterTodayAppointments(appointments, true);
  const upcomingAppts = filterUpcomingAppointments(appointments, true);

  const activeRx = prescriptions.find((p) => p.status === 'in-progress') || prescriptions[0];
  const therapistName = activeRx && typeof activeRx.therapistId === 'object' ? activeRx.therapistId.full_name : 'Assigned Therapist';
  const doctorName = activeRx && typeof activeRx.doctorId === 'object' ? activeRx.doctorId.full_name : (assignedDoctor?.full_name || 'Assigned Doctor');

  return (
    <View style={styles.container}>
      <Header
        title={`Namaste, ${user?.full_name || 'Patient'} 🌿`}
        subtitle={`Patient ID: #${user?._id.slice(-6)}`}
        showLogout={true}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {error ? <ErrorView message={error} onRetry={fetchData} /> : null}

        {/* Profile & Health Summary Banner */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarTextLarge}>{user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'P'}</Text>
            </View>
            <View style={styles.summaryDetails}>
              <Text style={styles.summaryName}>{user?.full_name}</Text>
              <Text style={styles.summarySub}>
                {user?.age ? `${user.age} yrs` : 'Age N/A'} • {user?.gender || 'Gender N/A'} • Blood: {user?.bloodGroup || 'N/A'}
              </Text>
              {user?.condition ? (
                <Text style={styles.conditionText}>Diagnosis: {user.condition}</Text>
              ) : null}
            </View>
          </View>
        </Card>

        {/* 🌟 PHASE 3 ADDITIVE FEATURE: AI Wellness Assistant Floating Banner */}
        <TouchableOpacity
          style={styles.aiChatCard}
          onPress={() => setShowChatModal(true)}
          activeOpacity={0.8}
        >
          <View style={styles.aiChatLeft}>
            <Text style={styles.aiChatIcon}>🤖</Text>
            <View>
              <Text style={styles.aiChatTitle}>Ask AyurSutra AI Assistant</Text>
              <Text style={styles.aiChatSub}>Personalized diet, therapy care & wellness guidance</Text>
            </View>
          </View>
          <Text style={styles.aiChatArrow}>Ask →</Text>
        </TouchableOpacity>

        {/* 🌟 NEW ISOLATED AI FEATURE: AI Treatment Recommendations Banner */}
        <TouchableOpacity
          style={[styles.aiChatCard, { backgroundColor: '#E8F5E9', borderColor: '#A5D6A7', marginTop: 10 }]}
          onPress={() => setShowRecommendationModal(true)}
          activeOpacity={0.8}
        >
          <View style={styles.aiChatLeft}>
            <Text style={styles.aiChatIcon}>🌿</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.aiChatTitle, { color: Colors.primary }]}>🌿 AI Treatment Recommendations</Text>
              <Text style={[styles.aiChatSub, { color: '#2E7D32' }]}>Get personalized Ayurvedic therapy guidance for your symptoms</Text>
            </View>
          </View>
          <Text style={[styles.aiChatArrow, { color: Colors.primary }]}>Explore →</Text>
        </TouchableOpacity>

        {/* Current Treatment Banner */}
        {activeRx ? (
          <Card style={styles.treatmentBanner}>
            <View style={styles.bannerHeader}>
              <Text style={styles.bannerTag}>ACTIVE PANCHAKARMA PLAN</Text>
              <Text style={styles.statusBadge}>{activeRx.status.toUpperCase()}</Text>
            </View>
            <Text style={styles.treatmentName}>{activeRx.treatment}</Text>
            <ProgressBar
              progress={activeRx.duration > 0 ? activeRx.progressCompleted / activeRx.duration : 0}
              label={`Sessions Progress (${activeRx.progressCompleted} of ${activeRx.duration} completed)`}
              color={Colors.accent}
            />

            <View style={styles.careTeamRow}>
              <View style={styles.teamMember}>
                <Text style={styles.teamLabel}>👨‍⚕️ Doctor</Text>
                <Text style={styles.teamValue}>{doctorName}</Text>
              </View>
              <View style={styles.teamMember}>
                <Text style={styles.teamLabel}>🧘 Therapist</Text>
                <Text style={styles.teamValue}>{therapistName}</Text>
              </View>
            </View>
          </Card>
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🌿</Text>
            <Text style={styles.emptyTitle}>No Active Panchakarma Plan</Text>
            <Text style={styles.emptyDesc}>Schedule a consultation with a doctor to begin your personalized Ayurvedic therapy.</Text>
          </Card>
        )}

        {/* PHASE 1 ADDITIVE FEATURE: Personal Outcome Analytics Dashboard */}
        <OutcomeAnalyticsCard role="patient" />

        {/* Today's Appointments Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Appointment</Text>
        </View>
        {todayAppts.length > 0 ? (
          todayAppts.map((item) => (
            <Card key={item._id} style={styles.todayCard}>
              <View style={styles.cardTop}>
                <Text style={styles.cardBadgeToday}>TODAY AT {item.appointment_time}</Text>
                <Text style={[styles.paidStatus, { color: item.isPaid ? Colors.success : (item.status === 'cancelled' ? Colors.textSecondary : Colors.warning) }]}>
                  {item.isPaid ? '✓ PAID' : (item.status === 'cancelled' ? 'CANCELLED' : 'UNPAID')}
                </Text>
              </View>
              <Text style={styles.cardTitle}>🌿 {item.treatment}</Text>
              <Text style={styles.cardSub}>Status: {item.status.toUpperCase()}</Text>
            </Card>
          ))
        ) : (
          <Card style={styles.subCard}>
            <Text style={styles.noApptText}>No appointments scheduled for today.</Text>
          </Card>
        )}

        {/* Upcoming Appointments Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
          <TouchableOpacity onPress={() => router.push('/patient/appointments')}>
            <Text style={styles.seeAllText}>See All →</Text>
          </TouchableOpacity>
        </View>
        {upcomingAppts.length > 0 ? (
          upcomingAppts.slice(0, 2).map((item) => (
            <Card key={item._id} style={styles.upcomingCard}>
              <View style={styles.cardTop}>
                <Text style={styles.cardDateText}>
                  📅 {new Date(item.appointment_date).toLocaleDateString()} at {item.appointment_time}
                </Text>
                <Text style={styles.statusBadgeSmall}>{item.status.toUpperCase()}</Text>
              </View>
              <Text style={styles.cardTitleSmall}>{item.treatment}</Text>
            </Card>
          ))
        ) : (
          <Card style={styles.subCard}>
            <Text style={styles.noApptText}>No upcoming appointments scheduled.</Text>
          </Card>
        )}

        {/* Notifications & Tips */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Clinic Notifications</Text>
        </View>
        <Card style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>🔔 Panchakarma Care Reminder</Text>
          <Text style={styles.noticeBody}>
            Please drink warm water and avoid cold food after your therapy session for optimal detoxification results.
          </Text>
        </Card>

        {/* Quick Actions Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push('/patient/appointments')}
          >
            <Text style={styles.quickIcon}>📅</Text>
            <Text style={styles.quickTitle}>Book Session</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push('/patient/treatment')}
          >
            <Text style={styles.quickIcon}>🌿</Text>
            <Text style={styles.quickTitle}>View Plan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push('/patient/report')}
          >
            <Text style={styles.quickIcon}>📄</Text>
            <Text style={styles.quickTitle}>Full Report</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push('/patient/feedback')}
          >
            <Text style={styles.quickIcon}>⭐</Text>
            <Text style={styles.quickTitle}>Give Feedback</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 🌟 AI Chatbot Modal */}
      <AIChatbotModal
        visible={showChatModal}
        onClose={() => setShowChatModal(false)}
        userRole="patient"
        userName={user?.full_name}
      />

      {/* 🌿 AI Treatment Recommendation Modal */}
      <PatientTreatmentRecommendationModal
        visible={showRecommendationModal}
        onClose={() => setShowRecommendationModal(false)}
        patientName={user?.full_name}
      />
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
  summaryCard: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarTextLarge: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: '800',
  },
  summaryDetails: {
    flex: 1,
  },
  summaryName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  summarySub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  conditionText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  aiChatCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 14,
    marginVertical: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  aiChatLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  aiChatIcon: {
    fontSize: 26,
    marginRight: 12,
  },
  aiChatTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.white,
  },
  aiChatSub: {
    fontSize: 11,
    color: Colors.white + 'D0',
    marginTop: 2,
  },
  aiChatArrow: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.white,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  treatmentBanner: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderWidth: 1.5,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  bannerTag: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.accentDark || '#15803d',
    letterSpacing: 0.5,
  },
  statusBadge: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  treatmentName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 10,
  },
  careTeamRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#dcfce7',
  },
  teamMember: {
    flex: 1,
  },
  teamLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  teamValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 20,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
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
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardBadgeToday: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  paidStatus: {
    fontSize: 11,
    fontWeight: '800',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  cardSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  upcomingCard: {
    marginVertical: 4,
  },
  cardDateText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  statusBadgeSmall: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardTitleSmall: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 4,
  },
  subCard: {
    padding: 12,
  },
  noApptText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  noticeCard: {
    backgroundColor: '#fffbe6',
    borderColor: '#ffe58f',
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#d48806',
    marginBottom: 4,
  },
  noticeBody: {
    fontSize: 12,
    color: Colors.text,
    lineHeight: 18,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickIcon: {
    fontSize: 26,
    marginBottom: 6,
  },
  quickTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
});
