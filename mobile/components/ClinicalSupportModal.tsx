import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Colors from '../constants/Colors';
import Input from './Input';
import Button from './Button';
import Card from './Card';
import aiService, { TreatmentRecommendationResponse, SuggestedOption } from '../services/aiService';

interface ClinicalSupportModalProps {
  visible: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  patientCondition?: string;
}

export const ClinicalSupportModal: React.FC<ClinicalSupportModalProps> = ({
  visible,
  onClose,
  patientId,
  patientName,
  patientCondition,
}) => {
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<TreatmentRecommendationResponse | null>(null);

  const handleGenerate = async () => {
    if (!patientId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await aiService.generateTreatmentRecommendation(patientId, symptoms);
      if (!result.success) {
        setError(result.message || 'AI Clinical Decision Support is currently offline.');
      } else {
        setRecommendation(result);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate treatment recommendations.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.headerIcon}>🤖</Text>
            <View style={styles.headerTextContainer}>
              <Text style={styles.modalTitle}>AI Clinical Decision Support</Text>
              <Text style={styles.modalSubtitle}>Patient: {patientName} • ID: #{patientId.slice(-6)}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Prominent Mandatory Safety Banner */}
          <View style={styles.safetyNoticeCard}>
            <Text style={styles.safetyNoticeTitle}>⚠️ CLINICAL DECISION SUPPORT ONLY</Text>
            <Text style={styles.safetyNoticeText}>
              Generated treatment options are for physician review and evaluation. Final prescribing authority rests 100% with the attending doctor.
            </Text>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {error && (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>❌ {error}</Text>
              </View>
            )}

            <Input
              label="Presenting Clinical Symptoms / Notes"
              placeholder="e.g. Stiffness in lower back, aggravated in morning"
              value={symptoms}
              onChangeText={setSymptoms}
            />

            <Button
              title="🤖 Generate Treatment Options"
              onPress={handleGenerate}
              loading={loading}
              style={styles.generateBtn}
            />

            {recommendation && recommendation.success && (
              <View style={styles.resultsContainer}>
                {/* Clinical Context */}
                {recommendation.clinicalContext && (
                  <Card style={styles.contextCard}>
                    <Text style={styles.cardHeaderTitle}>📋 Verified Patient Context</Text>
                    <Text style={styles.contextDetail}>
                      Age: {recommendation.clinicalContext.patientAge} • Sex: {recommendation.clinicalContext.gender}
                    </Text>
                    <Text style={styles.contextDetail}>
                      Recorded Diagnosis: {recommendation.clinicalContext.recordedCondition}
                    </Text>
                    <Text style={styles.contextDetail}>
                      Allergies: {recommendation.clinicalContext.knownAllergies}
                    </Text>
                  </Card>
                )}

                {/* Contraindication Warnings */}
                {recommendation.contraindicationWarnings && recommendation.contraindicationWarnings.length > 0 && (
                  <View style={styles.warningBox}>
                    <Text style={styles.warningTitle}>⚡ Contraindication & Safety Warnings</Text>
                    {recommendation.contraindicationWarnings.map((warn, i) => (
                      <Text key={i} style={styles.warningItem}>• {warn}</Text>
                    ))}
                  </View>
                )}

                {/* Suggested Options */}
                <Text style={styles.optionsHeader}>Suggested Treatment Options ({recommendation.suggestedOptions?.length || 0})</Text>

                {recommendation.suggestedOptions?.map((opt, idx) => (
                  <Card key={idx} style={styles.optionCard}>
                    <View style={styles.optTitleRow}>
                      <Text style={styles.optNumber}>Option #{idx + 1}</Text>
                      <Text style={styles.optName}>{opt.treatmentName}</Text>
                    </View>

                    <Text style={styles.optDetail}>
                      <Text style={styles.boldLabel}>Suggested Duration:</Text> {opt.suggestedSessions} sessions
                    </Text>

                    <Text style={styles.optDetail}>
                      <Text style={styles.boldLabel}>Primary Objective:</Text> {opt.primaryObjective}
                    </Text>

                    <Text style={styles.optDetail}>
                      <Text style={styles.boldLabel}>Ayurvedic Rationale:</Text> {opt.rationale}
                    </Text>

                    {opt.considerations ? (
                      <Text style={styles.optDetail}>
                        <Text style={styles.boldLabel}>Clinical Considerations:</Text> {opt.considerations}
                      </Text>
                    ) : null}
                  </Card>
                ))}

                {/* Uncertainty */}
                {recommendation.uncertainty && (
                  <Text style={styles.uncertaintyText}>
                    Clinical Certainty Assessment: {recommendation.uncertainty}
                  </Text>
                )}
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
    maxHeight: '85%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerIcon: {
    fontSize: 26,
    marginRight: 10,
  },
  headerTextContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },
  modalSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  safetyNoticeCard: {
    backgroundColor: Colors.warningBg || '#fffbe6',
    borderColor: '#ffe58f',
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  safetyNoticeTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#d48806',
    marginBottom: 2,
  },
  safetyNoticeText: {
    fontSize: 11,
    color: Colors.text,
    lineHeight: 15,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  errorCard: {
    backgroundColor: Colors.errorBg,
    borderColor: Colors.error,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: '600',
  },
  generateBtn: {
    marginVertical: 10,
  },
  resultsContainer: {
    marginTop: 10,
  },
  contextCard: {
    backgroundColor: Colors.background,
    marginBottom: 12,
  },
  cardHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  contextDetail: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  warningBox: {
    backgroundColor: '#fff2f0',
    borderColor: '#ffccc7',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.error,
    marginBottom: 4,
  },
  warningItem: {
    fontSize: 11,
    color: Colors.error,
    marginTop: 1,
  },
  optionsHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 10,
  },
  optionCard: {
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  optTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  optNumber: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  optName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  optDetail: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 17,
  },
  boldLabel: {
    fontWeight: '700',
    color: Colors.text,
  },
  uncertaintyText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default ClinicalSupportModal;
