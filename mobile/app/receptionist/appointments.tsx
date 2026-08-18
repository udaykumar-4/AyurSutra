import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert,
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
import SmartSchedulingModal from '../../components/SmartSchedulingModal';

export default function ReceptionistAppointmentsScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<User[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [therapists, setTherapists] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'today' | 'upcoming'>('today');

  // Booking & Optimizer Modal States
  const [showBookModal, setShowBookModal] = useState(false);
  const [showOptimizerModal, setShowOptimizerModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedTherapistId, setSelectedTherapistId] = useState('');
  const [treatment, setTreatment] = useState('Abhyanga');
  const [appointmentDate, setAppointmentDate] = useState('2026-08-16');
  const [appointmentTime, setAppointmentTime] = useState('10:00');
  const [booking, setBooking] = useState(false);

  // Protected Route Check
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'receptionist')) {
      router.replace('/login');
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    if (!user) return;
    setError(null);
    try {
      const [apptsData, pData, dData, tData] = await Promise.all([
        appointmentService.getAppointments(),
        userService.getAllUsers('patient'),
        userService.getAllUsers('doctor'),
        userService.getAllUsers('therapist'),
      ]);
      setAppointments(apptsData);
      setPatients(pData);
      setDoctors(dData);
      setTherapists(tData);
      if (pData.length > 0 && !selectedPatientId) setSelectedPatientId(pData[0]._id);
      if (dData.length > 0 && !selectedDoctorId) setSelectedDoctorId(dData[0]._id);
      if (tData.length > 0 && !selectedTherapistId) setSelectedTherapistId(tData[0]._id);
    } catch (err: any) {
      setError(err.message || 'Failed to load master appointments list.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'receptionist') {
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
      Alert.alert('Status Updated', `Appointment marked as "${newStatus}".`);
      fetchData();
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Failed to update appointment status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleTogglePayment = async (id: string, currentPaid: boolean) => {
    setUpdatingId(id);
    try {
      await appointmentService.updatePaymentStatus(id, !currentPaid);
      Alert.alert('Payment Updated', `Payment marked as ${!currentPaid ? 'PAID' : 'UNPAID'}.`);
      fetchData();
    } catch (err: any) {
      Alert.alert('Payment Error', err.message || 'Failed to update payment status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateAppointment = async () => {
    if (!selectedPatientId || !treatment.trim() || !appointmentDate || !appointmentTime) {
      Alert.alert('Validation Error', 'Please select patient, treatment, date, and time.');
      return;
    }

    setBooking(true);
    try {
      await appointmentService.createAppointment({
        patientId: selectedPatientId,
        doctorId: selectedDoctorId || undefined,
        therapistId: selectedTherapistId || undefined,
        treatment: treatment.trim(),
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
      });

      Alert.alert('Booking Confirmed! 🎉', 'New clinic appointment scheduled successfully.');
      setShowBookModal(false);
      fetchData();
    } catch (err: any) {
      Alert.alert('Booking Error', err.message || 'Failed to schedule appointment.');
    } finally {
      setBooking(false);
    }
  };

  const handleSlotSelectedFromOptimizer = (time: string, date: string) => {
    setAppointmentTime(time);
    setAppointmentDate(date);
    setShowBookModal(true);
  };

  if (authLoading || (loading && !refreshing)) {
    return <LoadingScreen message="Loading Master Schedule..." />;
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
      <Header title="Master Appointments" subtitle="Front-Desk Scheduling & Check-In" showLogout={false} />

      <View style={styles.topBar}>
        <Button
          title="+ Book New Appointment"
          onPress={() => setShowBookModal(true)}
          variant="primary"
          size="medium"
          style={{ width: '48%' }}
        />
        <Button
          title="⚡ Smart Slot Optimizer"
          onPress={() => setShowOptimizerModal(true)}
          variant="secondary"
          size="medium"
          style={{ width: '48%' }}
        />
      </View>

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {error ? <ErrorView message={error} onRetry={fetchData} /> : null}

        {filteredAppts.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>No Appointments Found</Text>
            <Text style={styles.emptyDesc}>No clinic appointments match the selected filter.</Text>
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

              <Text style={styles.itemDetail}>🌿 Treatment: {item.treatment}</Text>
              <Text style={styles.itemDetail}>
                📅 Date & Time: {new Date(item.appointment_date).toLocaleDateString()} at {item.appointment_time}
              </Text>
              <Text style={styles.itemDetail}>
                👨‍⚕️ Doctor: {typeof item.doctorId === 'object' ? item.doctorId.full_name : 'N/A'}
              </Text>
              <Text style={styles.itemDetail}>
                🧘 Therapist: {typeof item.therapistId === 'object' ? item.therapistId.full_name : 'N/A'}
              </Text>

              {/* Payment & Status Control Actions */}
              <View style={styles.actionSection}>
                <View style={styles.paymentRow}>
                  <Text style={styles.costText}>Fee: ₹{item.cost || 1500}</Text>
                  <Button
                    title={item.isPaid ? '✓ PAID' : 'Mark Paid'}
                    onPress={() => handleTogglePayment(item._id, !!item.isPaid)}
                    loading={updatingId === item._id}
                    size="small"
                    variant={item.isPaid ? 'outline' : 'primary'}
                  />
                </View>

                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Change Status:</Text>
                  <View style={styles.btnGroup}>
                    {item.status !== 'completed' && (
                      <Button
                        title="Completed"
                        onPress={() => handleUpdateStatus(item._id, 'completed')}
                        loading={updatingId === item._id}
                        size="small"
                        variant="outline"
                        style={{ marginRight: 6 }}
                      />
                    )}
                    {item.status !== 'cancelled' && (
                      <Button
                        title="Cancel"
                        onPress={() => handleUpdateStatus(item._id, 'cancelled')}
                        loading={updatingId === item._id}
                        size="small"
                        variant="danger"
                      />
                    )}
                  </View>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* 🌟 Smart Scheduling Modal */}
      <SmartSchedulingModal
        visible={showOptimizerModal}
        onClose={() => setShowOptimizerModal(false)}
        staffId={selectedDoctorId || selectedTherapistId}
        staffName={doctors.find(d => d._id === selectedDoctorId)?.full_name || therapists.find(t => t._id === selectedTherapistId)?.full_name}
        onSelectSlot={handleSlotSelectedFromOptimizer}
      />

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
              <Text style={styles.modalTitle}>Book Clinic Appointment</Text>
              <TouchableOpacity onPress={() => setShowBookModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 460 }}>
              {/* Select Patient */}
              <Text style={styles.selectLabel}>Select Patient:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {patients.map((p) => (
                  <TouchableOpacity
                    key={p._id}
                    style={[styles.selectChip, selectedPatientId === p._id && styles.activeSelectChip]}
                    onPress={() => setSelectedPatientId(p._id)}
                  >
                    <Text style={[styles.selectChipText, selectedPatientId === p._id && styles.activeSelectChipText]}>
                      👤 {p.full_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Select Doctor */}
              <Text style={styles.selectLabel}>Assign Doctor (Optional):</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {doctors.map((d) => (
                  <TouchableOpacity
                    key={d._id}
                    style={[styles.selectChip, selectedDoctorId === d._id && styles.activeSelectChip]}
                    onPress={() => setSelectedDoctorId(d._id)}
                  >
                    <Text style={[styles.selectChipText, selectedDoctorId === d._id && styles.activeSelectChipText]}>
                      👨‍⚕️ {d.full_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Select Therapist */}
              <Text style={styles.selectLabel}>Assign Therapist (Optional):</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {therapists.map((t) => (
                  <TouchableOpacity
                    key={t._id}
                    style={[styles.selectChip, selectedTherapistId === t._id && styles.activeSelectChip]}
                    onPress={() => setSelectedTherapistId(t._id)}
                  >
                    <Text style={[styles.selectChipText, selectedTherapistId === t._id && styles.activeSelectChipText]}>
                      🧘 {t.full_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

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

              <Button
                title="Confirm Appointment Booking"
                onPress={handleCreateAppointment}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginTop: 10,
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
  actionSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  costText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  btnGroup: {
    flexDirection: 'row',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  selectLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  selectChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  activeSelectChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  selectChipText: {
    fontSize: 12,
    color: Colors.text,
  },
  activeSelectChipText: {
    fontWeight: '700',
    color: Colors.white,
  },
});
