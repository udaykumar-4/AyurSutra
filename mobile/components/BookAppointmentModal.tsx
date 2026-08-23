import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Colors from '../constants/Colors';
import Card from './Card';
import Button from './Button';
import Input from './Input';
import userService from '../services/userService';
import appointmentService from '../services/appointmentService';
import { SlotAvailability } from '../services/appointmentService';
import { getTodayDateString, getLocalDateString } from '../utils/appointmentDateUtils';

interface BookAppointmentModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patientId?: string;
  patientName?: string;
}

const DEFAULT_MOBILE_SLOTS: SlotAvailability[] = [
  { time: '09:00 AM', start: '09:00 AM', status: 'available' },
  { time: '09:30 AM', start: '09:30 AM', status: 'available' },
  { time: '10:00 AM', start: '10:00 AM', status: 'available' },
  { time: '10:30 AM', start: '10:30 AM', status: 'available' },
  { time: '11:00 AM', start: '11:00 AM', status: 'available' },
  { time: '11:30 AM', start: '11:30 AM', status: 'available' },
  { time: '12:00 PM', start: '12:00 PM', status: 'available' },
  { time: '02:00 PM', start: '02:00 PM', status: 'available' },
  { time: '02:30 PM', start: '02:30 PM', status: 'available' },
  { time: '03:00 PM', start: '03:00 PM', status: 'available' },
  { time: '03:30 PM', start: '03:30 PM', status: 'available' },
  { time: '04:00 PM', start: '04:00 PM', status: 'available' },
  { time: '04:30 PM', start: '04:30 PM', status: 'available' },
  { time: '05:00 PM', start: '05:00 PM', status: 'available' },
];

export default function BookAppointmentModal({
  visible,
  onClose,
  onSuccess,
  patientId,
  patientName,
}: BookAppointmentModalProps) {
  // Calendar date strip state (Next 14 days)
  const [calendarDates, setCalendarDates] = useState<
    Array<{ dateStr: string; dayName: string; dayNum: number; monthName: string; isToday: boolean }>
  >([]);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());

  // Provider Type & Selection State
  const [providerType, setProviderType] = useState<'doctor' | 'therapist'>('doctor');
  const [doctors, setDoctors] = useState<any[]>([]);
  const [therapists, setTherapists] = useState<any[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [treatment, setTreatment] = useState<string>('Consultation');

  // Real-time Availability State (Initialized with default slots so timings are ALWAYS visible)
  const [slots, setSlots] = useState<SlotAvailability[]>(DEFAULT_MOBILE_SLOTS);
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Loading States
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // 1. Build 14-day calendar strip on mount
  useEffect(() => {
    const today = new Date();
    const dates = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      const dateStr = getLocalDateString(d);
      dates.push({
        dateStr,
        dayName: days[d.getDay()],
        dayNum: d.getDate(),
        monthName: months[d.getMonth()],
        isToday: i === 0,
      });
    }

    setCalendarDates(dates);
    if (dates.length > 0) {
      setSelectedDate(dates[0].dateStr);
    }
  }, [visible]);

  // 2. Fetch Doctors & Therapists on mount
  useEffect(() => {
    if (visible) {
      loadProviders();
    }
  }, [visible]);

  const loadProviders = async () => {
    setLoadingProviders(true);
    try {
      const [docData, therData] = await Promise.all([
        userService.getAllUsers('doctor'),
        userService.getAllUsers('therapist'),
      ]);
      setDoctors(docData);
      setTherapists(therData);
      if (providerType === 'doctor' && docData.length > 0) {
        setSelectedProviderId(docData[0]._id);
      } else if (providerType === 'therapist' && therData.length > 0) {
        setSelectedProviderId(therData[0]._id);
      }
    } catch {
      // Non-fatal fallback
    } finally {
      setLoadingProviders(false);
    }
  };

  // 3. Fetch real-time availability whenever Provider or Date changes
  useEffect(() => {
    if (visible && selectedProviderId && selectedDate) {
      fetchAvailability(selectedProviderId, providerType, selectedDate);
    }
  }, [visible, selectedProviderId, providerType, selectedDate]);

  const fetchAvailability = async (provId: string, type: 'doctor' | 'therapist', dateStr: string) => {
    setLoadingSlots(true);
    try {
      const data = await appointmentService.getAvailability(provId, type, dateStr);
      if (data && data.slots && data.slots.length > 0) {
        setSlots(data.slots);
      } else {
        setSlots(DEFAULT_MOBILE_SLOTS);
      }
    } catch (err: any) {
      setSlots(DEFAULT_MOBILE_SLOTS);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Switch Provider Type handler
  const handleSelectProviderType = (type: 'doctor' | 'therapist') => {
    setProviderType(type);
    setSelectedTime('');
    const targetList = type === 'doctor' ? doctors : therapists;
    if (targetList.length > 0) {
      setSelectedProviderId(targetList[0]._id);
    } else {
      setSelectedProviderId('');
    }
  };

  // Select Date handler
  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedTime('');
  };

  // Select Provider handler
  const handleSelectProvider = (id: string) => {
    setSelectedProviderId(id);
    setSelectedTime('');
  };

  // Final Confirmation Submit handler
  const handleConfirmBooking = async () => {
    if (!patientId) {
      Alert.alert('Error', 'Patient identification missing.');
      return;
    }
    if (!selectedProviderId) {
      Alert.alert('Validation Error', 'Please select a doctor or therapist.');
      return;
    }
    if (!selectedTime) {
      Alert.alert('Validation Error', 'Please select an available time slot.');
      return;
    }

    setBookingLoading(true);
    try {
      await appointmentService.createAppointment({
        patientId: patientId,
        doctorId: providerType === 'doctor' ? selectedProviderId : undefined,
        therapistId: providerType === 'therapist' ? selectedProviderId : undefined,
        treatment: treatment.trim() || 'Consultation',
        appointment_date: selectedDate,
        appointment_time: selectedTime,
      });

      Alert.alert('Success! 🎉', 'Appointment booked and confirmed.');
      onSuccess();
      onClose();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to book appointment.';
      Alert.alert('Booking Conflict', errorMsg);
      if (selectedProviderId) {
        fetchAvailability(selectedProviderId, providerType, selectedDate);
      }
    } finally {
      setBookingLoading(false);
    }
  };

  const selectedProviderObj = (providerType === 'doctor' ? doctors : therapists).find(p => p._id === selectedProviderId);
  const availableSlotsCount = slots.filter(s => (s.status || '').toLowerCase() === 'available').length;
  const selectedSlotObj = slots.find(s => s.time === selectedTime);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 24, marginRight: 8 }}>📅</Text>
              <View>
                <Text style={styles.modalTitle}>Book Appointment</Text>
                <Text style={styles.modalSub}>Select calendar date, provider & available timing</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* STEP 1: SELECT DATE (Calendar Picker Strip) */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 8 }}>
              <Text style={styles.stepTitle}>1. Select Date (Calendar)</Text>
              <Text style={styles.selectedDateBadge}>Selected Date: {selectedDate}</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.calendarStrip}>
              {calendarDates.map((item) => {
                const isSelected = item.dateStr === selectedDate;
                return (
                  <TouchableOpacity
                    key={item.dateStr}
                    style={[
                      styles.dateCard,
                      isSelected && styles.selectedDateCard,
                      item.isToday && !isSelected && styles.todayDateCard,
                    ]}
                    onPress={() => handleSelectDate(item.dateStr)}
                  >
                    <Text style={[styles.dayName, isSelected && styles.selectedDateText]}>{item.dayName}</Text>
                    <Text style={[styles.dayNum, isSelected && styles.selectedDateText]}>{item.dayNum}</Text>
                    <Text style={[styles.monthName, isSelected && styles.selectedDateText]}>
                      {item.isToday ? 'TODAY' : item.monthName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* STEP 2: SELECT PROVIDER TYPE */}
            <Text style={styles.stepTitle}>2. Select Provider Type</Text>
            <View style={styles.typeToggleRow}>
              <TouchableOpacity
                style={[styles.typeToggleBtn, providerType === 'doctor' && styles.activeTypeBtn]}
                onPress={() => handleSelectProviderType('doctor')}
              >
                <Text style={[styles.typeBtnText, providerType === 'doctor' && styles.activeTypeBtnText]}>
                  👨‍⚕️ Ayurvedic Doctor
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeToggleBtn, providerType === 'therapist' && styles.activeTypeBtn]}
                onPress={() => handleSelectProviderType('therapist')}
              >
                <Text style={[styles.typeBtnText, providerType === 'therapist' && styles.activeTypeBtnText]}>
                  🧘 Panchakarma Therapist
                </Text>
              </TouchableOpacity>
            </View>

            {/* STEP 3: SELECT PROVIDER */}
            <Text style={styles.stepTitle}>
              3. Select {providerType === 'doctor' ? 'Doctor' : 'Therapist'}
            </Text>

            {loadingProviders ? (
              <ActivityIndicator color={Colors.primary} style={{ marginVertical: 12 }} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {(providerType === 'doctor' ? doctors : therapists).map((p) => {
                  const isSelected = p._id === selectedProviderId;
                  return (
                    <TouchableOpacity
                      key={p._id}
                      style={[styles.providerChip, isSelected && styles.selectedProviderChip]}
                      onPress={() => handleSelectProvider(p._id)}
                    >
                      <Text style={[styles.providerChipText, isSelected && styles.selectedProviderChipText]}>
                        {providerType === 'doctor' ? '👨‍⚕️' : '🧘'} {p.full_name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* Treatment Selector */}
            <Input
              label="Treatment / Protocol Name"
              placeholder="Consultation, Abhyanga, Shirodhara, Swedana"
              value={treatment}
              onChangeText={setTreatment}
            />

            {/* STEP 4: REAL-TIME SLOTS AVAILABILITY & TIMING GRID */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <Text style={styles.stepTitle}>
                4. Available Time Slots for {selectedDate}
              </Text>
              {loadingSlots && <ActivityIndicator size="small" color={Colors.primary} />}
            </View>

            <View style={styles.slotsGrid}>
              {slots.map((slot) => {
                const isSelected = selectedTime === slot.time;
                const statusLower = (slot.status || '').toLowerCase();
                const isAvailable = statusLower === 'available';

                let slotStyle = styles.availableSlot;
                let textStyle = styles.availableSlotText;
                let badgeText = 'AVAILABLE';

                if (statusLower === 'booked') {
                  slotStyle = styles.bookedSlot;
                  textStyle = styles.bookedSlotText;
                  badgeText = 'BOOKED';
                } else if (statusLower === 'blocked') {
                  slotStyle = styles.blockedSlot;
                  textStyle = styles.blockedSlotText;
                  badgeText = 'BLOCKED';
                } else if (statusLower === 'leave' || statusLower === 'past' || statusLower === 'unavailable') {
                  slotStyle = styles.disabledSlot;
                  textStyle = styles.disabledSlotText;
                  badgeText = statusLower.toUpperCase();
                }

                if (isSelected) {
                  slotStyle = styles.selectedSlot;
                  textStyle = styles.selectedSlotText;
                }

                return (
                  <TouchableOpacity
                    key={slot.time}
                    style={[styles.slotBadge, slotStyle]}
                    onPress={() => setSelectedTime(slot.time)}
                  >
                    <Text style={[styles.slotTimeText, textStyle]}>{slot.time}</Text>
                    <Text style={[styles.slotStatusLabel, textStyle]}>{isSelected ? 'SELECTED' : badgeText}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* PARTICULAR TIME AVAILABILITY INSPECTOR */}
            {selectedTime ? (
              <View style={styles.particularTimeCard}>
                <Text style={styles.particularTimeTitle}>
                  🕒 Particular Time Selected: {selectedTime}
                </Text>
                <Text style={styles.particularTimeText}>
                  {selectedSlotObj?.status?.toLowerCase() === 'available' || !selectedSlotObj
                    ? `✅ ${selectedTime} is AVAILABLE for booking with ${selectedProviderObj?.full_name || 'selected provider'} on ${selectedDate}.`
                    : selectedSlotObj?.status?.toLowerCase() === 'booked'
                    ? `❌ ${selectedTime} is already BOOKED by another appointment.`
                    : selectedSlotObj?.status?.toLowerCase() === 'blocked'
                    ? `⚠️ ${selectedTime} is BLOCKED in provider schedule.`
                    : `ℹ️ ${selectedTime} status: ${selectedSlotObj?.status?.toUpperCase()}`}
                </Text>
              </View>
            ) : null}

            {/* STEP 5: BOOKING SUMMARY & CONFIRMATION */}
            {selectedTime ? (
              <Card style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>📋 Booking Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Patient:</Text>
                  <Text style={styles.summaryValue}>{patientName || 'Current Patient'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Provider:</Text>
                  <Text style={styles.summaryValue}>
                    {selectedProviderObj ? selectedProviderObj.full_name : 'Selected Provider'} ({providerType.toUpperCase()})
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Treatment:</Text>
                  <Text style={styles.summaryValue}>{treatment || 'Consultation'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Date & Particular Time:</Text>
                  <Text style={styles.summaryValue}>{selectedDate} at {selectedTime}</Text>
                </View>

                <Button
                  title="Confirm & Book Slot"
                  onPress={handleConfirmBooking}
                  loading={bookingLoading}
                  style={{ marginTop: 12 }}
                />
              </Card>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  modalSub: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  scrollContent: {
    paddingVertical: 12,
    paddingBottom: 30,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  selectedDateBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  calendarStrip: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  dateCard: {
    width: 60,
    height: 70,
    borderRadius: 10,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  selectedDateCard: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  todayDateCard: {
    borderColor: Colors.accent,
    borderWidth: 2,
  },
  dayName: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  dayNum: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginVertical: 2,
  },
  monthName: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.accent,
  },
  selectedDateText: {
    color: Colors.white,
  },
  typeToggleRow: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 10,
  },
  typeToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    marginRight: 6,
  },
  activeTypeBtn: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeTypeBtnText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  providerChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  selectedProviderChip: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  providerChipText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600',
  },
  selectedProviderChipText: {
    color: Colors.white,
    fontWeight: '700',
  },
  slotsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  noSlotsText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginTop: 6,
  },
  slotBadge: {
    width: '31%',
    margin: '1%',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  availableSlot: {
    backgroundColor: Colors.successBg,
    borderColor: Colors.success,
  },
  availableSlotText: {
    color: Colors.success,
  },
  bookedSlot: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ccc',
  },
  bookedSlotText: {
    color: '#999',
  },
  blockedSlot: {
    backgroundColor: Colors.errorBg,
    borderColor: Colors.error,
  },
  blockedSlotText: {
    color: Colors.error,
  },
  disabledSlot: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  disabledSlotText: {
    color: '#aaa',
  },
  selectedSlot: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  selectedSlotText: {
    color: Colors.white,
    fontWeight: '700',
  },
  slotTimeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  slotStatusLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },
  particularTimeCard: {
    marginTop: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 10,
    padding: 12,
  },
  particularTimeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  particularTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  summaryCard: {
    marginTop: 12,
    backgroundColor: Colors.white,
    borderColor: Colors.primary + '30',
    borderWidth: 1,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
});
