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
import prescriptionService from '../../services/prescriptionService';
import { Prescription } from '../../types/prescription';
import Colors from '../../constants/Colors';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Button from '../../components/Button';
import ProgressBar from '../../components/ProgressBar';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorView from '../../components/ErrorView';

export default function TherapistTreatmentsScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      const data = await prescriptionService.getByTherapistId(user._id);
      setPrescriptions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load treatment progress.');
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

  const handleIncrementSession = async (rx: Prescription) => {
    const nextProgress = rx.progressCompleted + 1;
    if (nextProgress > rx.duration) {
      Alert.alert('Protocol Complete', 'All prescribed sessions for this treatment have already been completed.');
      return;
    }

    setUpdatingId(rx._id);
    try {
      await prescriptionService.updateProgress(rx._id, nextProgress);
      if (nextProgress >= rx.duration) {
        Alert.alert('Treatment Completed! 🎉', `Panchakarma protocol "${rx.treatment}" marked as completed!`);
      } else {
        Alert.alert('Session Logged', `Progress updated: ${nextProgress} of ${rx.duration} sessions done.`);
      }
      fetchData();
    } catch (err: any) {
      Alert.alert('Update Error', err.message || 'Failed to update progress count.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (authLoading || (loading && !refreshing)) {
    return <LoadingScreen message="Loading Treatment Progress Logger..." />;
  }

  return (
    <View style={styles.container}>
      <Header title="Treatment Progress" subtitle="Panchakarma Session Logger" showLogout={false} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.accent]} />}
      >
        {error ? <ErrorView message={error} onRetry={fetchData} /> : null}

        {prescriptions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🌿</Text>
            <Text style={styles.emptyTitle}>No Treatments Assigned</Text>
            <Text style={styles.emptyDesc}>You currently have no Panchakarma treatments assigned for session execution.</Text>
          </Card>
        ) : (
          prescriptions.map((rx) => {
            const pName = typeof rx.patientId === 'object' ? rx.patientId.full_name : 'Patient';
            const docName = typeof rx.doctorId === 'object' ? rx.doctorId.full_name : 'Prescribing Doctor';
            const isFinished = rx.progressCompleted >= rx.duration;

            return (
              <Card key={rx._id} style={styles.rxCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.treatmentTitle}>🌿 {rx.treatment}</Text>
                  <Text style={[styles.statusBadge, { backgroundColor: isFinished ? Colors.successBg : Colors.warningBg, color: isFinished ? Colors.success : Colors.warning }]}>
                    {rx.status.toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.detailText}>👤 Patient: {pName}</Text>
                <Text style={styles.detailText}>👨‍⚕️ Prescribed By: {docName}</Text>

                <ProgressBar
                  progress={rx.duration > 0 ? (rx.progressCompleted / rx.duration) * 100 : 0}
                  label={`Progress: ${rx.progressCompleted} / ${rx.duration} sessions`}
                  color={isFinished ? Colors.success : Colors.accent}
                  height={12}
                  style={{ marginVertical: 10 }}
                />

                {rx.plan ? (
                  <View style={styles.planBox}>
                    <Text style={styles.boxTitle}>Doctor Protocol Plan:</Text>
                    <Text style={styles.boxText}>{rx.plan}</Text>
                  </View>
                ) : null}

                {/* Session Logger Action */}
                <View style={styles.actionRow}>
                  <Button
                    title={isFinished ? '✓ Protocol Completed' : '+ Log 1 Completed Session'}
                    onPress={() => handleIncrementSession(rx)}
                    loading={updatingId === rx._id}
                    disabled={isFinished}
                    variant={isFinished ? 'outline' : 'primary'}
                    size="medium"
                  />
                </View>
              </Card>
            );
          })
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
  treatmentTitle: {
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
  actionRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
