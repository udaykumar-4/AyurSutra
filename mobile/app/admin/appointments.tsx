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

export default function AdminAppointmentsScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

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
      const data = await appointmentService.getAppointments();
      setAppointments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load master appointment schedule.');
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

  const handleUpdateStatus = async (id: string, status: AppointmentStatus) => {
    setUpdatingId(id);
    try {
      await appointmentService.updateStatus(id, status);
      Alert.alert('Status Updated', `Appointment status set to "${status}".`);
      fetchData();
    } catch (err: any) {
      Alert.alert('Update Error', err.message || 'Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteAppointment = (id: string) => {
    Alert.alert(
      'Delete Appointment Record',
      'Are you sure you want to delete this appointment from the master schedule?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setUpdatingId(id);
            try {
              await appointmentService.deleteAppointment(id);
              Alert.alert('Deleted', 'Appointment record removed.');
              fetchData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete appointment.');
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ]
    );
  };

  if (authLoading || (loading && !refreshing)) {
    return <LoadingScreen message="Loading Master Appointment Control..." />;
  }

  const filteredItems = appointments.filter((a) => {
    if (filterStatus === 'all') return true;
    return a.status === filterStatus;
  });

  return (
    <View style={styles.container}>
      <Header title="All Appointments" subtitle="System-wide Scheduling Management" showLogout={true} />

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRowContainer}
        contentContainerStyle={styles.filterRowContent}
      >
        {['all', 'scheduled', 'in-progress', 'completed', 'cancelled'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterChip, filterStatus === status && styles.activeFilterChip]}
            onPress={() => setFilterStatus(status)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, filterStatus === status && styles.activeFilterChipText]}>
              {status.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.secondary]} />}
      >
        {error ? <ErrorView message={error} onRetry={fetchData} /> : null}

        {filteredItems.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>No Appointments Found</Text>
            <Text style={styles.emptyDesc}>No appointment records match the selected status filter.</Text>
          </Card>
        ) : (
          filteredItems.map((item) => (
            <Card key={item._id} style={styles.apptCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.patientName}>
                  👤 {typeof item.patientId === 'object' ? item.patientId.full_name : 'Patient'}
                </Text>
                <Text style={[styles.statusBadge, getStatusStyle(item.status)]}>
                  {item.status.toUpperCase()}
                </Text>
              </View>

              <Text style={styles.itemDetail}>🌿 Treatment: {item.treatment}</Text>
              <Text style={styles.itemDetail}>
                📅 Date & Time: {new Date(item.appointment_date).toLocaleDateString()} at {item.appointment_time}
              </Text>
              <Text style={styles.itemDetail}>
                👨‍⚕️ Doctor: {typeof item.doctorId === 'object' ? item.doctorId.full_name : 'Unassigned'}
              </Text>
              <Text style={styles.itemDetail}>
                🧘 Therapist: {typeof item.therapistId === 'object' ? item.therapistId.full_name : 'Unassigned'}
              </Text>
              <Text style={styles.itemDetail}>
                Cost / Fee: ₹{item.cost || 1500} • <Text style={{ fontWeight: '700', color: item.isPaid ? Colors.success : Colors.warning }}>{item.isPaid ? 'PAID ✓' : 'UNPAID PENDING'}</Text>
              </Text>

              {/* Admin Actions */}
              <View style={styles.actionRow}>
                {item.status !== 'completed' && (
                  <Button
                    title="Mark Complete"
                    onPress={() => handleUpdateStatus(item._id, 'completed')}
                    loading={updatingId === item._id}
                    size="small"
                    variant="outline"
                    style={{ marginRight: 6 }}
                  />
                )}

                <Button
                  title="Delete Record"
                  onPress={() => handleDeleteAppointment(item._id)}
                  loading={updatingId === item._id}
                  size="small"
                  variant="danger"
                />
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
  filterRowContainer: {
    flexGrow: 0,
    maxHeight: 52,
    marginVertical: 6,
  },
  filterRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    height: 36,
  },
  activeFilterChip: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  activeFilterChipText: {
    color: Colors.white,
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
    marginBottom: 6,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: '800',
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
  actionRow: {
    flexDirection: 'row',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
