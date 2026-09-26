import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Header } from '../components/Header';
import { SummaryCard } from '../components/SummaryCard';
import { SearchBar } from '../components/SearchBar';
import { StudentCard } from '../components/StudentCard';
import { FilterChips } from '../components/FilterChips';
import { DatePickerModal } from '../components/DatePickerModal';
import { EmptyState } from '../components/EmptyState';
import { PaymentModal } from '../components/PaymentModal';
import { NotificationBanner } from '../components/NotificationBanner';

import { studentService } from '../services/studentService';
import { settingsService } from '../services/settingsService';
import { notificationService } from '../services/notificationService';
import { Student, FilterStatus, SortOption, AppSettings, PlanType } from '../types';
import { COLORS, SHADOWS } from '../constants/theme';

export default function DashboardScreen() {
  const router = useRouter();

  const [students, setStudents] = useState<Student[]>([]);
  const [settings, setSettings] = useState<AppSettings>(settingsService.getSettings() as any);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [activeSort, setActiveSort] = useState<SortOption>('name_asc');

  // Modal State
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<Student | null>(null);

  const [pauseDateModalVisible, setPauseDateModalVisible] = useState(false);
  const [selectedStudentForPause, setSelectedStudentForPause] = useState<Student | null>(null);
  const [selectedPauseDate, setSelectedPauseDate] = useState<Date>(new Date());

  // In-app Notification Banner State
  const [alerts, setAlerts] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const currentSettings = await settingsService.getSettings();
      setSettings(currentSettings);

      const list = await studentService.getStudents(currentSettings.warningDays);

      setStudents(list);

      // In-app alerts
      const inAppAlerts = notificationService.getInAppAlerts(list, currentSettings.warningDays);
      setAlerts(inAppAlerts);
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Re-fetch when screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Filtered and sorted student list
  const displayedStudents = studentService.filterAndSortStudents(
    students,
    searchQuery,
    activeFilter,
    activeSort
  );

  // Quick sections
  const expiringStudents = students.filter((s) => s.status === 'expiring');
  const expiredStudents = students.filter((s) => s.status === 'expired');

  const stats = studentService.getDashboardStats(students);

  // Actions
  const handleStudentPress = (student: Student) => {
    router.push(`/students/${student.id}`);
  };

  const handleOpenPaymentModal = (student: Student) => {
    setSelectedStudentForPayment(student);
    setPaymentModalVisible(true);
  };

  const handleConfirmPayment = async (
    studentId: string,
    paymentDate: Date,
    note?: string,
    planType?: PlanType
  ) => {
    const res = await studentService.recordPayment(studentId, paymentDate, undefined, note, planType);
    if (res.success && res.student) {
      // Schedule push notification for future expiry
      notificationService.scheduleStudentExpiryNotification(res.student, settings.warningDays);
      Alert.alert('Success', 'Payment recorded successfully!');
      loadData();
    } else {
      Alert.alert('Error', res.error || 'Failed to record payment.');
    }
  };

  const handleOpenPauseModal = (student: Student) => {
    setSelectedStudentForPause(student);
    setSelectedPauseDate(new Date());
    setPauseDateModalVisible(true);
  };

  const handleConfirmPause = async (date: Date) => {
    setPauseDateModalVisible(false);
    if (!selectedStudentForPause) return;
    const res = await studentService.pauseSubscription(selectedStudentForPause.id, date);
    if (res.success) {
      Alert.alert('Paused', 'Subscription has been paused.');
      loadData();
    } else {
      Alert.alert('Error', res.error || 'Failed to pause subscription.');
    }
  };

  const handleResumeSubscription = async (student: Student) => {
    Alert.alert(
      'Resume Subscription',
      'Are you sure you want to resume the subscription? A mandatory 3-day deduction will be applied to the pause duration.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resume',
          onPress: async () => {
            const res = await studentService.resumeSubscription(student.id, new Date());
            if (res.success) {
              Alert.alert('Resumed', 'Subscription is now active again.');
              loadData();
            } else {
              Alert.alert('Error', res.error || 'Failed to resume subscription.');
            }
          },
        },
      ]
    );
  };

  const isDefaultView = searchQuery === '' && activeFilter === 'all';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <FlatList
          data={displayedStudents}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          ListHeaderComponent={
            <View>
              {/* Header */}
              <Header messName={settings.messName} />

              {/* In-app Expiry Notification Banner */}
              <NotificationBanner
                alerts={alerts}
                onPressAlert={(studentId) => router.push(`/students/${studentId}`)}
              />

              {/* Summary Cards */}
              <View style={styles.summaryGrid}>
                <View style={styles.summaryRow}>
                  <SummaryCard
                    title="Total Students"
                    count={stats.total}
                    type="total"
                    filterKey="all"
                    activeFilter={activeFilter}
                    onPress={setActiveFilter}
                  />
                  <SummaryCard
                    title="Active"
                    count={stats.active}
                    type="active"
                    filterKey="active"
                    activeFilter={activeFilter}
                    onPress={setActiveFilter}
                  />
                </View>
                <View style={styles.summaryRow}>
                  <SummaryCard
                    title="Expiring Soon"
                    count={stats.expiring}
                    type="expiring"
                    filterKey="expiring"
                    activeFilter={activeFilter}
                    onPress={setActiveFilter}
                  />
                  <SummaryCard
                    title="Expired"
                    count={stats.expired}
                    type="expired"
                    filterKey="expired"
                    activeFilter={activeFilter}
                    onPress={setActiveFilter}
                  />
                </View>
                <View style={[styles.summaryRow, { marginTop: 10 }]}>
                  <SummaryCard
                    title="Unpaid"
                    count={stats.unpaid}
                    type="unpaid"
                    filterKey="unpaid"
                    activeFilter={activeFilter}
                    onPress={setActiveFilter}
                  />
                  <SummaryCard
                    title="Paused"
                    count={stats.paused}
                    type="paused"
                    filterKey="paused"
                    activeFilter={activeFilter}
                    onPress={setActiveFilter}
                  />
                </View>
              </View>

              {/* Search Bar */}
              <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                onClear={() => setSearchQuery('')}
              />

              {/* Filter Chips & Sort Selector */}
              <FilterChips
                activeFilter={activeFilter}
                onSelectFilter={setActiveFilter}
                activeSort={activeSort}
                onSelectSort={setActiveSort}
              />

              {/* Quick Section: EXPIRING SOON (Shown only when in default unfiltered dashboard view) */}
              {isDefaultView && expiringStudents.length > 0 && (
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={[styles.sectionTitle, { color: COLORS.expiring }]}>
                      🟠 EXPIRING SOON ({expiringStudents.length})
                    </Text>
                  </View>
                  {expiringStudents.map((student) => (
                    <StudentCard
                      key={`expiring_${student.id}`}
                      student={student}
                      onPress={handleStudentPress}
                      onMarkAsPaid={handleOpenPaymentModal}
                      onPause={handleOpenPauseModal}
                      onResume={handleResumeSubscription}
                      warningDays={settings.warningDays}
                    />
                  ))}
                </View>
              )}

              {/* Quick Section: EXPIRED (Shown only when in default unfiltered dashboard view) */}
              {isDefaultView && expiredStudents.length > 0 && (
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={[styles.sectionTitle, { color: COLORS.expired }]}>
                      🔴 EXPIRED ({expiredStudents.length})
                    </Text>
                  </View>
                  {expiredStudents.map((student) => (
                    <StudentCard
                      key={`expired_${student.id}`}
                      student={student}
                      onPress={handleStudentPress}
                      onMarkAsPaid={handleOpenPaymentModal}
                      onPause={handleOpenPauseModal}
                      onResume={handleResumeSubscription}
                      warningDays={settings.warningDays}
                    />
                  ))}
                </View>
              )}

              {/* ALL STUDENTS SECTION HEADER */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>
                  {activeFilter === 'all'
                    ? 'ALL STUDENTS'
                    : `${activeFilter.toUpperCase()} STUDENTS`} ({displayedStudents.length})
                </Text>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <StudentCard
              student={item}
              onPress={handleStudentPress}
              onMarkAsPaid={handleOpenPaymentModal}
              onPause={handleOpenPauseModal}
              onResume={handleResumeSubscription}
              warningDays={settings.warningDays}
            />
          )}
          ListEmptyComponent={
            !loading ? (
              <EmptyState
                icon={searchQuery ? 'search-outline' : 'people-outline'}
                title={
                  searchQuery
                    ? `No students found matching "${searchQuery}"`
                    : activeFilter === 'expiring'
                    ? 'No subscriptions expiring soon.'
                    : activeFilter === 'expired'
                    ? 'All subscriptions are active!'
                    : 'No students added yet.'
                }
                message={
                  searchQuery
                    ? 'Try searching by name or phone number.'
                    : activeFilter === 'all'
                    ? 'Click below to add your first mess student.'
                    : undefined
                }
                buttonLabel={activeFilter === 'all' && !searchQuery ? '+ Add First Student' : undefined}
                onButtonPress={() => router.push('/students/add')}
              />
            ) : null
          }
          contentContainerStyle={styles.listContent}
        />

        {/* Floating Add Student Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/students/add')}
          style={styles.fab}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Payment Confirmation Modal */}
        <PaymentModal
          visible={paymentModalVisible}
          student={selectedStudentForPayment}
          onConfirm={handleConfirmPayment}
          onClose={() => setPaymentModalVisible(false)}
        />

        {/* Pause Date Picker Modal */}
        <DatePickerModal
          visible={pauseDateModalVisible}
          selectedDate={selectedPauseDate}
          onSelectDate={handleConfirmPause}
          onClose={() => setPauseDateModalVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  summaryGrid: {
    marginVertical: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  listContent: {
    paddingBottom: 90,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.large,
  },
});
