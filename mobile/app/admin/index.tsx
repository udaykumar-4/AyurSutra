import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import appointmentService from '../../services/appointmentService';
import { User } from '../../types/user';
import { Appointment } from '../../types/appointment';
import Colors from '../../constants/Colors';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';
import Card from '../../components/Card';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorView from '../../components/ErrorView';
import OutcomeAnalyticsCard from '../../components/OutcomeAnalyticsCard';

export default function AdminDashboardScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Protected Route Check
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.replace('/login');
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    if (!user) return;
    setError(null);
    try {
      const [userData, apptsData] = await Promise.all([
        userService.getAllUsers(),
        appointmentService.getAppointments(),
      ]);
      setUsers(userData);
      setAppointments(apptsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load administrator dashboard metrics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchData();
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (authLoading || (loading && !refreshing)) {
    return <LoadingScreen message="Loading System Admin Center..." />;
  }

  // Calculate User Breakdown
  const totalUsers = users.length;
  const patientsCount = users.filter((u) => u.role === 'patient').length;
  const doctorsCount = users.filter((u) => u.role === 'doctor').length;
  const therapistsCount = users.filter((u) => u.role === 'therapist').length;
  const receptionistsCount = users.filter((u) => u.role === 'receptionist').length;
  const activeUsersCount = users.filter((u) => u.isActive !== false).length;
  const inactiveUsersCount = users.filter((u) => u.isActive === false).length;

  // Calculate Appointment & Financial Metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter((a) => {
    const dStr = new Date(a.appointment_date).toISOString().split('T')[0];
    return dStr === todayStr && a.status !== 'cancelled';
  });

  const completedAppts = appointments.filter((a) => a.status === 'completed').length;
  const cancelledAppts = appointments.filter((a) => a.status === 'cancelled').length;

  const paidRevenue = appointments.filter((a) => a.isPaid).reduce((acc, a) => acc + (a.cost || 1500), 0);
  const pendingRevenue = appointments.filter((a) => !a.isPaid && a.status !== 'cancelled').reduce((acc, a) => acc + (a.cost || 1500), 0);

  return (
    <View style={styles.container}>
      <Header
        title={user?.full_name || 'System Admin'}
        subtitle="Clinic System Administration & Analytics"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.secondary]} />}
      >
        {error ? <ErrorView message={error} onRetry={fetchData} /> : null}

        {/* Admin Profile Summary */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatarAdmin}>
              <Text style={styles.avatarText}>👑</Text>
            </View>
            <View style={styles.profileTextContainer}>
              <Text style={styles.adminName}>{user?.full_name}</Text>
              <Text style={styles.adminTitle}>Super Administrator</Text>
              <Text style={styles.adminMeta}>{user?.email} • Total Managed System Accounts: {totalUsers}</Text>
            </View>
          </View>
        </Card>

        {/* 🌟 PHASE 1 ADDITIVE FEATURE: Outcome Analytics Dashboard */}
        <OutcomeAnalyticsCard role="admin" />

        {/* Top-Level Metric Stats */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>User & Operational Analytics</Text>
        </View>
        <View style={styles.statsGrid}>
          <StatCard title="Total Accounts" value={totalUsers} icon="👥" color={Colors.secondary} />
          <StatCard title="Active Accounts" value={activeUsersCount} icon="✅" color={Colors.success} />
          <StatCard title="Today's Sessions" value={todayAppts.length} icon="📅" color={Colors.primary} />
          <StatCard title="Inactive / Blocked" value={inactiveUsersCount} icon="🚫" color={Colors.error} />
        </View>

        {/* Financial Revenue Metric Cards */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Financial & Payment Summary</Text>
          <TouchableOpacity onPress={() => router.push('/admin/reports')}>
            <Text style={styles.seeAllText}>Full Report →</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.statsGrid}>
          <StatCard title="Collected Revenue" value={`₹${paidRevenue}`} icon="💰" color={Colors.success} />
          <StatCard title="Pending Billing" value={`₹${pendingRevenue}`} icon="⏳" color={Colors.warning} />
        </View>

        {/* Role Distribution Breakdown */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Account Breakdown by Role</Text>
          <TouchableOpacity onPress={() => router.push('/admin/users')}>
            <Text style={styles.seeAllText}>Manage Users →</Text>
          </TouchableOpacity>
        </View>
        <Card style={styles.roleCard}>
          <View style={styles.roleRow}>
            <Text style={styles.roleLabel}>🧑‍🤝‍🧑 Patients:</Text>
            <Text style={styles.roleValue}>{patientsCount} registered</Text>
          </View>
          <View style={styles.roleRow}>
            <Text style={styles.roleLabel}>👨‍⚕️ Doctors:</Text>
            <Text style={styles.roleValue}>{doctorsCount} active physicians</Text>
          </View>
          <View style={styles.roleRow}>
            <Text style={styles.roleLabel}>🧘 Therapists:</Text>
            <Text style={styles.roleValue}>{therapistsCount} certified therapists</Text>
          </View>
          <View style={styles.roleRow}>
            <Text style={styles.roleLabel}>🏢 Receptionists:</Text>
            <Text style={styles.roleValue}>{receptionistsCount} desk officers</Text>
          </View>
        </Card>

        {/* Appointment Status Analytics */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Appointment Performance</Text>
          <TouchableOpacity onPress={() => router.push('/admin/appointments')}>
            <Text style={styles.seeAllText}>Schedule →</Text>
          </TouchableOpacity>
        </View>
        <Card style={styles.apptCard}>
          <View style={styles.roleRow}>
            <Text style={styles.roleLabel}>📅 Total Bookings:</Text>
            <Text style={styles.roleValue}>{appointments.length} overall</Text>
          </View>
          <View style={styles.roleRow}>
            <Text style={styles.roleLabel}>✅ Completed Sessions:</Text>
            <Text style={[styles.roleValue, { color: Colors.success }]}>{completedAppts} sessions</Text>
          </View>
          <View style={styles.roleRow}>
            <Text style={styles.roleLabel}>❌ Cancelled Bookings:</Text>
            <Text style={[styles.roleValue, { color: Colors.error }]}>{cancelledAppts} sessions</Text>
          </View>
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
  profileCard: {
    backgroundColor: Colors.white,
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarAdmin: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.secondary + '15',
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
  adminName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  adminTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.secondary,
    marginTop: 2,
  },
  adminMeta: {
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
  roleCard: {
    marginVertical: 4,
  },
  roleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  roleValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  apptCard: {
    marginVertical: 4,
  },
});
