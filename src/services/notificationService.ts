import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { Student } from '../types';
import { parseISO, differenceInDays } from 'date-fns';

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  (Constants as any).appOwnership === 'expo';

function getNotificationsModule() {
  if (isExpoGo || Platform.OS === 'web') {
    return null;
  }
  try {
    const Notifications = require('expo-notifications');
    return Notifications;
  } catch (e) {
    console.warn('[NotificationService] expo-notifications module unavailable:', e);
    return null;
  }
}

// Safely configure default notification handler if available (not in Expo Go)
const NotificationsModule = getNotificationsModule();
if (NotificationsModule) {
  try {
    NotificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (e) {
    console.warn('[NotificationService] Failed to set notification handler:', e);
  }
}

export const notificationService = {
  /**
   * Request notification permissions from the OS
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const Notifications = getNotificationsModule();
      if (!Notifications) return false;

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (e) {
      console.warn('[NotificationService] Permissions request warning:', e);
      return false;
    }
  },

  /**
   * Schedule local notifications for a student subscription
   */
  async scheduleStudentExpiryNotification(student: Student, warningDays: number = 3): Promise<void> {
    if (!student.subscriptionExpiry) return;

    try {
      const Notifications = getNotificationsModule();
      if (!Notifications) return;

      const expiryDate = parseISO(student.subscriptionExpiry);
      const now = new Date();

      // Check if expiry is in the future
      if (expiryDate.getTime() <= now.getTime()) return;

      // 1. Notification for Warning Days before expiry
      const warningTriggerDate = new Date(expiryDate);
      warningTriggerDate.setDate(warningTriggerDate.getDate() - warningDays);

      if (warningTriggerDate.getTime() > now.getTime()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Mess Subscription Expiring Soon',
            body: `${student.name}'s mess subscription expires in ${warningDays} days.`,
            data: { studentId: student.id },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: warningTriggerDate,
          },
        });
      }

      // 2. Notification on Expiry Day
      if (expiryDate.getTime() > now.getTime()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Mess Subscription Expired',
            body: `${student.name}'s mess subscription has expired today.`,
            data: { studentId: student.id },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: expiryDate,
          },
        });
      }
    } catch (e) {
      console.warn('[NotificationService] Failed to schedule notification:', e);
    }
  },

  /**
   * Cancel all existing scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      const Notifications = getNotificationsModule();
      if (!Notifications) return;

      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (e) {
      console.warn('[NotificationService] Failed to cancel notifications:', e);
    }
  },

  /**
   * Generate in-app alert items for Dashboard view
   */
  getInAppAlerts(students: Student[], warningDays: number = 3): { id: string; studentName: string; type: 'expiring' | 'expired'; message: string; daysLeft: number }[] {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const alerts: { id: string; studentName: string; type: 'expiring' | 'expired'; message: string; daysLeft: number }[] = [];

    students.forEach((student) => {
      if (!student.subscriptionExpiry) return;
      const expiry = parseISO(student.subscriptionExpiry);
      expiry.setHours(0, 0, 0, 0);

      const daysDiff = differenceInDays(expiry, now);

      if (daysDiff < 0) {
        alerts.push({
          id: student.id,
          studentName: student.name,
          type: 'expired',
          message: `${student.name}'s mess subscription has expired.`,
          daysLeft: daysDiff,
        });
      } else if (daysDiff <= warningDays) {
        const text = daysDiff === 0 ? 'today' : daysDiff === 1 ? 'tomorrow' : `in ${daysDiff} days`;
        alerts.push({
          id: student.id,
          studentName: student.name,
          type: 'expiring',
          message: `${student.name}'s mess subscription expires ${text}.`,
          daysLeft: daysDiff,
        });
      }
    });

    return alerts.sort((a, b) => a.daysLeft - b.daysLeft);
  },
};
