import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import appointmentService from '../../services/appointmentService';
import { User } from '../../types/user';
import { Appointment } from '../../types/appointment';
import Colors from '../../constants/Colors';
import Header from '../../components/Header';
import Card from '../../components/Card';
import ProgressBar from '../../components/ProgressBar';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorView from '../../components/ErrorView';

export default function AdminReportsScreen() {
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
      setError(err.message || 'Failed to aggregate administrative reports.');
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

  const handleExportSummary = () => {
    Alert.alert(
      'Administrative Report Generated',
      `System Audit Summary:\nTotal Accounts: ${users.length}\nTotal Appointments: ${appointments.length}\nTotal Revenue Collected: ₹${paidRevenue}`
    );
  };

  if (authLoading || (loading && !refreshing)) {
    return <LoadingScreen message="Aggregating System Reports..." />;
  }

  // Calculations
  const totalUsers = users.length;
  const patientsCount = users.filter((u) => u.role === 'patient').length;
  const doctorsCount = users.filter((u) => u.role === 'doctor').length;
  const therapistsCount = users.filter((u) => u.role === 'therapist').length;
  const receptionistsCount = users.filter((u) => u.role === 'receptionist').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;

  const totalAppts = appointments.length;
  const completedAppts = appointments.filter((a) => a.status === 'completed').length;
  const cancelledAppts = appointments.filter((a) => a.status === 'cancelled').length;
  const completionRate = totalAppts > 0 ? Math.round((completedAppts / totalAppts) * 100) : 0;

  const paidRevenue = appointments.filter((a) => a.isPaid).reduce((acc, a) => acc + (a.cost || 1500), 0);
  const pendingRevenue = appointments.filter((a) => !a.isPaid && a.status !== 'cancelled').reduce((acc, a) => acc + (a.cost || 1500), 0);

  return (
    <View style={styles.container}>
      <Header title="Administrative Reports" subtitle="System Audit & Financial Summary" showLogout={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.secondary]} />}
      >
        {error ? <ErrorView message={error} onRetry={fetchData} /> : null}

        {/* Action Header */}
        <Card style={styles.actionCard}>
          <View style={styles.actionRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>📈 System Analytics Summary</Text>
              <Text style={styles.actionSub}>Aggregated data across all 5 system roles.</Text>
            </View>
            <TouchableOpacity style={styles.exportBtn} onPress={handleExportSummary}>
              <Text style={styles.exportBtnText}>Export Audit</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Financial Analytics */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>💰 Revenue & Billing Performance</Text>
          <View style={styles.rowItem}>
            <Text style={styles.label}>Total Collected Revenue:</Text>
            <Text style={[styles.val, { color: Colors.success }]}>₹{paidRevenue}</Text>
          </View>
          <View style={styles.rowItem}>
            <Text style={styles.label}>Total Pending Receivables:</Text>
            <Text style={[styles.val, { color: Colors.warning }]}>₹{pendingRevenue}</Text>
          </View>
          <ProgressBar
            progress={paidRevenue + pendingRevenue > 0 ? (paidRevenue / (paidRevenue + pendingRevenue)) * 100 : 100}
            label={`Collection Efficiency (${Math.round(paidRevenue + pendingRevenue > 0 ? (paidRevenue / (paidRevenue + pendingRevenue)) * 100 : 100)}%)`}
            color={Colors.success}
            height={12}
            style={{ marginTop: 10 }}
          />
        </Card>

        {/* Session Completion Performance */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>📊 Consultation Completion Performance</Text>
          <View style={styles.rowItem}>
            <Text style={styles.label}>Total Scheduled Sessions:</Text>
            <Text style={styles.val}>{totalAppts}</Text>
          </View>
          <View style={styles.rowItem}>
            <Text style={styles.label}>Completed Sessions:</Text>
            <Text style={[styles.val, { color: Colors.success }]}>{completedAppts}</Text>
          </View>
          <View style={styles.rowItem}>
            <Text style={styles.label}>Cancelled Sessions:</Text>
            <Text style={[styles.val, { color: Colors.error }]}>{cancelledAppts}</Text>
          </View>
          <ProgressBar
            progress={completionRate}
            label={`Completion Rate (${completionRate}%)`}
            color={Colors.primary}
            height={12}
            style={{ marginTop: 10 }}
          />
        </Card>

        {/* User Account Allocation */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>👥 Account Allocation by Role</Text>
          <ProgressBar
            progress={totalUsers > 0 ? (patientsCount / totalUsers) * 100 : 0}
            label={`Patients: ${patientsCount} accounts (${Math.round(totalUsers > 0 ? (patientsCount / totalUsers) * 100 : 0)}%)`}
            color={Colors.primary}
            style={{ marginBottom: 8 }}
          />
          <ProgressBar
            progress={totalUsers > 0 ? (doctorsCount / totalUsers) * 100 : 0}
            label={`Doctors: ${doctorsCount} accounts (${Math.round(totalUsers > 0 ? (doctorsCount / totalUsers) * 100 : 0)}%)`}
            color={Colors.secondary}
            style={{ marginBottom: 8 }}
          />
          <ProgressBar
            progress={totalUsers > 0 ? (therapistsCount / totalUsers) * 100 : 0}
            label={`Therapists: ${therapistsCount} accounts (${Math.round(totalUsers > 0 ? (therapistsCount / totalUsers) * 100 : 0)}%)`}
            color={Colors.accentDark || '#15803d'}
            style={{ marginBottom: 8 }}
          />
          <ProgressBar
            progress={totalUsers > 0 ? (receptionistsCount / totalUsers) * 100 : 0}
            label={`Receptionists: ${receptionistsCount} accounts (${Math.round(totalUsers > 0 ? (receptionistsCount / totalUsers) * 100 : 0)}%)`}
            color="#d97706"
            style={{ marginBottom: 8 }}
          />
          <ProgressBar
            progress={totalUsers > 0 ? (adminCount / totalUsers) * 100 : 0}
            label={`Administrators: ${adminCount} accounts`}
            color="#6b7280"
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
  actionCard: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.secondary,
  },
  actionSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  exportBtn: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exportBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionCard: {
    marginVertical: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  val: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
});
