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
import appointmentService from '../../services/appointmentService';
import noteService from '../../services/noteService';
import { Prescription } from '../../types/prescription';
import { Appointment } from '../../types/appointment';
import { Note } from '../../types/note';
import Colors from '../../constants/Colors';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ProgressBar from '../../components/ProgressBar';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorView from '../../components/ErrorView';

export interface AssignedPatientItem {
  patientId: string;
  patientName: string;
  prescription: Prescription;
}

export default function TherapistPatientsScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected Patient Details State
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [patientAppts, setPatientAppts] = useState<Appointment[]>([]);
  const [patientNotes, setPatientNotes] = useState<Note[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  // Add Note State
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

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
      // Fetch only prescriptions assigned to THIS therapist
      const data = await prescriptionService.getByTherapistId(user._id);
      setPrescriptions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load assigned patients.');
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

  const handleOpenPatientDetails = async (rx: Prescription) => {
    setSelectedRx(rx);
    setChartLoading(true);
    const pId = typeof rx.patientId === 'object' ? rx.patientId._id : rx.patientId;

    try {
      const [appts, notesData] = await Promise.all([
        appointmentService.getAppointments({ patientId: pId, therapistId: user?._id }),
        noteService.getNotesForPatient(pId),
      ]);
      setPatientAppts(appts);
      setPatientNotes(notesData);
    } catch (err: any) {
      Alert.alert('Chart Error', err.message || 'Failed to load patient session chart.');
    } finally {
      setChartLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!selectedRx || !noteText.trim()) {
      Alert.alert('Validation Error', 'Please enter progress note text.');
      return;
    }

    const pId = typeof selectedRx.patientId === 'object' ? selectedRx.patientId._id : selectedRx.patientId;

    setSavingNote(true);
    try {
      await noteService.createNote({
        patientId: pId,
        note: noteText.trim(),
      });
      Alert.alert('Note Logged', 'Therapy progress note saved successfully.');
      setNoteText('');
      const updatedNotes = await noteService.getNotesForPatient(pId);
      setPatientNotes(updatedNotes);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save progress note.');
    } finally {
      setSavingNote(false);
    }
  };

  if (authLoading || (loading && !refreshing)) {
    return <LoadingScreen message="Loading Assigned Patients..." />;
  }

  return (
    <View style={styles.container}>
      <Header
        title="My Assigned Patients"
        subtitle="Patients Under Your Therapy Care"
        showLogout={true}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.accent]} />}
      >
        {error ? <ErrorView message={error} onRetry={fetchData} /> : null}

        {prescriptions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🧘</Text>
            <Text style={styles.emptyTitle}>No Patients Assigned</Text>
            <Text style={styles.emptyDesc}>You currently have no active patient prescriptions assigned to you.</Text>
          </Card>
        ) : (
          prescriptions.map((rx) => {
            const pName = typeof rx.patientId === 'object' ? rx.patientId.full_name : 'Patient';
            const docName = typeof rx.doctorId === 'object' ? rx.doctorId.full_name : 'Prescribing Doctor';
            const remaining = Math.max(0, rx.duration - rx.progressCompleted);

            return (
              <TouchableOpacity
                key={rx._id}
                activeOpacity={0.8}
                onPress={() => handleOpenPatientDetails(rx)}
              >
                <Card style={styles.patientCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.patientName}>👤 {pName}</Text>
                    <Text style={[styles.statusBadge, { backgroundColor: rx.status === 'completed' ? Colors.successBg : Colors.warningBg, color: rx.status === 'completed' ? Colors.success : Colors.warning }]}>
                      {rx.status.toUpperCase()}
                    </Text>
                  </View>

                  <Text style={styles.treatmentText}>🌿 Protocol: {rx.treatment}</Text>
                  <Text style={styles.doctorText}>👨‍⚕️ Prescribed By: {docName}</Text>

                  <ProgressBar
                    progress={rx.duration > 0 ? (rx.progressCompleted / rx.duration) * 100 : 0}
                    label={`Sessions: ${rx.progressCompleted} done • ${remaining} remaining`}
                    color={Colors.accent}
                    style={{ marginVertical: 8 }}
                  />

                  <View style={styles.footerRow}>
                    <Text style={styles.viewChartText}>View Full Patient Care Chart →</Text>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Patient Details & Clinical Chart Modal */}
      {selectedRx && (
        <Modal
          visible={!!selectedRx}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedRx(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>
                    👤 {typeof selectedRx.patientId === 'object' ? selectedRx.patientId.full_name : 'Patient'}
                  </Text>
                  <Text style={styles.modalSub}>Assigned Therapy Chart</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedRx(null)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              {chartLoading ? (
                <LoadingScreen message="Loading Patient Details..." />
              ) : (
                <ScrollView style={{ maxHeight: 480 }}>
                  {/* Prescription & Protocol Summary */}
                  <Card style={styles.chartCard}>
                    <Text style={styles.chartSectionTitle}>🌿 Treatment & Protocol Details</Text>
                    <Text style={styles.chartText}>Treatment Name: {selectedRx.treatment}</Text>
                    <Text style={styles.chartText}>
                      Doctor: {typeof selectedRx.doctorId === 'object' ? selectedRx.doctorId.full_name : 'Prescribing Doctor'}
                    </Text>
                    <Text style={styles.chartText}>Status: {selectedRx.status.toUpperCase()}</Text>

                    <ProgressBar
                      progress={selectedRx.duration > 0 ? (selectedRx.progressCompleted / selectedRx.duration) * 100 : 0}
                      label={`Sessions Completed: ${selectedRx.progressCompleted} of ${selectedRx.duration}`}
                      style={{ marginVertical: 8 }}
                    />
                    <Text style={styles.remainingText}>
                      Sessions Remaining: {Math.max(0, selectedRx.duration - selectedRx.progressCompleted)}
                    </Text>

                    {selectedRx.plan ? (
                      <View style={styles.boxContainer}>
                        <Text style={styles.boxTitle}>Doctor Protocol Instructions:</Text>
                        <Text style={styles.boxText}>{selectedRx.plan}</Text>
                      </View>
                    ) : null}

                    {selectedRx.notes ? (
                      <View style={styles.boxContainerAlt}>
                        <Text style={styles.boxTitle}>Doctor Advice & Notes:</Text>
                        <Text style={styles.boxText}>{selectedRx.notes}</Text>
                      </View>
                    ) : null}
                  </Card>

                  {/* Therapy Sessions History */}
                  <Card style={styles.chartCard}>
                    <Text style={styles.chartSectionTitle}>📅 Scheduled Sessions ({patientAppts.length})</Text>
                    {patientAppts.length === 0 ? (
                      <Text style={styles.emptyChartText}>No session appointments scheduled yet.</Text>
                    ) : (
                      patientAppts.map((appt) => (
                        <View key={appt._id} style={styles.apptRow}>
                          <Text style={styles.apptText}>
                            📅 {new Date(appt.appointment_date).toLocaleDateString()} at {appt.appointment_time} — {appt.treatment} ({appt.status})
                          </Text>
                        </View>
                      ))
                    )}
                  </Card>

                  {/* Clinical Progress Notes & Logger */}
                  <Card style={styles.chartCard}>
                    <Text style={styles.chartSectionTitle}>✍️ Therapy Progress Notes ({patientNotes.length})</Text>
                    {patientNotes.length === 0 ? (
                      <Text style={styles.emptyChartText}>No notes logged for this patient.</Text>
                    ) : (
                      patientNotes.map((note) => (
                        <View key={note._id} style={styles.noteRow}>
                          <Text style={styles.noteAuthor}>
                            {typeof note.authorId === 'object' ? `${note.authorId.full_name} (${note.authorId.role})` : 'Staff'}
                          </Text>
                          <Text style={styles.noteBody}>{note.note}</Text>
                        </View>
                      ))
                    )}

                    {/* Therapist Note Form */}
                    <View style={styles.addNoteBox}>
                      <Text style={styles.addNoteTitle}>Add Session Progress Note:</Text>
                      <Input
                        placeholder="Log patient response, pain reduction, mobility observations..."
                        value={noteText}
                        onChangeText={setNoteText}
                        multiline
                        numberOfLines={3}
                        style={{ height: 70, textAlignVertical: 'top' }}
                      />
                      <Button
                        title="Save Progress Note"
                        onPress={handleAddNote}
                        loading={savingNote}
                        size="small"
                        variant="primary"
                      />
                    </View>
                  </Card>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      )}
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
  patientCard: {
    marginVertical: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  patientName: {
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
  treatmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  doctorText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  footerRow: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'flex-end',
  },
  viewChartText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  modalSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    fontSize: 20,
    color: Colors.textMuted,
    padding: 4,
  },
  chartCard: {
    marginVertical: 4,
    backgroundColor: Colors.background,
  },
  chartSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  chartText: {
    fontSize: 13,
    color: Colors.text,
    marginBottom: 4,
  },
  remainingText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 8,
  },
  boxContainer: {
    backgroundColor: '#eff6ff',
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  boxContainerAlt: {
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
  emptyChartText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  apptRow: {
    marginBottom: 4,
  },
  apptText: {
    fontSize: 12,
    color: Colors.text,
  },
  noteRow: {
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  noteAuthor: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondary,
  },
  noteBody: {
    fontSize: 12,
    color: Colors.text,
    marginTop: 2,
  },
  addNoteBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  addNoteTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
});
