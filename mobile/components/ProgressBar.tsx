import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Colors from '../constants/Colors';

interface ProgressBarProps {
  progress: number; // 0 to 1 or percentage (0 to 100)
  label?: string;
  showPercentage?: boolean;
  color?: string;
  height?: number;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  showPercentage = true,
  color = Colors.accent,
  height = 10,
  style,
}) => {
  // Normalize progress to 0 - 100
  const percentage = Math.min(100, Math.max(0, progress <= 1 ? progress * 100 : progress));

  return (
    <View style={[styles.container, style]}>
      {(label || showPercentage) && (
        <View style={styles.header}>
          {label ? <Text style={styles.label}>{label}</Text> : <View />}
          {showPercentage && <Text style={styles.percentage}>{Math.round(percentage)}%</Text>}
        </View>
      )}
      <View style={[styles.track, { height }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${percentage}%`,
              backgroundColor: color,
              height,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  percentage: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  track: {
    backgroundColor: Colors.border,
    borderRadius: 8,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    borderRadius: 8,
  },
});

export default ProgressBar;
