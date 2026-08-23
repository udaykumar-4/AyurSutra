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
import userService from '../../services/userService';
import { Appointment } from '../../types/appointment';
import Colors from '../../constants/Colors';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';
import Card from '../../components/Card';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorView from '../../components/ErrorView';
import { filterTodayAppointments, filterUpcomingAppointments } from '../../utils/appointmentDateUtils';

export default function ReceptionistDashboardScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientCount, setPatientCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Protected Route Check
  useFocusEffect(
    useCallback(() => {
      if (!authLoading && (!user || user.role !== 'receptionist')) {
        router.replace('/login');
      }
    }, [user, authLoading])
  );

  const fetchData = async () => {
    if (!user) return;
    setError(null);
    try {
      const [apptsData, patientsData] = await Promise.all([
        appointmentService.getAppointments(),
        userService.getAllUsers('patient'),
      ]);
      setAppointments(apptsData);
      setPatientCount(patientsData.length);
    } catch (err: any) {
      setError(err.message || 'Failed to load front-desk receptionist dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (user && user.role === 'receptionist') {
        fetchData();
      }
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (authLoading || (loading && !refreshing)) {
    return <LoadingScreen message="Loading Front-Desk Desk Portal..." />;
  }

  // Calculate Metrics using shared timezone-safe date utils
  const todayAppts = filterTodayAppointments(appointments, true);
  const upcomingAppts = filterUpcomingAppointments(appointments, true);

  const pendingPayments = appointments.filter((a) => !a.isPaid && a.status !== 'cancelled');
  const completedAppts = appointments.filter((a) => a.status === 'completed');

  return (
    <View style={styles.container}>
      <Header
        title={user?.full_name || 'Receptionist'}
        subtitle="Front-Desk Desk Operations"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {error ? <ErrorView message={error} onRetry={fetchData} /> : null}

        {/* Receptionist Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatarRec}>
              <Text style={styles.avatarText}>🏢</Text>
            </View>
            <View style={styles.profileTextContainer}>
              <Text style={styles.recName}>{user?.full_name}</Text>
              <Text style={styles.recTitle}>{user?.designation || 'Front-Desk Officer'}</Text>
              <Text style={styles.recMeta}>AyurSutra Clinic Desk • {user?.email}</Text>
            </View>
          </View>
        </Card>

        {/* Metrics Overview Grid */}
        <View style={styles.statsGrid}>
          <StatCard title="Today's Schedule" value={todayAppts.length} icon="📅" color={Colors.primary} />
          <StatCard title="Pending Payments" value={pendingPayments.length} icon="💳" color={Colors.warning} />
          <StatCard title="Completed" value={completedAppts.length} icon="✅" color={Colors.success} />
          <StatCard title="Registered Patients" value={patientCount} icon="👥" color={Colors.secondary} />
        </View>

        {/* Quick Operational Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Front-Desk Actions</Text>
        </View>
        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push('/receptionist/patients')}
          >
            <Text style={styles.quickIcon}>👤</Text>
            <Text style={styles.quickTitle}>Register Walk-In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push('/receptionist/appointments')}
          >
            <Text style={styles.quickIcon}>📅</Text>
            <Text style={styles.quickTitle}>Book Appointment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push('/receptionist/payments')}
          >
            <Text style={styles.quickIcon}>💳</Text>
            <Text style={styles.quickTitle}>Settle Payments</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push('/receptionist/appointments')}
          >
            <Text style={styles.quickIcon}>📋</Text>
            <Text style={styles.quickTitle}>Master Schedule</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Schedule Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Clinic Appointments ({todayAppts.length})</Text>
          <TouchableOpacity onPress={() => router.push('/receptionist/appointments')}>
            <Text style={styles.seeAllText}>View All →</Text>
          </TouchableOpacity>
        </View>

        {todayAppts.length === 0 ? (
          <Card style={styles.subCard}>
            <Text style={styles.emptyText}>No appointments scheduled for today.</Text>
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
              <View style={styles.cardFooter}>
                <Text style={styles.docText}>
                  Doctor: {typeof item.doctorId === 'object' ? item.doctorId.full_name : 'N/A'}
                </Text>
                <Text style={[styles.paidText, { color: item.isPaid ? Colors.success : Colors.warning }]}>
                  {item.isPaid ? 'PAID' : 'UNPAID'}
                </Text>
              </View>
            </Card>
          ))
        )}

        {/* Pending Payments Overview */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Unpaid Bills ({pendingPayments.length})</Text>
          <TouchableOpacity onPress={() => router.push('/receptionist/payments')}>
            <Text style={styles.seeAllText}>Settle →</Text>
          </TouchableOpacity>
        </View>

        {pendingPayments.length === 0 ? (
          <Card style={styles.subCard}>
            <Text style={styles.emptyText}>All scheduled appointments are fully settled.</Text>
          </Card>
        ) : (
          pendingPayments.slice(0, 2).map((item) => (
            <Card key={item._id} style={styles.unpaidCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.unpaidPatient}>
                  👤 {typeof item.patientId === 'object' ? item.patientId.full_name : 'Patient'}
                </Text>
                <Text style={styles.costBadge}>₹{item.cost || 1500}</Text>
              </View>
              <Text style={styles.cardDetail}>Treatment: {item.treatment}</Text>
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
  avatarRec: {
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
  recName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  recTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 2,
  },
  recMeta: {
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
    fontSize: 24,
    marginBottom: 4,
  },
  quickTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  todayCard: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
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
  timeBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cardDetail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#bfdbfe',
  },
  docText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  paidText: {
    fontSize: 11,
    fontWeight: '800',
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
  unpaidCard: {
    backgroundColor: '#fffbe6',
    borderColor: '#ffe58f',
    marginVertical: 4,
  },
  unpaidPatient: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  costBadge: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.warning,
  },
});
