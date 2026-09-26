import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Student } from '../types';
import { StatusBadge } from './StatusBadge';
import { paymentService } from '../services/paymentService';
import { studentService } from '../services/studentService';
import { COLORS, SHADOWS } from '../constants/theme';
import { differenceInDays, parseISO, startOfDay } from 'date-fns';

interface Props {
  student: Student;
  onPress: (student: Student) => void;
  onMarkAsPaid: (student: Student) => void;
  onPause?: (student: Student) => void;
  onResume?: (student: Student) => void;
  warningDays?: number;
}

export const StudentCard: React.FC<Props> = ({
  student,
  onPress,
  onMarkAsPaid,
  onPause,
  onResume,
  warningDays = 3,
}) => {
  const formattedPaymentDate = paymentService.formatDisplayDate(student.paymentDate, 'Not paid yet');
  const formattedExpiryDate = student.status === 'paused' 
    ? 'PAUSED' 
    : paymentService.formatDisplayDate(student.subscriptionExpiry, 'No active plan');

  const daysRemaining = studentService.calculateRemainingDays(student);

  const handleCall = () => {
    if (student.phone) {
      Linking.openURL(`tel:${student.phone}`);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPress(student)}
      style={styles.card}
    >
      <View style={styles.headerRow}>
        <View style={styles.nameContainer}>
          <Text style={styles.nameText} numberOfLines={1}>
            {student.name}
          </Text>
          <TouchableOpacity onPress={handleCall} style={styles.phoneRow} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Ionicons name="call-outline" size={14} color={COLORS.primary} style={styles.phoneIcon} />
            <Text style={styles.phoneText}>{student.phone}</Text>
          </TouchableOpacity>
        </View>

        <StatusBadge status={student.status || 'unpaid'} daysRemaining={daysRemaining} />
      </View>

      <View style={styles.divider} />

      <View style={styles.detailsRow}>
        <View style={styles.dateBlock}>
          <Text style={styles.dateLabel}>Paid Date</Text>
          <Text style={styles.dateValue}>{formattedPaymentDate}</Text>
        </View>

        <View style={styles.dateBlockRight}>
          <Text style={styles.dateLabel}>Valid Till</Text>
          <Text
            style={[
              styles.dateValue,
              student.status === 'expired' && { color: COLORS.expired, fontWeight: '700' },
              student.status === 'expiring' && { color: COLORS.expiring, fontWeight: '700' },
            ]}
          >
            {formattedExpiryDate}
          </Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        {student.status === 'active' || student.status === 'expiring' ? (
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.payButton, !studentService.canPauseSubscription(student).canPause && { backgroundColor: COLORS.textMuted }]}
            onPress={() => {
              const pauseCheck = studentService.canPauseSubscription(student);
              if (!pauseCheck.canPause) {
                Alert.alert('Cannot Pause', pauseCheck.reason || 'Subscription cannot be paused.');
              } else if (onPause) {
                onPause(student);
              }
            }}
          >
            <Ionicons name="pause-circle-outline" size={18} color="#FFFFFF" style={styles.btnIcon} />
            <Text style={styles.payButtonText}>Pause</Text>
          </TouchableOpacity>
        ) : student.status === 'paused' ? (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.payButton}
            onPress={() => onResume && onResume(student)}
          >
            <Ionicons name="play-circle-outline" size={18} color="#FFFFFF" style={styles.btnIcon} />
            <Text style={styles.payButtonText}>Resume</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.payButton}
            onPress={() => onMarkAsPaid(student)}
          >
            <Ionicons name="card-outline" size={18} color="#FFFFFF" style={styles.btnIcon} />
            <Text style={styles.payButtonText}>Renew Payment</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nameContainer: {
    flex: 1,
    marginRight: 8,
  },
  nameText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneIcon: {
    marginRight: 4,
  },
  phoneText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  dateBlock: {
    flex: 1,
  },
  dateBlockRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    width: '100%',
    ...SHADOWS.small,
  },
  btnIcon: {
    marginRight: 6,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
