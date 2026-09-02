import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import Colors from '../constants/Colors';
import Card from './Card';
import ProgressBar from './ProgressBar';
import analyticsService, { OutcomeAnalyticsData } from '../services/analyticsService';
import { UserRole } from '../types/user';

interface OutcomeAnalyticsCardProps {
  role: UserRole;
  patientId?: string;
  doctorId?: string;
  therapistId?: string;
}

export const OutcomeAnalyticsCard: React.FC<OutcomeAnalyticsCardProps> = ({
  role,
  patientId,
  doctorId,
  therapistId,
}) => {
  const [data, setData] = useState<OutcomeAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      let result: OutcomeAnalyticsData;
      if (role === 'admin') {
        result = await analyticsService.getGlobalOutcomes();
      } else if (role === 'doctor') {
        result = await analyticsService.getDoctorOutcomes(doctorId);
      } else if (role === 'therapist') {
        result = await analyticsService.getTherapistOutcomes(therapistId);
      } else {
        result = await analyticsService.getPatientOutcomes(patientId);
      }
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load outcome analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [role, patientId, doctorId, therapistId]);

  if (loading) {
    return (
      <Card style={styles.card}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>Calculating Outcome Analytics...</Text>
        </View>
      </Card>
    );
  }

  if (error) {
    return (
      <Card style={styles.card}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchAnalytics}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card style={styles.card}>
        <Text style={styles.emptyText}>No analytics data available yet.</Text>
      </Card>
    );
  }

  const { operational, adherence, patientReported, clinical } = data;

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.titleIcon}>📊</Text>
        <View style={styles.titleContainer}>
          <Text style={styles.cardTitle}>Outcome Analytics Dashboard</Text>
          <Text style={styles.cardSubtitle}>
            {role === 'admin'
              ? 'Clinic-Wide Operational & Clinical Outcomes'
              : role === 'doctor'
              ? 'Assigned Patient Consultation & Treatment Outcomes'
              : role === 'therapist'
              ? 'Panchakarma Therapy Adherence & Progress'
              : 'Personal Recovery & Session Completion Progress'}
          </Text>
        </View>
      </View>

      {/* 1. Operational Metrics */}
      {operational && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Operational Performance</Text>
          <View style={styles.grid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{operational.totalAppointments}</Text>
              <Text style={styles.metricLabel}>Total Sessions</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: Colors.success }]}>
                {operational.completedAppointments}
              </Text>
              <Text style={styles.metricLabel}>Completed</Text>
            </View>
            {operational.completionRate !== undefined && (
              <View style={styles.metricItem}>
                <Text style={[styles.metricValue, { color: Colors.primary }]}>
                  {operational.completionRate}%
                </Text>
                <Text style={styles.metricLabel}>Completion Rate</Text>
              </View>
            )}
          </View>

          {role === 'admin' && operational.totalRevenueCollected !== undefined && (
            <View style={styles.financialRow}>
              <Text style={styles.finLabel}>
                Revenue Collected: <Text style={styles.finValue}>₹{operational.totalRevenueCollected}</Text>
              </Text>
              <Text style={styles.finLabel}>
                Pending Receivables: <Text style={[styles.finValue, { color: Colors.warning }]}>₹{operational.pendingReceivables}</Text>
              </Text>
            </View>
          )}
        </View>
      )}

      {/* 2. Treatment Adherence & Progress */}
      {adherence && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Treatment Adherence & Progress</Text>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Session Completion Adherence</Text>
            <Text style={styles.progressValue}>{adherence.adherenceRate}%</Text>
          </View>
          <ProgressBar progress={adherence.adherenceRate} />

          <View style={styles.adherenceStatsRow}>
            <Text style={styles.adherenceSub}>
              Sessions: {adherence.totalCompletedSessions} / {adherence.totalPrescribedSessions} completed
            </Text>
            <Text style={styles.adherenceSub}>
              Plans: {adherence.completedPrescriptions} completed
            </Text>
          </View>
        </View>
      )}

      {/* 3. Patient-Reported Outcomes */}
      {patientReported && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Patient-Reported Outcomes</Text>
          <View style={styles.grid}>
            {patientReported.avgOverallRating !== undefined && patientReported.avgOverallRating > 0 && (
              <View style={styles.metricItem}>
                <Text style={[styles.metricValue, { color: '#f39c12' }]}>
                  {patientReported.avgOverallRating} ★
                </Text>
                <Text style={styles.metricLabel}>Overall Satisfaction</Text>
              </View>
            )}
            {patientReported.avgDoctorRating !== undefined && patientReported.avgDoctorRating > 0 && (
              <View style={styles.metricItem}>
                <Text style={[styles.metricValue, { color: Colors.primary }]}>
                  {patientReported.avgDoctorRating} ★
                </Text>
                <Text style={styles.metricLabel}>Doctor Rating</Text>
              </View>
            )}
            {patientReported.avgTherapistRating !== undefined && patientReported.avgTherapistRating > 0 && (
              <View style={styles.metricItem}>
                <Text style={[styles.metricValue, { color: Colors.secondary }]}>
                  {patientReported.avgTherapistRating} ★
                </Text>
                <Text style={styles.metricLabel}>Therapist Rating</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* 4. Clinical Vitals Outcomes (Only rendered if empirical DB vitals exist) */}
      {clinical && clinical.hasVitalsData && clinical.vitals && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Recorded Clinical Vitals</Text>
          <View style={styles.vitalsGrid}>
            {clinical.vitals.bloodPressure && (
              <View style={styles.vitalChip}>
                <Text style={styles.vitalLabel}>Blood Pressure</Text>
                <Text style={styles.vitalVal}>{clinical.vitals.bloodPressure}</Text>
              </View>
            )}
            {clinical.vitals.heartRate && (
              <View style={styles.vitalChip}>
                <Text style={styles.vitalLabel}>Heart Rate</Text>
                <Text style={styles.vitalVal}>{clinical.vitals.heartRate} bpm</Text>
              </View>
            )}
            {clinical.vitals.weight && (
              <View style={styles.vitalChip}>
                <Text style={styles.vitalLabel}>Weight</Text>
                <Text style={styles.vitalVal}>{clinical.vitals.weight} kg</Text>
              </View>
            )}
            {clinical.vitals.temperature && (
              <View style={styles.vitalChip}>
                <Text style={styles.vitalLabel}>Temperature</Text>
                <Text style={styles.vitalVal}>{clinical.vitals.temperature} °F</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 10,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleIcon: {
    fontSize: 26,
    marginRight: 10,
  },
  titleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  metricItem: {
    alignItems: 'center',
    minWidth: 80,
    padding: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  financialRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border + '60',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  finLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  finValue: {
    fontWeight: '700',
    color: Colors.success,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  adherenceStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  adherenceSub: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vitalChip: {
    backgroundColor: Colors.primary + '12',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    minWidth: 100,
  },
  vitalLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  vitalVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 2,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 10,
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  retryText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    padding: 16,
  },
});

export default OutcomeAnalyticsCard;
