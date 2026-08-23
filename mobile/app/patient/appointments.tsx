import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import appointmentService from '../../services/appointmentService';
import userService from '../../services/userService';
import { Appointment, AppointmentStatus } from '../../types/appointment';
import { User } from '../../types/user';
import Colors from '../../constants/Colors';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Button from '../../components/Button';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorView from '../../components/ErrorView';
import BookAppointmentModal from '../../components/BookAppointmentModal';
import { categorizeAppointmentDate } from '../../utils/appointmentDateUtils';

export default function PatientAppointmentsScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Book Appointment Modal State
  const [showBookModal, setShowBookModal] = useState(false);

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
      const apptsData = await appointmentService.getAppointments({ patientId: user._id });
      setAppointments(apptsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load appointments.');
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

  const handleCancelAppointment = (id: string) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No, Keep It', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancellingId(id);
            try {
              await appointmentService.deleteAppointment(id);
              Alert.alert('Cancelled', 'Your appointment has been cancelled.');
              if (selectedAppt?._id === id) setSelectedAppt(null);
              fetchData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to cancel appointment.');
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
  };

  if (authLoading || (loading && !refreshing)) {
    return <LoadingScreen message="Loading Appointments..." />;
  }

  const filteredAppointments = appointments.filter((a) => {
    if (filterStatus === 'today') return categorizeAppointmentDate(a.appointment_date) === 'TODAY';
    if (filterStatus === 'upcoming') return categorizeAppointmentDate(a.appointment_date) === 'UPCOMING';
    if (filterStatus === 'all') return true;
    return a.status === filterStatus;
  });

  return (
    <View style={styles.container}>
      <Header title="My Appointments" subtitle="Schedule & Booking History" showLogout={true} />

      <View style={styles.topBar}>
        <Button
          title="+ Book Appointment"
          onPress={() => setShowBookModal(true)}
          variant="primary"
          size="medium"
          style={styles.bookBtn}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {['all', 'today', 'upcoming', 'scheduled', 'completed', 'cancelled'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterChip, filterStatus === status && styles.activeFilterChip]}
            onPress={() => setFilterStatus(status)}
          >
            <Text style={[styles.filterChipText, filterStatus === status && styles.activeFilterChipText]}>
              {status.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {error ? <ErrorView message={error} onRetry={fetchData} /> : null}

        {filteredAppointments.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>No Appointments Found</Text>
            <Text style={styles.emptyDesc}>No appointment records match the selected filter criteria.</Text>
          </Card>
        ) : (
          filteredAppointments.map((item) => (
            <TouchableOpacity
              key={item._id}
              activeOpacity={0.8}
              onPress={() => setSelectedAppt(item)}
            >
              <Card style={styles.apptCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.treatmentTitle}>🌿 {item.treatment}</Text>
                  <Text style={[styles.statusBadge, getStatusStyle(item.status)]}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>📅 Date & Time:</Text>
                  <Text style={styles.infoValue}>
                    {new Date(item.appointment_date).toLocaleDateString()} at {item.appointment_time}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>👨‍⚕️ Doctor:</Text>
                  <Text style={styles.infoValue}>
                    {typeof item.doctorId === 'object' ? item.doctorId.full_name : 'Assigned Doctor'}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>🧘 Therapist:</Text>
                  <Text style={styles.infoValue}>
                    {typeof item.therapistId === 'object' ? item.therapistId.full_name : 'Assigned Therapist'}
                  </Text>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.costText}>Cost: ₹{item.cost || 1500}</Text>
                  <Text style={[styles.paidText, { color: item.isPaid ? Colors.success : (item.status === 'cancelled' ? Colors.textSecondary : Colors.warning) }]}>
                    {item.isPaid ? '✓ PAID' : (item.status === 'cancelled' ? 'CANCELLED' : 'UNPAID')}
                  </Text>
                </View>

                {item.status === 'scheduled' && (
                  <TouchableOpacity
                    style={styles.cancelLink}
                    onPress={() => handleCancelAppointment(item._id)}
                  >
                    <Text style={styles.cancelLinkText}>Cancel Booking</Text>
                  </TouchableOpacity>
                )}
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Appointment Detail Modal */}
      {selectedAppt && (
        <Modal
          visible={!!selectedAppt}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedAppt(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Appointment Details</Text>
                <TouchableOpacity onPress={() => setSelectedAppt(null)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 350 }}>
                <Text style={styles.modalSub}>Treatment: {selectedAppt.treatment}</Text>
                <Text style={styles.modalDetail}>Status: {selectedAppt.status.toUpperCase()}</Text>
                <Text style={styles.modalDetail}>
                  Date: {new Date(selectedAppt.appointment_date).toLocaleDateString()}
                </Text>
                <Text style={styles.modalDetail}>Time: {selectedAppt.appointment_time}</Text>
                <Text style={styles.modalDetail}>
                  Doctor: {typeof selectedAppt.doctorId === 'object' ? selectedAppt.doctorId.full_name : 'N/A'}
                </Text>
                <Text style={styles.modalDetail}>
                  Therapist: {typeof selectedAppt.therapistId === 'object' ? selectedAppt.therapistId.full_name : 'N/A'}
                </Text>
                <Text style={styles.modalDetail}>Cost: ₹{selectedAppt.cost || 1500}</Text>
                <Text style={styles.modalDetail}>Payment Status: {selectedAppt.isPaid ? 'Paid' : 'Unpaid'}</Text>

                {selectedAppt.specialRequirements ? (
                  <Text style={styles.modalDetail}>Notes: {selectedAppt.specialRequirements}</Text>
                ) : null}
              </ScrollView>

              {selectedAppt.status === 'scheduled' && (
                <Button
                  title="Cancel Appointment"
                  onPress={() => handleCancelAppointment(selectedAppt._id)}
                  variant="danger"
                  size="small"
                  style={{ marginTop: 16 }}
                />
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* Real Availability Book Appointment Modal */}
      <BookAppointmentModal
        visible={showBookModal}
        onClose={() => setShowBookModal(false)}
        patientId={user?._id}
        patientName={user?.full_name}
        onSuccess={fetchData}
      />
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
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  bookBtn: {
    width: '100%',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
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
    marginBottom: 8,
  },
  treatmentTitle: {
    fontSize: 17,
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
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    width: 100,
  },
  infoValue: {
    fontSize: 13,
    color: Colors.text,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  costText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  paidText: {
    fontSize: 12,
    fontWeight: '800',
  },
  cancelLink: {
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  cancelLinkText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  closeBtn: {
    fontSize: 20,
    color: Colors.textMuted,
    padding: 4,
  },
  modalSub: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 8,
  },
  modalDetail: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 6,
  },
});
