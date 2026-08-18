import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import Colors from '../../constants/Colors';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';

export default function ReceptionistMoreScreen() {
  const { user, isLoading: authLoading, updateUserInContext, logout } = useAuth();
  const router = useRouter();

  const [designation, setDesignation] = useState(user?.designation || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  // Protected Route Check
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'receptionist')) {
      router.replace('/login');
    }
  }, [user, authLoading]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updated = await userService.updateProfile({
        designation: designation.trim(),
        phone: phone.trim(),
      });
      updateUserInContext(updated);
      Alert.alert('Profile Saved', 'Your receptionist profile details have been updated.');
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Front-Desk Settings" subtitle="Receptionist Profile & Account" showLogout={false} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Receptionist Profile Card */}
        <Card style={styles.profileCard}>
          <Text style={styles.cardTitle}>🏢 Desk Profile Settings</Text>

          <Input
            label="Full Name (Read-only)"
            value={user?.full_name}
            editable={false}
            style={{ backgroundColor: Colors.background }}
          />

          <Input
            label="Email Address (Read-only)"
            value={user?.email}
            editable={false}
            style={{ backgroundColor: Colors.background }}
          />

          <Input
            label="Desk Designation / Title"
            placeholder="Senior Front-Desk Executive"
            value={designation}
            onChangeText={setDesignation}
          />

          <Input
            label="Contact Phone"
            placeholder="+91 9876543210"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Button
            title="Save Profile Settings"
            onPress={handleSaveProfile}
            loading={saving}
            style={{ marginTop: 10 }}
          />
        </Card>

        {/* Account Controls */}
        <Card style={styles.profileCard}>
          <Text style={styles.cardTitle}>⚙️ Account Session</Text>
          <Button
            title="Sign Out of Receptionist Desk"
            onPress={logout}
            variant="danger"
            size="medium"
          />
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    marginVertical: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
});
