import React, { ReactNode, useEffect, useRef } from 'react';
import { StyleSheet, ViewStyle, Animated } from 'react-native';
import Colors from '../constants/Colors';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  animate?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, style, animate = false }) => {
  const fadeAnim = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const translateYAnim = useRef(new Animated.Value(animate ? 12 : 0)).current;

  useEffect(() => {
    if (animate) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [animate]);

  return (
    <Animated.View
      style={[
        styles.card,
        style,
        animate && { opacity: fadeAnim, transform: [{ translateY: translateYAnim }] },
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 20,
    padding: 18,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.glassBorderSubtle,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
});

export default Card;
