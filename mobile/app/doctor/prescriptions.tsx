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
import prescriptionService from '../../services/prescriptionService';
import userService from '../../services/userService';
import { Prescription } from '../../types/prescription';
import { User } from '../../types/user';
import Colors from '../../constants/Colors';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ProgressBar from '../../components/ProgressBar';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorView from '../../components/ErrorView';

export default function DoctorPrescriptionsScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<User[]>([]);
  const [therapists, setTherapists] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Prescription Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedTherapistId, setSelectedTherapistId] = useState('');
  const [treatment, setTreatment] = useState('Abhyanga');
  const [duration, setDuration] = useState('7');
  const [plan, setPlan] = useState('');
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);

  // Protected Route Check
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'doctor')) {
      router.replace('/login');
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    if (!user) return;
    setError(null);
    try {
      const [rxData, pData, tData] = await Promise.all([
        prescriptionService.getByDoctorId(user._id),
        userService.getAllUsers('patient'),
        userService.getAllUsers('therapist'),
      ]);
      setPrescriptions(rxData);
      setPatients(pData);
      setTherapists(tData);
      if (pData.length > 0 && !selectedPatientId) setSelectedPatientId(pData[0]._id);
      if (tData.length > 0 && !selectedTherapistId) setSelectedTherapistId(tData[0]._id);
    } catch (err: any) {
      setError(err.message || 'Failed to load prescriptions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'doctor') {
      fetchData();
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleCreatePrescription = async () => {
    if (!user) return;
    if (!selectedPatientId || !selectedTherapistId || !treatment.trim() || !duration) {
      Alert.alert('Validation Error', 'Please select a patient, therapist, treatment, and duration.');
      return;
    }

    const durationNum = parseInt(duration, 10);
    if (isNaN(durationNum) || durationNum <= 0) {
      Alert.alert('Validation Error', 'Duration must be a positive number of days.');
      return;
    }

    setCreating(true);
    try {
      await prescriptionService.createPrescription({
        patientId: selectedPatientId,
        doctorId: user._id,
        therapistId: selectedTherapistId,
        treatment: treatment.trim(),
        duration: durationNum,
        plan: plan.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      Alert.alert('Prescription Issued!', 'New Panchakarma treatment plan created successfully.');
      setShowCreateModal(false);
      setPlan('');
      setNotes('');
      fetchData();
    } catch (err: any) {
      Alert.alert('Creation Failed', err.message || 'Error issuing prescription.');
    } finally {
      setCreating(false);
    }
  };

  if (authLoading || (loading && !refreshing)) {
    return <LoadingScreen message="Loading Prescriptions Directory..." />;
  }

  return (
    <View style={styles.container}>
      <Header title="Prescriptions & Protocols" subtitle="Issued Treatment Plans" showLogout={false} />

      <View style={styles.topBar}>
        <Button
          title="+ Create New Prescription"
          onPress={() => setShowCreateModal(true)}
          variant="primary"
          size="medium"
          style={{ width: '100%' }}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {error ? <ErrorView message={error} onRetry={fetchData} /> : null}

        {prescriptions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>💊</Text>
            <Text style={styles.emptyTitle}>No Prescriptions Found</Text>
            <Text style={styles.emptyDesc}>You have not issued any Panchakarma treatment prescriptions yet.</Text>
          </Card>
        ) : (
          prescriptions.map((rx) => (
            <Card key={rx._id} style={styles.rxCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.rxTitle}>🌿 {rx.treatment}</Text>
                <Text style={[styles.statusBadge, { backgroundColor: rx.status === 'completed' ? Colors.successBg : Colors.warningBg, color: rx.status === 'completed' ? Colors.success : Colors.warning }]}>
                  {rx.status.toUpperCase()}
                </Text>
              </View>

              <Text style={styles.detailText}>
                👤 Patient: {typeof rx.patientId === 'object' ? rx.patientId.full_name : 'Patient'}
              </Text>
              <Text style={styles.detailText}>
                🧘 Therapist: {typeof rx.therapistId === 'object' ? rx.therapistId.full_name : 'Therapist'}
              </Text>

              <ProgressBar
                progress={rx.duration > 0 ? (rx.progressCompleted / rx.duration) * 100 : 0}
                label={`Progress (${rx.progressCompleted} / ${rx.duration} sessions)`}
                style={{ marginVertical: 10 }}
              />

              {rx.plan ? (
                <View style={styles.planBox}>
                  <Text style={styles.boxTitle}>Treatment Protocol:</Text>
                  <Text style={styles.boxText}>{rx.plan}</Text>
                </View>
              ) : null}

              {rx.notes ? (
                <View style={styles.notesBox}>
                  <Text style={styles.boxTitle}>Doctor Advice & Notes:</Text>
                  <Text style={styles.boxText}>{rx.notes}</Text>
                </View>
              ) : null}
            </Card>
          ))
        )}
      </ScrollView>

      {/* Create Prescription Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Prescription</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 460 }}>
              {/* Select Patient */}
              <Text style={styles.selectLabel}>Select Patient:</Text>
              {patients.length === 0 ? (
                <Text style={styles.emptySelectText}>No patients available.</Text>
              ) : (
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
              )}

              {/* Select Therapist */}
              <Text style={styles.selectLabel}>Assign Therapist:</Text>
              {therapists.length === 0 ? (
                <Text style={styles.emptySelectText}>No therapists available.</Text>
              ) : (
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
              )}

              <Input
                label="Treatment Name"
                placeholder="e.g. Abhyanga, Shirodhara, Swedana, Pizhichil"
                value={treatment}
                onChangeText={setTreatment}
              />

              <Input
                label="Duration (Number of Days / Sessions)"
                placeholder="7"
                keyboardType="numeric"
                value={duration}
                onChangeText={setDuration}
              />

              <Input
                label="Detailed Protocol Plan (Optional)"
                placeholder="e.g. 45 mins session followed by herbal steam..."
                multiline
                numberOfLines={3}
                style={{ height: 70, textAlignVertical: 'top' }}
                value={plan}
                onChangeText={setPlan}
              />

              <Input
                label="Doctor Advice & Notes (Optional)"
                placeholder="e.g. Dietary restrictions, warm water intake..."
                multiline
                numberOfLines={3}
                style={{ height: 70, textAlignVertical: 'top' }}
                value={notes}
                onChangeText={setNotes}
              />

              <Button
                title="Issue Prescription"
                onPress={handleCreatePrescription}
                loading={creating}
                style={{ marginTop: 12 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
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
  rxCard: {
    marginVertical: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  rxTitle: {
    fontSize: 18,
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
  detailText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  planBox: {
    backgroundColor: '#eff6ff',
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  notesBox: {
    backgroundColor: '#fffbe6',
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  boxTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  boxText: {
    fontSize: 12,
    color: Colors.text,
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
  emptySelectText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginBottom: 10,
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
