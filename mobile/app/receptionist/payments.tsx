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
import appointmentService from '../../services/appointmentService';
import { Appointment } from '../../types/appointment';
import Colors from '../../constants/Colors';
import Header from '../../components/Header';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import Button from '../../components/Button';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorView from '../../components/ErrorView';

export default function ReceptionistPaymentsScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'unpaid' | 'paid' | 'all'>('unpaid');

  // Protected Route Check
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'receptionist')) {
      router.replace('/login');
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    if (!user) return;
    setError(null);
    try {
      const data = await appointmentService.getAppointments();
      setAppointments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load billing records.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'receptionist') {
      fetchData();
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleTogglePayment = async (id: string, currentStatus: boolean) => {
    setUpdatingId(id);
    try {
      await appointmentService.updatePaymentStatus(id, !currentStatus);
      Alert.alert(
        'Billing Settled',
        `Payment marked as ${!currentStatus ? 'PAID' : 'UNPAID'}.`
      );
      fetchData();
    } catch (err: any) {
      Alert.alert('Payment Error', err.message || 'Failed to update payment status.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (authLoading || (loading && !refreshing)) {
    return <LoadingScreen message="Loading Billing & Cash Desk..." />;
  }

  // Calculate Billing Metrics
  const paidAppointments = appointments.filter((a) => a.isPaid);
  const unpaidAppointments = appointments.filter((a) => !a.isPaid && a.status !== 'cancelled');

  const totalPaidRevenue = paidAppointments.reduce((acc, a) => acc + (a.cost || 1500), 0);
  const totalPendingBilling = unpaidAppointments.reduce((acc, a) => acc + (a.cost || 1500), 0);

  const filteredItems = appointments.filter((a) => {
    if (filterTab === 'unpaid') return !a.isPaid && a.status !== 'cancelled';
    if (filterTab === 'paid') return a.isPaid;
    return a.status !== 'cancelled' || a.isPaid;
  });

  return (
    <View style={styles.container}>
      <Header title="Billing & Payments" subtitle="Collection & Receipts" showLogout={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {error ? <ErrorView message={error} onRetry={fetchData} /> : null}

        {/* Revenue Summary Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Collected Revenue"
            value={`₹${totalPaidRevenue}`}
            icon="💰"
            color={Colors.success}
          />
          <StatCard
            title="Pending Billing"
            value={`₹${totalPendingBilling}`}
            icon="⏳"
            color={Colors.warning}
          />
        </View>

        {/* Filter Segmented Control */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, filterTab === 'unpaid' && styles.activeTabItem]}
            onPress={() => setFilterTab('unpaid')}
          >
            <Text style={[styles.tabText, filterTab === 'unpaid' && styles.activeTabText]}>
              Unpaid ({unpaidAppointments.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, filterTab === 'paid' && styles.activeTabItem]}
            onPress={() => setFilterTab('paid')}
          >
            <Text style={[styles.tabText, filterTab === 'paid' && styles.activeTabText]}>
              Paid ({paidAppointments.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, filterTab === 'all' && styles.activeTabItem]}
            onPress={() => setFilterTab('all')}
          >
            <Text style={[styles.tabText, filterTab === 'all' && styles.activeTabText]}>
              All ({appointments.filter(a => a.status !== 'cancelled' || a.isPaid).length})
            </Text>
          </TouchableOpacity>
        </View>

        {filteredItems.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>💳</Text>
            <Text style={styles.emptyTitle}>No Billing Records</Text>
            <Text style={styles.emptyDesc}>No appointment bills match the selected filter.</Text>
          </Card>
        ) : (
          filteredItems.map((item) => (
            <Card key={item._id} style={styles.billCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.patientName}>
                  👤 {typeof item.patientId === 'object' ? item.patientId.full_name : 'Patient'}
                </Text>
                <Text style={[styles.costBadge, { color: item.isPaid ? Colors.success : (item.status === 'cancelled' ? Colors.textSecondary : Colors.warning) }]}>
                  ₹{item.cost || 1500}
                </Text>
              </View>

              <Text style={styles.itemDetail}>🌿 Treatment: {item.treatment}</Text>
              <Text style={styles.itemDetail}>
                📅 Date & Time: {new Date(item.appointment_date).toLocaleDateString()} at {item.appointment_time}
              </Text>
              <Text style={styles.itemDetail}>
                Doctor: {typeof item.doctorId === 'object' ? item.doctorId.full_name : 'N/A'}
              </Text>

              <View style={styles.cardFooter}>
                <Text style={[styles.statusText, { color: item.isPaid ? Colors.success : (item.status === 'cancelled' ? Colors.textSecondary : Colors.warning) }]}>
                  STATUS: {item.isPaid ? 'PAID ✓' : (item.status === 'cancelled' ? 'CANCELLED (NO FEE DUE)' : 'UNPAID PENDING')}
                </Text>
                {item.status !== 'cancelled' && (
                  <Button
                    title={item.isPaid ? 'Mark Unpaid' : 'Settle Payment'}
                    onPress={() => handleTogglePayment(item._id, !!item.isPaid)}
                    loading={updatingId === item._id}
                    size="small"
                    variant={item.isPaid ? 'outline' : 'primary'}
                  />
                )}
              </View>
            </Card>
          ))
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: Colors.background,
    marginRight: 4,
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
  billCard: {
    marginVertical: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  costBadge: {
    fontSize: 16,
    fontWeight: '800',
  },
  itemDetail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
