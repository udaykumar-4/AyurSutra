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
import smartSchedulingService, { RecommendedSlot } from '../services/smartSchedulingService';

interface SmartSchedulingModalProps {
  visible: boolean;
  onClose: () => void;
  staffId?: string;
  staffName?: string;
  onSelectSlot: (slotTime: string, slotDate: string) => void;
}

export const SmartSchedulingModal: React.FC<SmartSchedulingModalProps> = ({
  visible,
  onClose,
  staffId,
  staffName,
  onSelectSlot,
}) => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [preferredTime, setPreferredTime] = useState<string>('10:00 AM');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedSlot[]>([]);
  const [searched, setSearched] = useState<boolean>(false);

  const handleSearchSlots = async () => {
    if (!staffId) {
      setError('Please select a doctor or therapist to check available slots.');
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const result = await smartSchedulingService.getRecommendations(
        staffId,
        date,
        preferredTime
      );
      setRecommendations(result.recommendedSlots);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze staff schedule availability.');
    } finally {
      setLoading(false);
    }
  };

  const handleChooseSlot = (time: string) => {
    onSelectSlot(time, date);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.headerRow}>
            <Text style={styles.titleIcon}>⚡</Text>
            <View style={styles.titleTextContainer}>
              <Text style={styles.modalTitle}>Smart Slot Optimizer</Text>
              <Text style={styles.modalSubtitle}>
                {staffName ? `Optimizing schedule for ${staffName}` : 'Find non-conflicting optimal appointment slots'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>❌ {error}</Text>
              </View>
            )}

            <Input
              label="Preferred Date (YYYY-MM-DD)"
              placeholder="e.g. 2026-08-15"
              value={date}
              onChangeText={(text) => setDate(text)}
            />

            <Input
              label="Preferred Time (e.g. 10:00 AM)"
              placeholder="e.g. 10:00 AM"
              value={preferredTime}
              onChangeText={(text) => setPreferredTime(text)}
            />

            <Button
              title="⚡ Find Optimal Available Slots"
              onPress={handleSearchSlots}
              loading={loading}
              style={styles.searchBtn}
            />

            {searched && !loading && (
              <View style={styles.resultsContainer}>
                <Text style={styles.resultsHeader}>
                  Top Recommended Available Slots ({recommendations.length})
                </Text>

                {recommendations.length === 0 ? (
                  <Card style={styles.emptyCard}>
                    <Text style={styles.emptyText}>
                      No available slots found for this date. Staff member is fully booked or unavailable.
                    </Text>
                  </Card>
                ) : (
                  recommendations.map((slot, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.slotCard}
                      onPress={() => handleChooseSlot(slot.time)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.slotLeft}>
                        <Text style={styles.slotTime}>{slot.time}</Text>
                        <Text style={styles.slotRationale}>{slot.rationale}</Text>
                      </View>
                      <View style={styles.slotRight}>
                        <View style={styles.scoreBadge}>
                          <Text style={styles.scoreText}>{slot.score} pts</Text>
                        </View>
                        <Text style={styles.selectBtnText}>Select →</Text>
                      </View>
                    </TouchableOpacity>
                  ))
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
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  titleIcon: {
    fontSize: 26,
    marginRight: 10,
  },
  titleTextContainer: {
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
    padding: 6,
  },
  closeBtnText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  errorContainer: {
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
  searchBtn: {
    marginTop: 8,
    marginBottom: 16,
  },
  resultsContainer: {
    marginTop: 10,
  },
  resultsHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
  },
  emptyCard: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  slotCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  slotLeft: {
    flex: 1,
  },
  slotTime: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
  },
  slotRationale: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  slotRight: {
    alignItems: 'flex-end',
  },
  scoreBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  selectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondary,
  },
});

export default SmartSchedulingModal;
