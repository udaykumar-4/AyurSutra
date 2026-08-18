import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Colors from '../constants/Colors';
import Input from './Input';
import Button from './Button';
import Card from './Card';
import aiService, { DiseasePredictionResponse } from '../services/aiService';

interface DiseasePredictionModalProps {
  visible: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  patientCondition?: string;
}

export const DiseasePredictionModal: React.FC<DiseasePredictionModalProps> = ({
  visible,
  onClose,
  patientId,
  patientName,
  patientCondition,
}) => {
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<DiseasePredictionResponse | null>(null);

  const handleGenerate = async () => {
    if (!patientId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await aiService.generateDiseasePrediction(patientId, symptoms);
      if (!result.success) {
        setError(result.message || 'AI Clinical Prediction Support is currently offline.');
      } else {
        setPrediction(result);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate disease prediction support.');
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
            <Text style={styles.headerIcon}>🔮</Text>
            <View style={styles.headerTextContainer}>
              <Text style={styles.modalTitle}>AI Disease Prediction Support</Text>
              <Text style={styles.modalSubtitle}>Patient: {patientName} • ID: #{patientId.slice(-6)}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Prominent Mandatory Safety Banner */}
          <View style={styles.safetyNoticeCard}>
            <Text style={styles.safetyNoticeTitle}>⚠️ NOT A CONFIRMED DIAGNOSIS</Text>
            <Text style={styles.safetyNoticeText}>
              Generated differential conditions are for physician review and evaluation. Final diagnostic authority rests 100% with the attending doctor.
            </Text>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {error && (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>❌ {error}</Text>
              </View>
            )}

            <Input
              label="Presenting Clinical Symptoms / Signs"
              placeholder="e.g. Joint pain, morning stiffness, dryness, digestive sluggishness"
              value={symptoms}
              onChangeText={setSymptoms}
            />

            <Button
              title="🔮 Generate Differential Guidance"
              onPress={handleGenerate}
              loading={loading}
              style={styles.generateBtn}
            />

            {prediction && prediction.success && (
              <View style={styles.resultsContainer}>
                {/* Clinical Context */}
                {prediction.clinicalContext && (
                  <Card style={styles.contextCard}>
                    <Text style={styles.cardHeaderTitle}>📋 Verified Patient Context</Text>
                    <Text style={styles.contextDetail}>
                      Age: {prediction.clinicalContext.patientAge} • Sex: {prediction.clinicalContext.gender}
                    </Text>
                    <Text style={styles.contextDetail}>
                      Current Symptoms: {prediction.clinicalContext.presentingSymptoms}
                    </Text>
                  </Card>
                )}

                {/* Possible Differential Conditions */}
                <Text style={styles.optionsHeader}>Possible Differential Conditions ({prediction.possibleConditions?.length || 0})</Text>

                {prediction.possibleConditions?.map((cond, idx) => (
                  <Card key={idx} style={styles.optionCard}>
                    <View style={styles.optTitleRow}>
                      <Text style={styles.optNumber}>Category: {cond.probabilityCategory}</Text>
                      <Text style={styles.optName}>{cond.conditionName}</Text>
                    </View>

                    {cond.supportingFactors && cond.supportingFactors.length > 0 && (
                      <View style={{ marginTop: 4 }}>
                        <Text style={styles.boldLabel}>Supporting Factors:</Text>
                        {cond.supportingFactors.map((sf, i) => (
                          <Text key={i} style={styles.bulletItem}>• {sf}</Text>
                        ))}
                      </View>
                    )}

                    {cond.differentialConsiderations ? (
                      <Text style={styles.optDetail}>
                        <Text style={styles.boldLabel}>Differential Rule-Outs:</Text> {cond.differentialConsiderations}
                      </Text>
                    ) : null}
                  </Card>
                ))}

                {/* Uncertainty & Limitations */}
                {prediction.uncertainty && (
                  <Text style={styles.uncertaintyText}>
                    Certainty Assessment: {prediction.uncertainty}
                  </Text>
                )}

                {prediction.limitations && (
                  <View style={styles.limitationCard}>
                    <Text style={styles.limitationTitle}>📌 Diagnostic Limitations</Text>
                    <Text style={styles.limitationText}>{prediction.limitations}</Text>
                  </View>
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
  optionsHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 10,
  },
  optionCard: {
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary,
  },
  optTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  optNumber: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.secondary,
    backgroundColor: Colors.secondary + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  optName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
    flex: 1,
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
    fontSize: 12,
  },
  bulletItem: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginLeft: 6,
    marginTop: 2,
  },
  uncertaintyText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  limitationCard: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  limitationTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  limitationText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
});

export default DiseasePredictionModal;
