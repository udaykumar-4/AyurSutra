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
import { Appointment } from '../../types/appointment';
import { Prescription } from '../../types/prescription';
import Colors from '../../constants/Colors';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';
import Card from '../../components/Card';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorView from '../../components/ErrorView';
import OutcomeAnalyticsCard from '../../components/OutcomeAnalyticsCard';
import { filterTodayAppointments, filterUpcomingAppointments } from '../../utils/appointmentDateUtils';

export default function TherapistHomeScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Protected Route Check
  useFocusEffect(
    useCallback(() => {
      if (!authLoading && (!user || user.role !== 'therapist')) {
        router.replace('/login');
      }
    }, [user, authLoading])
  );

  const fetchData = async () => {
    if (!user) return;
    setError(null);
    try {
      const [apptsData, rxData] = await Promise.all([
        appointmentService.getAppointments({ therapistId: user._id }),
        prescriptionService.getByTherapistId(user._id),
      ]);
      setAppointments(apptsData);
      setPrescriptions(rxData);
    } catch (err: any) {
      setError(err.message || 'Failed to load therapist home dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (user && user.role === 'therapist') {
        fetchData();
      }
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (authLoading || (loading && !refreshing)) {
    return <LoadingScreen message="Loading Panchakarma Therapy Queue..." />;
  }

  // Filter Session Metrics using shared timezone-safe date utils
  const todaySessions = filterTodayAppointments(appointments, true);
  const upcomingSessions = filterUpcomingAppointments(appointments, true);

  const activeTreatments = prescriptions.filter((p) => p.status === 'in-progress');
  const completedTreatments = prescriptions.filter((p) => p.status === 'completed');

  // Stats calculation
  const totalAssignedPatients = new Set(prescriptions.map((p) => typeof p.patientId === 'object' ? p.patientId._id : p.patientId)).size;
  const completedSessionsToday = todaySessions.filter((s) => s.status === 'completed').length;
  const pendingSessionsToday = todaySessions.length - completedSessionsToday;

  return (
    <View style={styles.container}>
      <Header
        title={user?.full_name || 'Therapist'}
        subtitle={user?.designation || 'Certified Panchakarma Therapist'}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.accent]} />}
      >
        {error ? <ErrorView message={error} onRetry={fetchData} /> : null}

        {/* Therapist Summary Profile Banner */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatarTherapist}>
              <Text style={styles.avatarText}>🧘</Text>
            </View>
            <View style={styles.profileTextContainer}>
              <Text style={styles.therapistName}>{user?.full_name}</Text>
              <Text style={styles.therapistTitle}>{user?.designation || 'Certified Panchakarma Therapist'}</Text>
              <Text style={styles.therapistMeta}>Assigned Patients: {totalAssignedPatients} • Active Plans: {activeTreatments.length}</Text>
            </View>
          </View>
        </Card>

        {/* Session & Treatment Metric Cards */}
        <View style={styles.statsGrid}>
          <StatCard title="Today's Sessions" value={todaySessions.length} icon="🧘" color={Colors.primary} />
          <StatCard title="Pending Today" value={pendingSessionsToday} icon="⏳" color={Colors.warning} />
          <StatCard title="Active Protocols" value={activeTreatments.length} icon="🌿" color={Colors.accentDark || '#15803d'} />
          <StatCard title="Completed Plans" value={completedTreatments.length} icon="✅" color={Colors.success} />
        </View>

        {/* 🌟 PHASE 1 ADDITIVE FEATURE: Outcome Analytics Dashboard */}
        <OutcomeAnalyticsCard role="therapist" />

        {/* Today's Therapy Sessions Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Sessions ({todaySessions.length})</Text>
          <TouchableOpacity onPress={() => router.push('/therapist/schedule')}>
            <Text style={styles.seeAllText}>View Schedule →</Text>
          </TouchableOpacity>
        </View>

        {todaySessions.length === 0 ? (
          <Card style={styles.subCard}>
            <Text style={styles.emptyText}>No therapy sessions scheduled for today.</Text>
          </Card>
        ) : (
          todaySessions.map((session) => (
            <Card key={session._id} style={styles.todayCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.patientName}>
                  👤 {typeof session.patientId === 'object' ? session.patientId.full_name : 'Patient'}
                </Text>
                <Text style={styles.timeBadge}>{session.appointment_time}</Text>
              </View>
              <Text style={styles.cardDetail}>Therapy: {session.treatment}</Text>
              <Text style={styles.cardDetail}>Status: {session.status.toUpperCase()}</Text>
            </Card>
          ))
        )}

        {/* Upcoming Sessions Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Therapy Sessions</Text>
        </View>

        {upcomingSessions.length === 0 ? (
          <Card style={styles.subCard}>
            <Text style={styles.emptyText}>No upcoming therapy sessions scheduled.</Text>
          </Card>
        ) : (
          upcomingSessions.slice(0, 3).map((session) => (
            <Card key={session._id} style={styles.upcomingCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.patientNameSmall}>
                  👤 {typeof session.patientId === 'object' ? session.patientId.full_name : 'Patient'}
                </Text>
                <Text style={styles.dateBadge}>
                  📅 {new Date(session.appointment_date).toLocaleDateString()} at {session.appointment_time}
                </Text>
              </View>
              <Text style={styles.cardDetailSmall}>Therapy: {session.treatment}</Text>
            </Card>
          ))
        )}

        {/* Active Panchakarma Treatments Overview */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Treatment Protocols</Text>
          <TouchableOpacity onPress={() => router.push('/therapist/treatments')}>
            <Text style={styles.seeAllText}>Manage Progress →</Text>
          </TouchableOpacity>
        </View>

        {activeTreatments.length === 0 ? (
          <Card style={styles.subCard}>
            <Text style={styles.emptyText}>No active Panchakarma treatments assigned.</Text>
          </Card>
        ) : (
          activeTreatments.slice(0, 2).map((rx) => (
            <Card key={rx._id} style={styles.rxCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.rxTitle}>🌿 {rx.treatment}</Text>
                <Text style={styles.rxProgressText}>{rx.progressCompleted} / {rx.duration} sessions</Text>
              </View>
              <Text style={styles.rxPatient}>
                Patient: {typeof rx.patientId === 'object' ? rx.patientId.full_name : 'Patient'}
              </Text>
              <Text style={styles.rxDoctor}>
                Doctor: {typeof rx.doctorId === 'object' ? rx.doctorId.full_name : 'Prescribing Doctor'}
              </Text>
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
  avatarTherapist: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.accent + '20',
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
  therapistName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  therapistTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accentDark || '#15803d',
    marginTop: 2,
  },
  therapistMeta: {
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
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
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
    color: Colors.accentDark || '#15803d',
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
  rxCard: {
    marginVertical: 4,
  },
  rxTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  rxProgressText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  rxPatient: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  rxDoctor: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
});
