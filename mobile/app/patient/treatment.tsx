import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import prescriptionService from '../../services/prescriptionService';
import noteService from '../../services/noteService';
import { Prescription } from '../../types/prescription';
import { Note } from '../../types/note';
import Colors from '../../constants/Colors';
import Header from '../../components/Header';
import Card from '../../components/Card';
import ProgressBar from '../../components/ProgressBar';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorView from '../../components/ErrorView';

export default function PatientTreatmentScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const [rxData, notesData] = await Promise.all([
        prescriptionService.getByPatientId(user._id),
        noteService.getNotesForPatient(user._id),
      ]);
      setPrescriptions(rxData);
      setNotes(notesData);
    } catch (err: any) {
      setError(err.message || 'Failed to load treatment plan.');
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

  if (authLoading || (loading && !refreshing)) {
    return <LoadingScreen message="Loading Treatment Plan..." />;
  }

  const activeRx = prescriptions.find((p) => p.status === 'in-progress') || prescriptions[0];

  return (
    <View style={styles.container}>
      <Header title="Treatment Plan" subtitle="Panchakarma Protocol & Session Tracking" showLogout={false} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {error ? <ErrorView message={error} onRetry={fetchData} /> : null}

        {activeRx ? (
          <View>
            {/* Active Plan Card */}
            <Card style={styles.planCard}>
              <View style={styles.badgeRow}>
                <Text style={styles.rxBadge}>ACTIVE PROTOCOL</Text>
                <Text style={[styles.statusBadge, { backgroundColor: activeRx.status === 'completed' ? Colors.successBg : Colors.warningBg, color: activeRx.status === 'completed' ? Colors.success : Colors.warning }]}>
                  {activeRx.status.toUpperCase()}
                </Text>
              </View>

              <Text style={styles.treatmentTitle}>{activeRx.treatment}</Text>

              <ProgressBar
                progress={activeRx.duration > 0 ? (activeRx.progressCompleted / activeRx.duration) * 100 : 0}
                label={`Progress (${activeRx.progressCompleted} / ${activeRx.duration} sessions)`}
                color={Colors.accent}
                height={12}
                style={{ marginVertical: 12 }}
              />

              <View style={styles.gridInfo}>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>👨‍⚕️ Prescribing Doctor</Text>
                  <Text style={styles.gridValue}>
                    {typeof activeRx.doctorId === 'object' ? activeRx.doctorId.full_name : 'Doctor'}
                  </Text>
                </View>

                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>🧘 Assigned Therapist</Text>
                  <Text style={styles.gridValue}>
                    {typeof activeRx.therapistId === 'object' ? activeRx.therapistId.full_name : 'Therapist'}
                  </Text>
                </View>

                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>⏱️ Duration</Text>
                  <Text style={styles.gridValue}>{activeRx.duration} Days / Sessions</Text>
                </View>

                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>📊 Completed</Text>
                  <Text style={styles.gridValue}>{activeRx.progressCompleted} Sessions Done</Text>
                </View>
              </View>

              {activeRx.plan ? (
                <View style={styles.protocolBox}>
                  <Text style={styles.boxTitle}>Detailed Protocol Plan:</Text>
                  <Text style={styles.boxText}>{activeRx.plan}</Text>
                </View>
              ) : null}

              {activeRx.notes ? (
                <View style={styles.notesBox}>
                  <Text style={styles.boxTitle}>Doctor's Instructions & Dietary Advice:</Text>
                  <Text style={styles.boxText}>{activeRx.notes}</Text>
                </View>
              ) : null}
            </Card>

            {/* Clinical Progress Notes History */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Session & Clinical Notes</Text>
            </View>

            {notes.length === 0 ? (
              <Card style={styles.subCard}>
                <Text style={styles.emptyNotesText}>No clinical progress notes logged yet.</Text>
              </Card>
            ) : (
              notes.map((noteItem) => (
                <Card key={noteItem._id} style={styles.noteCard}>
                  <View style={styles.noteHeader}>
                    <Text style={styles.authorText}>
                      ✍️ {typeof noteItem.authorId === 'object' ? `${noteItem.authorId.full_name} (${noteItem.authorId.role.toUpperCase()})` : 'Medical Staff'}
                    </Text>
                    {noteItem.createdAt && (
                      <Text style={styles.dateText}>
                        {new Date(noteItem.createdAt).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.noteContent}>{noteItem.note}</Text>
                </Card>
              ))
            )}
          </View>
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🌿</Text>
            <Text style={styles.emptyTitle}>No Active Treatment Plan</Text>
            <Text style={styles.emptyDesc}>You currently do not have an active Panchakarma prescription plan assigned.</Text>
          </Card>
        )}
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
  planCard: {
    backgroundColor: Colors.white,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rxBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  treatmentTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  gridInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  gridItem: {
    width: '50%',
    marginBottom: 12,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  gridValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  protocolBox: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  notesBox: {
    backgroundColor: '#fffbe6',
    borderColor: '#ffe58f',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  boxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  boxText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  subCard: {
    padding: 14,
  },
  emptyNotesText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  noteCard: {
    marginVertical: 4,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  authorText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  dateText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  noteContent: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
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
});
