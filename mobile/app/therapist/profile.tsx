import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import feedbackService from '../../services/feedbackService';
import userService from '../../services/userService';
import { Feedback } from '../../types/feedback';
import { BlockedSlot } from '../../types/user';
import Colors from '../../constants/Colors';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorView from '../../components/ErrorView';

export default function TherapistProfileScreen() {
  const { user, isLoading: authLoading, updateUserInContext, logout } = useAuth();
  const router = useRouter();

  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'feedback' | 'slots' | 'profile'>('feedback');

  // Slot blocker state
  const [blockDate, setBlockDate] = useState('2026-08-22');
  const [blockTime, setBlockTime] = useState('11:00');
  const [blocking, setBlocking] = useState(false);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  // Profile Editor state
  const [designation, setDesignation] = useState(user?.designation || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Protected Route Check
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'therapist')) {
      router.replace('/login');
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    setError(null);
    try {
      const fbData = await feedbackService.getTherapistFeedback();
      setFeedbackList(fbData);
    } catch (err: any) {
      setError(err.message || 'Failed to load therapist reviews.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'therapist') {
      fetchData();
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleBlockSlot = async () => {
    if (!blockDate || !blockTime) {
      Alert.alert('Validation Error', 'Please enter date and time to block.');
      return;
    }

    setBlocking(true);
    try {
      const updatedUser = await userService.blockSlot({ date: blockDate, time: blockTime });
      updateUserInContext(updatedUser);
      Alert.alert('Slot Blocked', `Time slot ${blockDate} at ${blockTime} blocked.`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to block time slot.');
    } finally {
      setBlocking(false);
    }
  };

  const handleUnblockSlot = async (slotId?: string) => {
    if (!slotId) return;
    setUnblockingId(slotId);
    try {
      const updatedUser = await userService.unblockSlot(slotId);
      updateUserInContext(updatedUser);
      Alert.alert('Slot Unblocked', 'Time slot restored.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to unblock slot.');
    } finally {
      setUnblockingId(null);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const updated = await userService.updateProfile({
        designation: designation.trim(),
        phone: phone.trim(),
      });
      updateUserInContext(updated);
      Alert.alert('Profile Saved', 'Your therapist profile settings have been updated.');
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  if (authLoading || (loading && !refreshing)) {
    return <LoadingScreen message="Loading Therapist Portal..." />;
  }

  const blockedSlots: BlockedSlot[] = user?.blockedSlots || [];

  return (
    <View style={styles.container}>
      <Header title="Therapist Profile" subtitle="Account & Availability Settings" showLogout={true} />

      {/* Segmented Control Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'feedback' && styles.activeTabItem]}
          onPress={() => setActiveTab('feedback')}
        >
          <Text style={[styles.tabText, activeTab === 'feedback' && styles.activeTabText]}>
            Reviews ({feedbackList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'slots' && styles.activeTabItem]}
          onPress={() => setActiveTab('slots')}
        >
          <Text style={[styles.tabText, activeTab === 'slots' && styles.activeTabText]}>
            Availability ({blockedSlots.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'profile' && styles.activeTabItem]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.accent]} />}
      >
        {error ? <ErrorView message={error} onRetry={fetchData} /> : null}

        {activeTab === 'feedback' ? (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Patient Reviews & Session Ratings</Text>
            </View>

            {feedbackList.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>⭐</Text>
                <Text style={styles.emptyTitle}>No Therapist Reviews Yet</Text>
                <Text style={styles.emptyDesc}>Patient reviews submitted for your Panchakarma sessions will appear here.</Text>
              </Card>
            ) : (
              feedbackList.map((fb) => (
                <Card key={fb._id} style={styles.fbCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.patientName}>
                      👤 {typeof fb.patientId === 'object' ? fb.patientId.full_name : 'Patient'}
                    </Text>
                    <Text style={styles.ratingBadge}>★ {fb.therapistRating || fb.overallRating} / 5</Text>
                  </View>

                  {fb.therapistFeedback ? (
                    <Text style={styles.fbText}>"{fb.therapistFeedback}"</Text>
                  ) : fb.overallFeedback ? (
                    <Text style={styles.fbText}>"{fb.overallFeedback}"</Text>
                  ) : null}

                  {fb.createdAt && (
                    <Text style={styles.dateText}>
                      Logged on {new Date(fb.createdAt).toLocaleDateString()}
                    </Text>
                  )}
                </Card>
              ))
            )}
          </View>
        ) : activeTab === 'slots' ? (
          <View>
            <Card style={styles.slotCard}>
              <Text style={styles.cardTitle}>🚫 Block Therapy Time Slot</Text>
              <Text style={styles.cardSub}>Restricts scheduling during your personal unavailable hours.</Text>

              <Input
                label="Date to Block (YYYY-MM-DD)"
                placeholder="2026-08-22"
                value={blockDate}
                onChangeText={setBlockDate}
              />

              <Input
                label="Time to Block (HH:MM)"
                placeholder="11:00"
                value={blockTime}
                onChangeText={setBlockTime}
              />

              <Button
                title="Block Time Slot"
                onPress={handleBlockSlot}
                loading={blocking}
                variant="danger"
                style={{ marginTop: 8 }}
              />
            </Card>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Blocked Slots ({blockedSlots.length})</Text>
            </View>

            {blockedSlots.length === 0 ? (
              <Card style={styles.subCard}>
                <Text style={styles.emptyText}>No time slots currently blocked.</Text>
              </Card>
            ) : (
              blockedSlots.map((slot) => (
                <Card key={slot._id || slot.time} style={styles.slotItemCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.slotText}>
                      📅 {new Date(slot.date).toLocaleDateString()} at {slot.time}
                    </Text>
                    {slot._id && (
                      <Button
                        title="Unblock"
                        onPress={() => handleUnblockSlot(slot._id)}
                        loading={unblockingId === slot._id}
                        size="small"
                        variant="outline"
                      />
                    )}
                  </View>
                </Card>
              ))
            )}
          </View>
        ) : (
          <View>
            <Card style={styles.profileCard}>
              <Text style={styles.cardTitle}>🧘 Therapist Profile Settings</Text>

              <Input
                label="Full Name (Read-only)"
                value={user?.full_name}
                editable={false}
                style={{ backgroundColor: Colors.background }}
              />

              <Input
                label="Therapist Title / Designation"
                placeholder="Certified Panchakarma Therapist"
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
                loading={savingProfile}
                style={{ marginTop: 10 }}
              />
            </Card>

            <Card style={styles.profileCard}>
              <Text style={styles.cardTitle}>⚙️ Account Session</Text>
              <Button
                title="Sign Out of Therapist Portal"
                onPress={logout}
                variant="danger"
                size="medium"
              />
            </Card>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: Colors.background,
    marginRight: 6,
  },
  activeTabItem: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.white,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 24,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  fbCard: {
    backgroundColor: '#fffbe6',
    borderColor: '#ffe58f',
    marginVertical: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  ratingBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.warning,
  },
  fbText: {
    fontSize: 13,
    color: Colors.text,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  slotCard: {
    marginVertical: 6,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 14,
  },
  subCard: {
    padding: 12,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  slotItemCard: {
    marginVertical: 4,
  },
  slotText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  profileCard: {
    marginVertical: 6,
  },
});
