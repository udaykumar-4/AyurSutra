import React, { useEffect, useState } from 'react';
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
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import appointmentService from '../../services/appointmentService';
import userService from '../../services/userService';
import { Appointment, AppointmentStatus } from '../../types/appointment';
import { User } from '../../types/user';
import Colors from '../../constants/Colors';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorView from '../../components/ErrorView';

export default function PatientAppointmentsScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [therapists, setTherapists] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // New Booking Modal State
  const [showBookModal, setShowBookModal] = useState(false);
  const [treatment, setTreatment] = useState('Consultation');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedTherapistId, setSelectedTherapistId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('2026-08-16');
  const [appointmentTime, setAppointmentTime] = useState('10:00');
  const [booking, setBooking] = useState(false);

  // Protected Route Check
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'patient')) {
      router.replace('/login');
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    if (!user) return;
    setError(null);
    try {
      const [apptsData, docData, therData] = await Promise.all([
        appointmentService.getAppointments({ patientId: user._id }),
        userService.getAllUsers('doctor'),
        userService.getAllUsers('therapist'),
      ]);
      setAppointments(apptsData);
      setDoctors(docData);
      setTherapists(therData);
      if (docData.length > 0 && !selectedDoctorId) setSelectedDoctorId(docData[0]._id);
      if (therData.length > 0 && !selectedTherapistId) setSelectedTherapistId(therData[0]._id);
    } catch (err: any) {
      setError(err.message || 'Failed to load appointments.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'patient') {
      fetchData();
    }
  }, [user]);

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

  const handleCreateBooking = async () => {
    if (!user) return;
    if (!treatment.trim() || !appointmentDate || !appointmentTime) {
      Alert.alert('Validation Error', 'Please complete treatment, date, and time fields.');
      return;
    }

    setBooking(true);
    try {
      await appointmentService.createAppointment({
        patientId: user._id,
        doctorId: selectedDoctorId || undefined,
        therapistId: selectedTherapistId || undefined,
        treatment: treatment.trim(),
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
      });

      Alert.alert('Success!', 'New appointment booked successfully.');
      setShowBookModal(false);
      fetchData();
    } catch (err: any) {
      Alert.alert('Booking Error', err.message || 'Error scheduling appointment.');
    } finally {
      setBooking(false);
    }
  };

  if (authLoading || (loading && !refreshing)) {
    return <LoadingScreen message="Loading Appointments..." />;
  }

  const filteredAppointments = appointments.filter((a) => {
    if (filterStatus === 'all') return true;
    return a.status === filterStatus;
  });

  return (
    <View style={styles.container}>
      <Header title="My Appointments" subtitle="Schedule & Booking History" showLogout={false} />

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
        {['all', 'scheduled', 'completed', 'cancelled'].map((status) => (
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
                  <Text style={[styles.paidText, { color: item.isPaid ? Colors.success : Colors.warning }]}>
                    {item.isPaid ? '✓ PAID' : 'UNPAID'}
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

      {/* Book New Appointment Modal */}
      <Modal
        visible={showBookModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBookModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Book New Appointment</Text>
              <TouchableOpacity onPress={() => setShowBookModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              <Input
                label="Treatment Name"
                placeholder="e.g. Abhyanga, Shirodhara, Consultation"
                value={treatment}
                onChangeText={setTreatment}
              />

              <Input
                label="Date (YYYY-MM-DD)"
                placeholder="2026-08-16"
                value={appointmentDate}
                onChangeText={setAppointmentDate}
              />

              <Input
                label="Time (HH:MM)"
                placeholder="10:00"
                value={appointmentTime}
                onChangeText={setAppointmentTime}
              />

              {doctors.length > 0 && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.selectLabel}>Select Doctor:</Text>
                  {doctors.map((doc) => (
                    <TouchableOpacity
                      key={doc._id}
                      style={[styles.selectChip, selectedDoctorId === doc._id && styles.activeSelectChip]}
                      onPress={() => setSelectedDoctorId(doc._id)}
                    >
                      <Text style={[styles.selectChipText, selectedDoctorId === doc._id && styles.activeSelectChipText]}>
                        👨‍⚕️ {doc.full_name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {therapists.length > 0 && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.selectLabel}>Select Therapist:</Text>
                  {therapists.map((ther) => (
                    <TouchableOpacity
                      key={ther._id}
                      style={[styles.selectChip, selectedTherapistId === ther._id && styles.activeSelectChip]}
                      onPress={() => setSelectedTherapistId(ther._id)}
                    >
                      <Text style={[styles.selectChipText, selectedTherapistId === ther._id && styles.activeSelectChipText]}>
                        🧘 {ther.full_name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Button
                title="Schedule Appointment"
                onPress={handleCreateBooking}
                loading={booking}
                style={{ marginTop: 12 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  selectLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  selectChip: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 6,
  },
  activeSelectChip: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
  },
  selectChipText: {
    fontSize: 13,
    color: Colors.text,
  },
  activeSelectChipText: {
    fontWeight: '700',
    color: Colors.primary,
  },
});
