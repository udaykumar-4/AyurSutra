import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../constants/Colors';
import Input from './Input';
import Button from './Button';
import Card from './Card';
import patientTreatmentRecommendationService from '../services/patientTreatmentRecommendationService';
import { PatientTreatmentRecommendationResponse } from '../types/patientTreatmentRecommendation';

interface PatientTreatmentRecommendationModalProps {
  visible: boolean;
  onClose: () => void;
  patientName?: string;
}

const QUICK_OPTIONS = [
  'Joint Stiffness & Pain',
  'Stress & Difficulty Relaxing',
  'Digestive Sluggishness',
  'Fatigue & Low Energy',
  'Sleep Difficulty',
  'General Wellness',
];

export const PatientTreatmentRecommendationModal: React.FC<PatientTreatmentRecommendationModalProps> = ({
  visible,
  onClose,
  patientName,
}) => {
  const router = useRouter();

  const [symptoms, setSymptoms] = useState('');
  const [selectedQuickOptions, setSelectedQuickOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PatientTreatmentRecommendationResponse | null>(null);

  const toggleQuickOption = (option: string) => {
    if (selectedQuickOptions.includes(option)) {
      setSelectedQuickOptions(selectedQuickOptions.filter(o => o !== option));
    } else {
      setSelectedQuickOptions([...selectedQuickOptions, option]);
    }
  };

  const handleGenerate = async () => {
    if (!symptoms.trim() && selectedQuickOptions.length === 0) {
      setError('Please select at least one quick symptom option or enter your concerns.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await patientTreatmentRecommendationService.generateRecommendation(
        symptoms.trim(),
        selectedQuickOptions
      );
      setResult(response);
    } catch (err: any) {
      setError(err.message || 'AI Treatment Recommendations are temporarily unavailable. Please consult your clinician.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookConsultation = () => {
    onClose();
    // Phase 5 Navigation Adapter: Opens existing appointment booking flow cleanly
    router.push('/patient/appointments');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.headerIcon}>🌿</Text>
            <View style={styles.headerTextContainer}>
              <Text style={styles.modalTitle}>🌿 AI Treatment Recommendations</Text>
              <Text style={styles.modalSubtitle}>Personalized Ayurvedic Therapy Guidance</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Safety Notice */}
            <View style={styles.safetyNoticeCard}>
              <Text style={styles.safetyNoticeTitle}>ℹ️ EDUCATIONAL GUIDANCE ONLY</Text>
              <Text style={styles.safetyNoticeText}>
                Based on the symptoms you enter, the following Ayurvedic therapies may be relevant for educational consideration. This tool does not diagnose conditions or prescribe treatments.
              </Text>
            </View>

            {error && (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            )}

            {/* Quick Symptom Chips */}
            <Text style={styles.sectionLabel}>Quick Symptom Options</Text>
            <View style={styles.chipsContainer}>
              {QUICK_OPTIONS.map((option) => {
                const isSelected = selectedQuickOptions.includes(option);
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => toggleQuickOption(option)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {isSelected ? '✓ ' : '+ '}{option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Free-text symptoms */}
            <Input
              label="Additional Health Concerns / Symptoms"
              placeholder="e.g., Lower back stiffness in morning, feeling cold easily..."
              value={symptoms}
              onChangeText={setSymptoms}
              multiline
              numberOfLines={3}
            />

            <Button
              title="🌿 Generate Recommendations"
              onPress={handleGenerate}
              loading={loading}
              style={styles.generateBtn}
            />

            {/* Render Emergency Alert if detected */}
            {result && result.isEmergency && (
              <View style={styles.emergencyCard}>
                <Text style={styles.emergencyTitle}>🚨 IMMEDIATE MEDICAL ATTENTION REQUIRED</Text>
                <Text style={styles.emergencyText}>{result.emergencyNotice}</Text>
              </View>
            )}

            {/* Render Refusal Message if prohibited request */}
            {result && result.isProhibited && (
              <View style={styles.prohibitedCard}>
                <Text style={styles.prohibitedTitle}>ℹ️ CLINICAL ADVISORY</Text>
                <Text style={styles.prohibitedText}>{result.refusalMessage}</Text>
              </View>
            )}

            {/* Render Recommendations List */}
            {result && result.success && result.recommendations && result.recommendations.length > 0 && (
              <View style={styles.resultsContainer}>
                {result.educationalWording ? (
                  <Text style={styles.educationalWordingText}>{result.educationalWording}</Text>
                ) : null}

                {/* Safety Warnings */}
                {result.safetyWarnings && result.safetyWarnings.length > 0 && (
                  <View style={styles.warningBox}>
                    <Text style={styles.warningTitle}>⚡ Precautionary Warnings</Text>
                    {result.safetyWarnings.map((warn, idx) => (
                      <Text key={idx} style={styles.warningItem}>• {warn}</Text>
                    ))}
                  </View>
                )}

                {/* Therapy Recommendation Cards */}
                {result.recommendations.map((rec, idx) => (
                  <Card key={idx} style={styles.recommendationCard}>
                    <View style={styles.recHeaderRow}>
                      <Text style={styles.recTitle}>🌿 {rec.therapyName}</Text>
                      <Text style={styles.recCategoryBadge}>{rec.category}</Text>
                    </View>

                    <Text style={styles.recDetail}>
                      <Text style={styles.boldLabel}>Educational Objective:</Text> {rec.objective}
                    </Text>

                    <Text style={styles.recDetail}>
                      <Text style={styles.boldLabel}>Traditional Rationale:</Text> {rec.traditionalRationale}
                    </Text>

                    {rec.suggestedDuration ? (
                      <Text style={styles.recDetail}>
                        <Text style={styles.boldLabel}>Suggested Duration:</Text> {rec.suggestedDuration} ({rec.suggestedSessions})
                      </Text>
                    ) : null}

                    {rec.precautions && rec.precautions.length > 0 ? (
                      <View style={styles.listSection}>
                        <Text style={styles.boldLabel}>Precautions:</Text>
                        {rec.precautions.map((p, i) => (
                          <Text key={i} style={styles.listItem}>• {p}</Text>
                        ))}
                      </View>
                    ) : null}

                    {rec.contraindications && rec.contraindications.length > 0 ? (
                      <View style={styles.listSection}>
                        <Text style={styles.boldLabel}>Contraindications:</Text>
                        {rec.contraindications.map((c, i) => (
                          <Text key={i} style={styles.listItemDanger}>• {c}</Text>
                        ))}
                      </View>
                    ) : null}

                    {/* Classical References */}
                    {rec.classicalReferences && rec.classicalReferences.length > 0 ? (
                      <View style={styles.referenceSection}>
                        <Text style={styles.boldLabel}>Classical Knowledge Reference:</Text>
                        {rec.classicalReferences.map((ref, i) => (
                          <Text key={i} style={styles.refText}>
                            📖 {ref.title} ({ref.source}) — {ref.evidenceLevel}
                          </Text>
                        ))}
                      </View>
                    ) : null}

                    <View style={styles.cardFooter}>
                      <Text style={styles.clinicianReviewText}>
                        ⚠ Clinician review required prior to treatment.
                      </Text>
                      <Button
                        title="Book Consultation"
                        onPress={handleBookConsultation}
                        size="small"
                        style={styles.bookBtn}
                      />
                    </View>
                  </Card>
                ))}

                {result.disclaimer ? (
                  <Text style={styles.disclaimerText}>{result.disclaimer}</Text>
                ) : null}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  headerTextContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  safetyNoticeCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  safetyNoticeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 4,
  },
  safetyNoticeText: {
    fontSize: 12,
    color: '#2E7D32',
    lineHeight: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  chip: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  chipTextSelected: {
    color: Colors.white,
  },
  generateBtn: {
    marginTop: 8,
    marginBottom: 16,
  },
  errorCard: {
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '600',
  },
  emergencyCard: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 5,
    borderLeftColor: Colors.error,
  },
  emergencyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.error,
    marginBottom: 6,
  },
  emergencyText: {
    fontSize: 13,
    color: '#C62828',
    lineHeight: 18,
  },
  prohibitedCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  prohibitedTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.warning,
    marginBottom: 4,
  },
  prohibitedText: {
    fontSize: 12,
    color: '#E65100',
    lineHeight: 16,
  },
  resultsContainer: {
    marginTop: 8,
  },
  educationalWordingText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  warningBox: {
    backgroundColor: '#FFF8E1',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  warningTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F57F17',
    marginBottom: 4,
  },
  warningItem: {
    fontSize: 12,
    color: '#F57F17',
    marginBottom: 2,
  },
  recommendationCard: {
    marginBottom: 16,
    borderColor: Colors.border,
  },
  recHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
    flex: 1,
  },
  recCategoryBadge: {
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: '#E8F5E9',
    color: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recDetail: {
    fontSize: 13,
    color: Colors.text,
    marginBottom: 6,
    lineHeight: 18,
  },
  boldLabel: {
    fontWeight: '700',
    color: Colors.text,
  },
  listSection: {
    marginTop: 4,
    marginBottom: 6,
  },
  listItem: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 8,
    marginTop: 2,
  },
  listItemDanger: {
    fontSize: 12,
    color: Colors.error,
    marginLeft: 8,
    marginTop: 2,
  },
  referenceSection: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  refText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clinicianReviewText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.warning,
    flex: 1,
    marginRight: 8,
  },
  bookBtn: {
    backgroundColor: Colors.accent,
  },
  disclaimerText: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default PatientTreatmentRecommendationModal;
