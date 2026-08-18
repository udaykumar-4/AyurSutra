import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import Colors from '../constants/Colors';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="login/index" />
          <Stack.Screen name="admin/index" />
          <Stack.Screen name="doctor/index" />
          <Stack.Screen name="therapist/index" />
          <Stack.Screen name="patient/index" />
          <Stack.Screen name="receptionist/index" />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
