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
import appointmentService from '../../services/appointmentService';
import { Appointment, AppointmentStatus } from '../../types/appointment';
import Colors from '../../constants/Colors';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Button from '../../components/Button';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorView from '../../components/ErrorView';

export default function TherapistScheduleScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'today' | 'upcoming' | 'all'>('today');

  // Protected Route Check
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'therapist')) {
      router.replace('/login');
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    if (!user) return;
    setError(null);
    try {
      const data = await appointmentService.getAppointments({ therapistId: user._id });
      setAppointments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load therapy schedule.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'therapist') {
      fetchData();
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleUpdateStatus = async (id: string, newStatus: AppointmentStatus) => {
    setUpdatingId(id);
    try {
      await appointmentService.updateStatus(id, newStatus);
      Alert.alert('Status Updated', `Therapy session marked as "${newStatus}".`);
      fetchData();
    } catch (err: any) {
      Alert.alert('Update Error', err.message || 'Failed to update session status.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (authLoading || (loading && !refreshing)) {
    return <LoadingScreen message="Loading Therapy Schedule..." />;
  }

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredAppts = appointments.filter((a) => {
    const dStr = new Date(a.appointment_date).toISOString().split('T')[0];
    if (filterTab === 'today') return dStr === todayStr;
    if (filterTab === 'upcoming') return dStr > todayStr;
    return true;
  });

  return (
    <View style={styles.container}>
      <Header title="Therapy Schedule" subtitle="Session Appointments & Status Controls" showLogout={false} />

      {/* Segmented Filter Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, filterTab === 'today' && styles.activeTabItem]}
          onPress={() => setFilterTab('today')}
        >
          <Text style={[styles.tabText, filterTab === 'today' && styles.activeTabText]}>
            Today
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, filterTab === 'upcoming' && styles.activeTabItem]}
          onPress={() => setFilterTab('upcoming')}
        >
          <Text style={[styles.tabText, filterTab === 'upcoming' && styles.activeTabText]}>
            Upcoming
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, filterTab === 'all' && styles.activeTabItem]}
          onPress={() => setFilterTab('all')}
        >
          <Text style={[styles.tabText, filterTab === 'all' && styles.activeTabText]}>
            All ({appointments.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.accent]} />}
      >
        {error ? <ErrorView message={error} onRetry={fetchData} /> : null}

        {filteredAppts.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>No Therapy Sessions Found</Text>
            <Text style={styles.emptyDesc}>No appointment sessions match the selected view filter.</Text>
          </Card>
        ) : (
          filteredAppts.map((item) => (
            <Card key={item._id} style={styles.apptCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.patientName}>
                  👤 {typeof item.patientId === 'object' ? item.patientId.full_name : 'Patient'}
                </Text>
                <Text style={[styles.statusBadge, getStatusStyle(item.status)]}>
                  {item.status.toUpperCase()}
                </Text>
              </View>

              <Text style={styles.itemDetail}>🌿 Therapy: {item.treatment}</Text>
              <Text style={styles.itemDetail}>
                📅 Date & Time: {new Date(item.appointment_date).toLocaleDateString()} at {item.appointment_time}
              </Text>
              <Text style={styles.itemDetail}>
                Prescribing Doctor: {typeof item.doctorId === 'object' ? item.doctorId.full_name : 'Doctor'}
              </Text>

              {/* Status Action Buttons */}
              <View style={styles.statusActionRow}>
                <Text style={styles.actionLabel}>Update Session Status:</Text>
                <View style={styles.actionBtnGroup}>
                  {item.status !== 'completed' && (
                    <Button
                      title="Complete Session"
                      onPress={() => handleUpdateStatus(item._id, 'completed')}
                      loading={updatingId === item._id}
                      size="small"
                      variant="primary"
                      style={styles.actionBtn}
                    />
                  )}

                  {item.status !== 'in-progress' && item.status !== 'completed' && (
                    <Button
                      title="In-Progress"
                      onPress={() => handleUpdateStatus(item._id, 'in-progress')}
                      loading={updatingId === item._id}
                      size="small"
                      variant="outline"
                      style={styles.actionBtn}
                    />
                  )}
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const getStatusStyle = (status: AppointmentStatus) => {
  switch (status) {
    case 'completed':
      return { backgroundColor: Colors.successBg, color: Colors.success };
    case 'cancelled':
      return { backgroundColor: Colors.errorBg, color: Colors.error };
    case 'in-progress':
      return { backgroundColor: Colors.warningBg, color: Colors.warning };
    case 'scheduled':
    default:
      return { backgroundColor: Colors.primary + '20', color: Colors.primary };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: Colors.background,
    marginRight: 6,
  },
  activeTabItem: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.white,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 24,
  },
  emptyIcon: {
    fontSize: 36,
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
  apptCard: {
    marginVertical: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  itemDetail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 3,
  },
  statusActionRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  actionBtnGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionBtn: {
    marginRight: 8,
    marginBottom: 6,
  },
});
