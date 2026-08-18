import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '../constants/Colors';

interface RatingInputProps {
  label?: string;
  rating: number; // 1 to 5
  onRatingChange: (rating: number) => void;
}

export const RatingInput: React.FC<RatingInputProps> = ({
  label,
  rating,
  onRatingChange,
}) => {
  const stars = [1, 2, 3, 4, 5];

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.starRow}>
        {stars.map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onRatingChange(star)}
            activeOpacity={0.7}
            style={styles.starBtn}
          >
            <Text style={[styles.starText, star <= rating ? styles.filledStar : styles.emptyStar]}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.ratingValue}>{rating} / 5</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starBtn: {
    padding: 4,
    marginRight: 4,
  },
  starText: {
    fontSize: 28,
  },
  filledStar: {
    color: Colors.warning,
  },
  emptyStar: {
    color: Colors.border,
  },
  ratingValue: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
});

export default RatingInput;
