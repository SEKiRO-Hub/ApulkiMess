import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Student, PlanType, MealSelection } from '../types';
import { paymentService } from '../services/paymentService';
import { DatePickerModal } from './DatePickerModal';
import { COLORS, SHADOWS } from '../constants/theme';
import { format, isToday } from 'date-fns';

interface Props {
  visible: boolean;
  student: Student | null;
  onConfirm: (studentId: string, paymentDate: Date, note?: string, planType?: PlanType, durationDays?: number, meals?: MealSelection, amount?: number) => void;
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
  const [customDays, setCustomDays] = useState('10');
  const [meals, setMeals] = useState<MealSelection>({
    breakfast: true,
    lunch: true,
    dinner: false,
  });
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [totalAmountInput, setTotalAmountInput] = useState('');

  useEffect(() => {
    if (visible) {
      setNote('');
      setPlanType('monthly');
      setCustomDays('30');
      setMeals({ breakfast: true, lunch: true, dinner: true });
      setPaymentDate(new Date());
      setTotalAmountInput('');
    }
  }, [visible]);

  if (!visible || !student) return null;

  const durationDays = planType === 'monthly' ? 30 : (parseInt(customDays) || 0);

  // Calculate dynamic start and expiry dates in real time based on state
  const { subscriptionStart, subscriptionExpiry } = paymentService.calculateSubscriptionDates(
    student,
    paymentDate,
    planType,
    durationDays
  );

  const previewStart = format(subscriptionStart, 'dd MMM yyyy');
  const previewExpiry = format(subscriptionExpiry, 'dd MMM yyyy');
  const previewPaymentDate = format(paymentDate, 'dd MMM yyyy');

  const totalAmount = parseFloat(totalAmountInput) || 0;
  
  const isValidCustomDays = durationDays >= 1 && durationDays <= 30;
  const hasMealsSelected = meals.breakfast || meals.lunch || meals.dinner;
  const isValid = isValidCustomDays && hasMealsSelected && totalAmount > 0;

  const handleConfirm = () => {
    if (!isValid) return;
    onConfirm(student.id, paymentDate, note.trim() || undefined, planType, durationDays, meals, totalAmount);
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
                      planType === 'custom' && styles.selectedPlanCard,
                    ]}
                    onPress={() => setPlanType('custom')}
                  >
                    <View style={styles.planHeaderRow}>
                      <Ionicons
                        name={planType === 'custom' ? 'radio-button-on' : 'radio-button-off'}
                        size={18}
                        color={planType === 'custom' ? COLORS.primary : COLORS.textMuted}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.planTitle, planType === 'custom' && styles.selectedPlanTitle]}>
                        Custom Plan
                      </Text>
                    </View>
                    <Text style={styles.planSub}>Select 1-30 Days</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {planType === 'custom' && (
                <View style={styles.sectionContainer}>
                  <Text style={styles.fieldLabel}>Number of Days (1-30):</Text>
                  <TextInput
                    style={styles.daysInput}
                    keyboardType="numeric"
                    maxLength={2}
                    value={customDays}
                    onChangeText={(text) => {
                      const num = text.replace(/[^0-9]/g, '');
                      setCustomDays(num);
                    }}
                    placeholder="e.g. 15"
                    placeholderTextColor={COLORS.textMuted}
                  />
                  {!isValidCustomDays && customDays !== '' && (
                    <Text style={styles.errorText}>Please enter a valid number of days (1-30).</Text>
                  )}
                </View>
              )}

              {/* SUBSCRIPTION TYPE / MEALS */}
              <View style={styles.sectionContainer}>
                <Text style={styles.fieldLabel}>Subscription Type (Select Meals):</Text>
                <View style={styles.mealsContainer}>
                  <TouchableOpacity 
                    style={styles.mealCheckbox} 
                    onPress={() => setMeals({...meals, breakfast: !meals.breakfast})}
                  >
                    <Ionicons name={meals.breakfast ? "checkbox" : "square-outline"} size={24} color={meals.breakfast ? COLORS.primary : COLORS.textMuted} />
                    <Text style={styles.mealLabel}>Breakfast</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.mealCheckbox} 
                    onPress={() => setMeals({...meals, lunch: !meals.lunch})}
                  >
                    <Ionicons name={meals.lunch ? "checkbox" : "square-outline"} size={24} color={meals.lunch ? COLORS.primary : COLORS.textMuted} />
                    <Text style={styles.mealLabel}>Lunch</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.mealCheckbox} 
                    onPress={() => setMeals({...meals, dinner: !meals.dinner})}
                  >
                    <Ionicons name={meals.dinner ? "checkbox" : "square-outline"} size={24} color={meals.dinner ? COLORS.primary : COLORS.textMuted} />
                    <Text style={styles.mealLabel}>Dinner</Text>
                  </TouchableOpacity>
                </View>
                {!hasMealsSelected && (
                  <Text style={styles.errorText}>Please select at least one meal.</Text>
                )}
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
                <Text style={styles.summaryHeading}>Calculation Summary:</Text>
                
                <View style={styles.row}>
                  <Text style={styles.label}>Plan / Duration:</Text>
                  <Text style={styles.value}>
                    {planType === 'custom' ? `Custom (${durationDays} Days)` : 'Monthly (30 Days)'}
                  </Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>Valid From:</Text>
                  <Text style={styles.value}>{previewStart}</Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>Valid Until:</Text>
                  <Text style={styles.value}>{previewExpiry}</Text>
                </View>

                <View style={[styles.row, { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border }]}>
                  <Text style={styles.label}>Total Amount:</Text>
                  <Text style={styles.valueHighlight}>₹{totalAmount}</Text>
                </View>
              </View>

              {/* 4. TOTAL AMOUNT INPUT */}
              <View style={styles.inputContainer}>
                <Text style={styles.fieldLabel}>Total Payment Amount (₹):</Text>
                <TextInput
                  style={styles.daysInput}
                  keyboardType="numeric"
                  value={totalAmountInput}
                  onChangeText={(text) => {
                    const num = text.replace(/[^0-9]/g, '');
                    setTotalAmountInput(num);
                  }}
                  placeholder="e.g. 1500"
                  placeholderTextColor={COLORS.textMuted}
                />
                {totalAmount === 0 && totalAmountInput !== '' && (
                  <Text style={styles.errorText}>Please enter a valid amount.</Text>
                )}
              </View>

              {/* 5. OPTIONAL NOTE */}
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
                activeOpacity={isValid ? 0.8 : 1}
                style={[styles.confirmButton, !isValid && styles.confirmButtonDisabled]}
                onPress={handleConfirm}
                disabled={!isValid}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.confirmButtonText}>Confirm Payment (₹{totalAmount})</Text>
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
  confirmButtonDisabled: {
    backgroundColor: COLORS.textMuted,
    opacity: 0.7,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  daysInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    marginTop: 4,
  },
  mealsContainer: {
    gap: 12,
  },
  mealCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealLabel: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginLeft: 10,
    fontWeight: '500',
  },
});
