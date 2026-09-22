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
          <Stack.Screen name="admin" />
          <Stack.Screen name="doctor" />
          <Stack.Screen name="therapist" />
          <Stack.Screen name="patient" />
          <Stack.Screen name="receptionist" />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
