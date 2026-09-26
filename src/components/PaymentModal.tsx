import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Student } from '../types';
import { paymentService } from '../services/paymentService';
import { COLORS } from '../constants/theme';
import { format } from 'date-fns';

interface Props {
  visible: boolean;
  student: Student | null;
  onConfirm: (studentId: string, paymentDate: Date, note?: string) => void;
  onClose: () => void;
}

export const PaymentModal: React.FC<Props> = ({
  visible,
  student,
  onConfirm,
  onClose,
}) => {
  const [note, setNote] = useState('');
  const paymentDate = new Date();

  if (!visible || !student) return null;

  const { subscriptionStart, subscriptionExpiry } = paymentService.calculateSubscriptionDates(
    student,
    paymentDate
  );

  const previewStart = format(subscriptionStart, 'dd MMM yyyy');
  const previewExpiry = format(subscriptionExpiry, 'dd MMM yyyy');
  const previewPaymentDate = format(paymentDate, 'dd MMM yyyy');

  const handleConfirm = () => {
    onConfirm(student.id, paymentDate, note.trim() || undefined);
    setNote('');
    onClose();
  };

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="card-outline" size={24} color={COLORS.primary} style={{ marginRight: 8 }} />
              <Text style={styles.title}>Record Monthly Payment</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.studentInfoCard}>
            <Text style={styles.studentName}>{student.name}</Text>
            <Text style={styles.studentPhone}>{student.phone}</Text>
          </View>

          <View style={styles.summaryContainer}>
            <View style={styles.row}>
              <Text style={styles.label}>Payment Date:</Text>
              <Text style={styles.value}>{previewPaymentDate} (Today)</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Subscription Period:</Text>
              <Text style={styles.valueHighlight}>
                {previewStart} → {previewExpiry}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>New Status:</Text>
              <Text style={[styles.value, { color: COLORS.active, fontWeight: '700' }]}>🟢 Active (1 Month)</Text>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Optional Payment Note / Mode:</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="e.g. Cash, UPI, GPay..."
              placeholderTextColor={COLORS.textMuted}
              value={note}
              onChangeText={setNote}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.confirmButton}
            onPress={handleConfirm}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.confirmButtonText}>Confirm & Mark as Paid</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  studentInfoCard: {
    backgroundColor: COLORS.primaryLight,
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  studentPhone: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  summaryContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  label: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  valueHighlight: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  noteInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  confirmButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
