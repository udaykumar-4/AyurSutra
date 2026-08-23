import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
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
import SmartSchedulingModal from '../../components/SmartSchedulingModal';
import BookAppointmentModal from '../../components/BookAppointmentModal';
import { categorizeAppointmentDate } from '../../utils/appointmentDateUtils';

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
  const [selectedPatientName, setSelectedPatientName] = useState('');

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
      if (pData.length > 0 && !selectedPatientId) {
        setSelectedPatientId(pData[0]._id);
        setSelectedPatientName(pData[0].full_name);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load master appointments list.');
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

  const handleSlotSelectedFromOptimizer = (time: string, date: string) => {
    setShowOptimizerModal(false);
    setShowBookModal(true);
  };

  if (authLoading || (loading && !refreshing)) {
    return <LoadingScreen message="Loading Master Schedule..." />;
  }

  const filteredAppts = appointments.filter((a) => {
    const cat = categorizeAppointmentDate(a.appointment_date);
    if (filterTab === 'today') return cat === 'TODAY';
    if (filterTab === 'upcoming') return cat === 'UPCOMING';
    return true;
  });

  return (
    <View style={styles.container}>
      <Header title="Clinic Appointments" subtitle="Reception Schedule & Booking Desk" showLogout={true} />

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

      {/* Select Patient Selector for Receptionist */}
      <View style={styles.patientSelectorRow}>
        <Text style={styles.selectLabel}>Booking Patient:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {patients.map((p) => (
            <TouchableOpacity
              key={p._id}
              style={[styles.patientChip, selectedPatientId === p._id && styles.activePatientChip]}
              onPress={() => {
                setSelectedPatientId(p._id);
                setSelectedPatientName(p.full_name);
              }}
            >
              <Text style={[styles.patientChipText, selectedPatientId === p._id && styles.activePatientChipText]}>
                👤 {p.full_name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
                  <Text style={styles.costText}>
                    Fee: ₹{item.cost || 1500} {item.status === 'cancelled' ? '(Cancelled - No Fee Due)' : ''}
                  </Text>
                  {item.status !== 'cancelled' && (
                    <Button
                      title={item.isPaid ? '✓ PAID' : 'Mark Paid'}
                      onPress={() => handleTogglePayment(item._id, !!item.isPaid)}
                      loading={updatingId === item._id}
                      size="small"
                      variant={item.isPaid ? 'outline' : 'primary'}
                    />
                  )}
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

      {/* Smart Scheduling Optimizer Modal */}
      <SmartSchedulingModal
        visible={showOptimizerModal}
        onClose={() => setShowOptimizerModal(false)}
        staffId={doctors[0]?._id || therapists[0]?._id}
        staffName={doctors[0]?.full_name || therapists[0]?.full_name}
        onSelectSlot={handleSlotSelectedFromOptimizer}
      />

      {/* Real Availability Book Appointment Modal */}
      <BookAppointmentModal
        visible={showBookModal}
        onClose={() => setShowBookModal(false)}
        patientId={selectedPatientId}
        patientName={selectedPatientName}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  patientSelectorRow: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  selectLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  patientChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  activePatientChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  patientChipText: {
    fontSize: 12,
    color: Colors.text,
  },
  activePatientChipText: {
    color: Colors.white,
    fontWeight: '700',
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
});
