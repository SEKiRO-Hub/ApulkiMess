import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Student, PlanType } from '../types';
import { paymentService } from '../services/paymentService';
import { DatePickerModal } from './DatePickerModal';
import { COLORS, SHADOWS } from '../constants/theme';
import { format, isToday } from 'date-fns';

interface Props {
  visible: boolean;
  student: Student | null;
  onConfirm: (studentId: string, paymentDate: Date, note?: string, planType?: PlanType) => void;
  onClose: () => void;
}

export const PaymentModal: React.FC<Props> = ({
  visible,
  student,
  onConfirm,
  onClose,
}) => {
  const [note, setNote] = useState('');
  const [planType, setPlanType] = useState<PlanType>('monthly');
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setNote('');
      setPlanType('monthly');
      setPaymentDate(new Date());
    }
  }, [visible]);

  if (!visible || !student) return null;

  // Calculate dynamic start and expiry dates in real time based on state
  const { subscriptionStart, subscriptionExpiry } = paymentService.calculateSubscriptionDates(
    student,
    paymentDate,
    planType
  );

  const previewStart = format(subscriptionStart, 'dd MMM yyyy');
  const previewExpiry = format(subscriptionExpiry, 'dd MMM yyyy');
  const previewPaymentDate = format(paymentDate, 'dd MMM yyyy');

  const handleConfirm = () => {
    onConfirm(student.id, paymentDate, note.trim() || undefined, planType);
    onClose();
  };

  return (
    <>
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
                <Text style={styles.title}>Record / Renew Payment</Text>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Student Header Info */}
              <View style={styles.studentInfoCard}>
                <Text style={styles.studentName}>{student.name}</Text>
                <Text style={styles.studentPhone}>{student.phone}</Text>
              </View>

              {/* 1. SELECT SUBSCRIPTION PLAN OPTION */}
              <View style={styles.sectionContainer}>
                <Text style={styles.fieldLabel}>1. Select Subscription Plan:</Text>
                <View style={styles.planSelectorRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[
                      styles.planOptionCard,
                      planType === 'monthly' && styles.selectedPlanCard,
                    ]}
                    onPress={() => setPlanType('monthly')}
                  >
                    <View style={styles.planHeaderRow}>
                      <Ionicons
                        name={planType === 'monthly' ? 'radio-button-on' : 'radio-button-off'}
                        size={18}
                        color={planType === 'monthly' ? COLORS.primary : COLORS.textMuted}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.planTitle, planType === 'monthly' && styles.selectedPlanTitle]}>
                        Monthly Plan
                      </Text>
                    </View>
                    <Text style={styles.planSub}>1 Month / 30 Days</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[
                      styles.planOptionCard,
                      planType === '15days' && styles.selectedPlanCard,
                    ]}
                    onPress={() => setPlanType('15days')}
                  >
                    <View style={styles.planHeaderRow}>
                      <Ionicons
                        name={planType === '15days' ? 'radio-button-on' : 'radio-button-off'}
                        size={18}
                        color={planType === '15days' ? COLORS.primary : COLORS.textMuted}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.planTitle, planType === '15days' && styles.selectedPlanTitle]}>
                        15 Days Plan
                      </Text>
                    </View>
                    <Text style={styles.planSub}>Half Month / 15 Days</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 2. SELECT PAYMENT START DATE */}
              <View style={styles.sectionContainer}>
                <Text style={styles.fieldLabel}>2. Select Payment Start Date:</Text>
                <View style={styles.dateSelectorContainer}>
                  <View style={styles.dateDisplayInfo}>
                    <Ionicons name="calendar-clear-outline" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
                    <View>
                      <Text style={styles.dateText}>{previewPaymentDate}</Text>
                      <Text style={styles.dateSubText}>{isToday(paymentDate) ? '(Today)' : 'Custom Selected Date'}</Text>
                    </View>
                  </View>

                  <View style={styles.dateBtnGroup}>
                    {!isToday(paymentDate) && (
                      <TouchableOpacity
                        style={styles.todayQuickBtn}
                        onPress={() => setPaymentDate(new Date())}
                      >
                        <Text style={styles.todayQuickBtnText}>Today</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.calendarPickerBtn}
                      onPress={() => setDatePickerVisible(true)}
                    >
                      <Ionicons name="calendar" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.calendarPickerBtnText}>Calendar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* 3. DYNAMICALLY CALCULATED SUMMARY */}
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryHeading}>Automatic Expiry Calculation:</Text>
                
                <View style={styles.row}>
                  <Text style={styles.label}>Plan Selected:</Text>
                  <Text style={styles.value}>
                    {planType === '15days' ? '15 Days (Half Month)' : 'Monthly (1 Month)'}
                  </Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>Subscription Start:</Text>
                  <Text style={styles.value}>{previewStart}</Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>Calculated Expiry:</Text>
                  <Text style={styles.valueHighlight}>{previewExpiry}</Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>New Status:</Text>
                  <Text style={[styles.value, { color: COLORS.active, fontWeight: '700' }]}>
                    🟢 Active ({planType === '15days' ? '15 Days' : '1 Month'})
                  </Text>
                </View>
              </View>

              {/* 4. OPTIONAL NOTE */}
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
                <Text style={styles.confirmButtonText}>Confirm & Record Payment</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date Picker Calendar Modal */}
      <DatePickerModal
        visible={datePickerVisible}
        selectedDate={paymentDate}
        onSelectDate={(newDate) => setPaymentDate(newDate)}
        onClose={() => setDatePickerVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '90%',
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    ...SHADOWS.large,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
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
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  studentName: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  studentPhone: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  sectionContainer: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  planSelectorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  planOptionCard: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
  },
  selectedPlanCard: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  planHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  planTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  selectedPlanTitle: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  planSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginLeft: 24,
  },
  dateSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
  },
  dateDisplayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  dateSubText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  dateBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  todayQuickBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  todayQuickBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  calendarPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  calendarPickerBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  summaryContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  summaryHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  label: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  value: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  valueHighlight: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '800',
  },
  inputContainer: {
    marginBottom: 16,
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
    marginBottom: 8,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
