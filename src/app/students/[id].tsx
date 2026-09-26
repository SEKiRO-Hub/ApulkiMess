import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { studentService } from '../../services/studentService';
import { paymentService } from '../../services/paymentService';
import { settingsService } from '../../services/settingsService';
import { StatusBadge } from '../../components/StatusBadge';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PaymentModal } from '../../components/PaymentModal';
import { Student, PlanType } from '../../types';
import { COLORS, SHADOWS } from '../../constants/theme';
import { differenceInDays, parseISO, startOfDay } from 'date-fns';

export default function StudentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  // Dialog & Modal state
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  const fetchStudentDetails = async () => {
    if (!id) return;
    try {
      const settings = await settingsService.getSettings();
      const data = await studentService.getStudentById(id, settings.warningDays);
      setStudent(data);
    } catch (e) {
      console.error('Failed to fetch student details:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStudentDetails();
    }, [id])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading student details...</Text>
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.danger} />
        <Text style={styles.errorTitle}>Student Not Found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const daysRemaining = student.subscriptionExpiry
    ? differenceInDays(startOfDay(parseISO(student.subscriptionExpiry)), startOfDay(new Date()))
    : undefined;

  const handleCallPhone = () => {
    if (student.phone) {
      Linking.openURL(`tel:${student.phone}`);
    }
  };

  const handleDeleteConfirm = async () => {
    const success = await studentService.deleteStudent(student.id);
    setDeleteConfirmVisible(false);
    if (success) {
      Alert.alert('Deleted', 'Student deleted successfully.');
      router.back();
    } else {
      Alert.alert('Error', 'Failed to delete student.');
    }
  };

  const handleConfirmPayment = async (
    studentId: string,
    paymentDate: Date,
    note?: string,
    planType?: PlanType
  ) => {
    const res = await studentService.recordPayment(studentId, paymentDate, undefined, note, planType);
    if (res.success) {
      Alert.alert('Success', 'Payment recorded successfully.');
      fetchStudentDetails();
    } else {
      Alert.alert('Error', res.error || 'Failed to record payment.');
    }
  };

  const latestPlanType = student.paymentHistory && student.paymentHistory.length > 0
    ? student.paymentHistory[0].planType
    : undefined;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Main Header Card */}
        <View style={styles.card}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{student.name.charAt(0).toUpperCase()}</Text>
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.studentName}>{student.name}</Text>
              <TouchableOpacity onPress={handleCallPhone} style={styles.phoneChip}>
                <Ionicons name="call" size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
                <Text style={styles.phoneText}>{student.phone}</Text>
                <Text style={styles.callHint}>(Tap to call)</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.statusSection}>
            <Text style={styles.sectionLabel}>Current Status</Text>
            <StatusBadge status={student.status || 'unpaid'} daysRemaining={daysRemaining} size="large" />
          </View>
        </View>

        {/* Current Subscription Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current Subscription Details</Text>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Last Payment Date</Text>
              <Text style={styles.infoValue}>
                {paymentService.formatDisplayDate(student.paymentDate, 'Never Paid')}
              </Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Subscription Start</Text>
              <Text style={styles.infoValue}>
                {paymentService.formatDisplayDate(student.subscriptionStart, 'N/A')}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Subscription Expiry</Text>
              <Text
                style={[
                  styles.infoValue,
                  student.status === 'expired' && { color: COLORS.expired, fontWeight: '700' },
                  student.status === 'expiring' && { color: COLORS.expiring, fontWeight: '700' },
                ]}
              >
                {paymentService.formatDisplayDate(student.subscriptionExpiry, 'N/A')}
              </Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Plan Type</Text>
              <Text style={styles.infoValue}>
                {latestPlanType === '15days' ? '15 Days (Half Month)' : 'Monthly (1 Month)'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.payButton}
            onPress={() => setPaymentModalVisible(true)}
          >
            <Ionicons name="card-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.payButtonText}>
              {student.status === 'active' || student.status === 'expiring' ? 'Renew Payment' : 'Record Payment'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Payment History Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment History ({student.paymentHistory.length})</Text>
          <View style={styles.divider} />

          {student.paymentHistory && student.paymentHistory.length > 0 ? (
            student.paymentHistory.map((item, index) => (
              <View key={item.id || index.toString()} style={styles.historyItem}>
                <View style={styles.historyLeft}>
                  <View style={styles.historyIconCircle}>
                    <Ionicons name="checkmark-done" size={16} color={COLORS.active} />
                  </View>
                  <View>
                    <Text style={styles.historyDate}>
                      Paid: {paymentService.formatDisplayDate(item.paymentDate)}
                    </Text>
                    <Text style={styles.historySub}>
                      Valid: {paymentService.formatDisplayDate(item.subscriptionStart)} - {paymentService.formatDisplayDate(item.subscriptionExpiry)} ({item.planType === '15days' ? '15 Days' : 'Monthly'})
                    </Text>
                    {item.note ? <Text style={styles.historyNote}>Note: {item.note}</Text> : null}
                  </View>
                </View>

                <View style={styles.historyBadge}>
                  <Text style={styles.historyBadgeText}>Paid</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyHistoryText}>No payment history records found.</Text>
          )}
        </View>

        {/* Edit and Delete Buttons */}
        <View style={styles.actionButtonGroup}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.editBtn}
            onPress={() => router.push({ pathname: '/students/edit', params: { id: student.id } })}
          >
            <Ionicons name="create-outline" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.editBtnText}>Edit Student</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.deleteBtn}
            onPress={() => setDeleteConfirmVisible(true)}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} style={{ marginRight: 6 }} />
            <Text style={styles.deleteBtnText}>Delete Student</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Confirmation Dialog for Delete */}
      <ConfirmDialog
        visible={deleteConfirmVisible}
        title="Delete Student"
        message={`Are you sure you want to delete ${student.name}? All payment history will be permanently deleted.`}
        confirmLabel="Delete"
        isDanger={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmVisible(false)}
      />

      {/* Record Payment Modal */}
      <PaymentModal
        visible={paymentModalVisible}
        student={student}
        onConfirm={handleConfirmPayment}
        onClose={() => setPaymentModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 12,
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  profileInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  phoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  callHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 6,
  },
  statusSection: {
    backgroundColor: COLORS.background,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
    ...SHADOWS.small,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 8,
  },
  historyIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.activeBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  historySub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  historyNote: {
    fontSize: 11,
    color: COLORS.primary,
    marginTop: 2,
    fontStyle: 'italic',
  },
  historyBadge: {
    backgroundColor: COLORS.activeBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  historyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.active,
  },
  emptyHistoryText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  actionButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    gap: 12,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  editBtnText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.expiredBg,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.expiredBorder,
  },
  deleteBtnText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '700',
  },
});
