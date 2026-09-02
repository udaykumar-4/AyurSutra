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
import reportService, { PatientReportData } from '../../services/reportService';
import Colors from '../../constants/Colors';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Button from '../../components/Button';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorView from '../../components/ErrorView';

export default function PatientReportScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [reportData, setReportData] = useState<PatientReportData | null>(null);
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
    setError(null);
    try {
      const data = await reportService.getMyReport();
      setReportData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch medical health report.');
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

  const handleExportPDF = () => {
    Alert.alert(
      'Medical Summary Ready',
      `Full report summary for ${reportData?.user.full_name || 'Patient'} loaded.\nTotal Appointments: ${reportData?.appointments.length || 0}\nPrescriptions: ${reportData?.prescriptions.length || 0}`
    );
  };

  if (authLoading || (loading && !refreshing)) {
    return <LoadingScreen message="Aggregating Health Records..." />;
  }

  const patient = reportData?.user || user;
  const docName = patient?.assignedDoctor && typeof patient.assignedDoctor === 'object' ? patient.assignedDoctor.full_name : 'Assigned Doctor N/A';

  return (
    <View style={styles.container}>
      <Header title="My Medical Report" subtitle="Health Summary & Discharge Record" showLogout={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {error ? <ErrorView message={error} onRetry={fetchData} /> : null}

        {/* Action Header Banner */}
        <Card style={styles.bannerCard}>
          <View style={styles.bannerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>📄 Patient Health Report</Text>
              <Text style={styles.bannerSub}>Complete history of consultations, prescriptions, and notes.</Text>
            </View>
            <Button
              title="Export"
              onPress={handleExportPDF}
              size="small"
              variant="outline"
            />
          </View>
        </Card>

        {/* Section 1: Personal & Vitals */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>1. Personal & Vital Signs</Text>
          <View style={styles.gridContainer}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Full Name</Text>
              <Text style={styles.gridValue}>{patient?.full_name}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Email</Text>
              <Text style={styles.gridValue}>{patient?.email}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Age / Gender</Text>
              <Text style={styles.gridValue}>{patient?.age ? `${patient.age} yrs` : 'N/A'} • {patient?.gender || 'N/A'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Blood Group</Text>
              <Text style={styles.gridValue}>{patient?.bloodGroup || 'N/A'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Blood Pressure</Text>
              <Text style={styles.gridValue}>{patient?.bloodPressure || 'N/A'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Heart Rate</Text>
              <Text style={styles.gridValue}>{patient?.heartRate || 'N/A'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Weight</Text>
              <Text style={styles.gridValue}>{patient?.weight || 'N/A'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Temperature</Text>
              <Text style={styles.gridValue}>{patient?.temperature || 'N/A'}</Text>
            </View>
          </View>
        </Card>

        {/* Section 2: Assigned Care Team */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>2. Primary Care Physician</Text>
          <Text style={styles.careDocName}>👨‍⚕️ {docName}</Text>
        </Card>

        {/* Section 3: Prescriptions History */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>3. Panchakarma Prescriptions ({reportData?.prescriptions.length || 0})</Text>

          {!reportData?.prescriptions || reportData.prescriptions.length === 0 ? (
            <Text style={styles.emptyText}>No prescription history found.</Text>
          ) : (
            reportData.prescriptions.map((rx) => (
              <View key={rx._id} style={styles.historyRow}>
                <View style={styles.rowTop}>
                  <Text style={styles.rowTitle}>💊 {rx.treatment}</Text>
                  <Text style={styles.rowBadge}>{rx.status.toUpperCase()}</Text>
                </View>
                <Text style={styles.rowSub}>
                  Duration: {rx.duration} days ({rx.progressCompleted} completed)
                </Text>
                {rx.notes ? <Text style={styles.rowNotes}>Doctor Notes: {rx.notes}</Text> : null}
              </View>
            ))
          )}
        </Card>

        {/* Section 4: Appointments History */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>4. Consultations & Sessions ({reportData?.appointments.length || 0})</Text>

          {!reportData?.appointments || reportData.appointments.length === 0 ? (
            <Text style={styles.emptyText}>No appointment history found.</Text>
          ) : (
            reportData.appointments.map((appt) => (
              <View key={appt._id} style={styles.historyRow}>
                <View style={styles.rowTop}>
                  <Text style={styles.rowTitle}>🌿 {appt.treatment}</Text>
                  <Text style={styles.rowBadge}>{appt.status.toUpperCase()}</Text>
                </View>
                <Text style={styles.rowSub}>
                  📅 {new Date(appt.appointment_date).toLocaleDateString()} at {appt.appointment_time}
                </Text>
              </View>
            ))
          )}
        </Card>

        {/* Section 5: Clinical Notes History */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>5. Clinical Progress Notes ({reportData?.notes.length || 0})</Text>

          {!reportData?.notes || reportData.notes.length === 0 ? (
            <Text style={styles.emptyText}>No clinical notes recorded.</Text>
          ) : (
            reportData.notes.map((note) => (
              <View key={note._id} style={styles.historyRow}>
                <Text style={styles.noteAuthor}>
                  ✍️ {typeof note.authorId === 'object' ? `${note.authorId.full_name} (${note.authorId.role})` : 'Author'}
                </Text>
                <Text style={styles.noteBody}>{note.note}</Text>
              </View>
            ))
          )}
        </Card>
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
  bannerCard: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
  },
  bannerSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionCard: {
    marginVertical: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: '50%',
    marginBottom: 10,
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
  careDocName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  historyRow: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  rowBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rowSub: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  rowNotes: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  noteAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 2,
  },
  noteBody: {
    fontSize: 13,
    color: Colors.text,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
});
