import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

interface AlertItem {
  id: string;
  studentName: string;
  type: 'expiring' | 'expired';
  message: string;
  daysLeft: number;
}

interface Props {
  alerts: AlertItem[];
  onPressAlert: (studentId: string) => void;
}

export const NotificationBanner: React.FC<Props> = ({ alerts, onPressAlert }) => {
  if (!alerts || alerts.length === 0) return null;

  const firstAlert = alerts[0];
  const totalAlerts = alerts.length;

  const isExpired = firstAlert.type === 'expired';

  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: isExpired ? COLORS.expiredBg : COLORS.expiringBg },
        { borderColor: isExpired ? COLORS.expiredBorder : COLORS.expiringBorder },
      ]}
    >
      <View style={styles.leftCol}>
        <Ionicons
          name={isExpired ? 'alert-circle' : 'time'}
          size={22}
          color={isExpired ? COLORS.expired : COLORS.expiring}
          style={styles.icon}
        />
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: isExpired ? COLORS.expired : COLORS.expiring }]}>
            {isExpired ? 'Subscription Expired Alert' : 'Expiring Soon Alert'}
          </Text>
          <Text style={styles.message} numberOfLines={1}>
            {firstAlert.message}
          </Text>
          {totalAlerts > 1 && (
            <Text style={styles.subtext}>+{totalAlerts - 1} more student alerts</Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onPressAlert(firstAlert.id)}
        style={[
          styles.actionBtn,
          { backgroundColor: isExpired ? COLORS.expired : COLORS.expiring },
        ]}
      >
        <Text style={styles.actionBtnText}>View</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: 8,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  icon: {
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  subtext: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
