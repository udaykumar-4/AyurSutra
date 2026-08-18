import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure Notification Behavior for Expo SDK 52
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export const notificationService = {
  /**
   * Request Push Notification permissions and retrieve Expo Push Token
   */
  registerForPushNotifications: async (): Promise<string | null> => {
    try {
      const existingPermissions: any = await Notifications.getPermissionsAsync();
      let isGranted = existingPermissions?.granted || existingPermissions?.status === 'granted';

      if (!isGranted) {
        const requestedPermissions: any = await Notifications.requestPermissionsAsync();
        isGranted = requestedPermissions?.granted || requestedPermissions?.status === 'granted';
      }

      if (!isGranted) {
        console.warn('Push notification permissions not granted.');
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData.data;

      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#43e97b',
        });
      }

      return token;
    } catch (err) {
      console.error('Error fetching Expo push token:', err);
      return null;
    }
  },

  /**
   * Schedule Local Appointment Reminder Notification before appointment time
   */
  scheduleAppointmentReminder: async (
    appointmentId: string,
    treatment: string,
    appointmentDate: string,
    appointmentTime: string,
    hoursBefore = 2
  ) => {
    try {
      const dateTimeStr = `${appointmentDate}T${appointmentTime}:00`;
      const apptDate = new Date(dateTimeStr);
      const reminderTime = new Date(apptDate.getTime() - hoursBefore * 60 * 60 * 1000);

      // Only schedule if reminder time is in the future
      if (reminderTime > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `📅 AyurSutra Appointment Reminder`,
            body: `Your ${treatment} Panchakarma session is scheduled today at ${appointmentTime}. Please arrive 10 minutes early.`,
            data: { appointmentId, type: 'appointment_reminder' },
          },
          trigger: { date: reminderTime, type: Notifications.SchedulableTriggerInputTypes.DATE },
        });
      }
    } catch (err) {
      console.error('Error scheduling appointment reminder:', err);
    }
  },

  /**
   * Send Instant Local Appointment Confirmation Notification
   */
  notifyAppointmentConfirmation: async (treatment: string, date: string, time: string) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '✅ Appointment Confirmed',
        body: `Your session for ${treatment} on ${date} at ${time} has been successfully scheduled.`,
        data: { type: 'appointment_confirmation' },
      },
      trigger: null,
    });
  },

  /**
   * Send Instant Appointment Cancellation Notification
   */
  notifyAppointmentCancellation: async (treatment: string, date: string) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '❌ Appointment Cancelled',
        body: `Your session for ${treatment} on ${date} has been cancelled.`,
        data: { type: 'appointment_cancellation' },
      },
      trigger: null,
    });
  },

  /**
   * Send Panchakarma Treatment Care Reminder Notification
   */
  notifyTreatmentReminder: async (treatment: string) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌿 Panchakarma Care Reminder',
        body: `Remember to consume warm water and avoid heavy meals after your ${treatment} therapy.`,
        data: { type: 'treatment_reminder' },
      },
      trigger: null,
    });
  },

  /**
   * Send Prescription Update Notification
   */
  notifyPrescriptionUpdate: async (treatment: string, doctorName: string) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💊 Prescription Protocol Updated',
        body: `Dr. ${doctorName} has updated your ${treatment} Panchakarma protocol.`,
        data: { type: 'prescription_update' },
      },
      trigger: null,
    });
  },

  /**
   * Send Important System Alert Notification
   */
  notifySystemAlert: async (title: string, message: string) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🔔 ${title}`,
        body: message,
        data: { type: 'system_alert' },
      },
      trigger: null,
    });
  },
};

export default notificationService;
