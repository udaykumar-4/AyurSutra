import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/LoadingScreen';
import Colors from '../constants/Colors';

export default function IndexScreen() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    // Role-Based Router Navigation
    switch (user.role) {
      case 'admin':
        router.replace('/admin');
        break;
      case 'doctor':
        router.replace('/doctor');
        break;
      case 'therapist':
        router.replace('/therapist');
        break;
      case 'receptionist':
        router.replace('/receptionist');
        break;
      case 'patient':
        router.replace('/patient');
        break;
      default:
        router.replace('/login');
        break;
    }
  }, [user, isLoading]);

  return (
    <View style={styles.container}>
      <Text style={styles.logoText}>🌿 AyurSutra</Text>
      <Text style={styles.subText}>Panchakarma Management System</Text>
      <LoadingScreen message="Restoring session..." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 4,
  },
  subText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 24,
  },
});
