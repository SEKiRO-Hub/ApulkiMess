import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  startOfDay,
  subDays,
} from 'date-fns';
import { COLORS, SHADOWS } from '../constants/theme';

interface Props {
  visible: boolean;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onClose: () => void;
}

export const DatePickerModal: React.FC<Props> = ({
  visible,
  selectedDate,
  onSelectDate,
  onClose,
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(selectedDate || new Date());
  const [tempDate, setTempDate] = useState<Date>(selectedDate || new Date());

  useEffect(() => {
    if (visible) {
      setTempDate(selectedDate || new Date());
      setCurrentMonth(selectedDate || new Date());
    }
  }, [visible, selectedDate]);

  if (!visible) return null;

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const daysGrid = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleConfirm = () => {
    onSelectDate(tempDate);
    onClose();
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="calendar-outline" size={22} color={COLORS.primary} style={{ marginRight: 8 }} />
              <Text style={styles.title}>Select Start Date</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Quick Presets */}
          <View style={styles.presetsRow}>
            <TouchableOpacity
              style={[
                styles.presetChip,
                isSameDay(tempDate, new Date()) && styles.activePresetChip,
              ]}
              onPress={() => {
                const today = startOfDay(new Date());
                setTempDate(today);
                setCurrentMonth(today);
              }}
            >
              <Text
                style={[
                  styles.presetChipText,
                  isSameDay(tempDate, new Date()) && styles.activePresetChipText,
                ]}
              >
                Today
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.presetChip,
                isSameDay(tempDate, subDays(new Date(), 1)) && styles.activePresetChip,
              ]}
              onPress={() => {
                const yest = startOfDay(subDays(new Date(), 1));
                setTempDate(yest);
                setCurrentMonth(yest);
              }}
            >
              <Text
                style={[
                  styles.presetChipText,
                  isSameDay(tempDate, subDays(new Date(), 1)) && styles.activePresetChipText,
                ]}
              >
                Yesterday
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.presetChip,
                isSameDay(tempDate, startOfMonth(currentMonth)) && styles.activePresetChip,
              ]}
              onPress={() => {
                const firstDay = startOfMonth(currentMonth);
                setTempDate(firstDay);
              }}
            >
              <Text
                style={[
                  styles.presetChipText,
                  isSameDay(tempDate, startOfMonth(currentMonth)) && styles.activePresetChipText,
                ]}
              >
                1st of Month
              </Text>
            </TouchableOpacity>
          </View>

          {/* Month Navigation */}
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{format(currentMonth, 'MMMM yyyy')}</Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Weekday Labels */}
          <View style={styles.weekDaysRow}>
            {weekDays.map((day, idx) => (
              <Text key={idx} style={styles.weekDayText}>
                {day}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.grid}>
            {daysGrid.map((day, idx) => {
              const isSelected = isSameDay(day, tempDate);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isTodayDate = isToday(day);

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.dayCell,
                    isSelected && styles.selectedCell,
                    !isSelected && isTodayDate && styles.todayCell,
                  ]}
                  onPress={() => setTempDate(startOfDay(day))}
                >
                  <Text
                    style={[
                      styles.dayText,
                      !isCurrentMonth && styles.outsideMonthText,
                      isTodayDate && !isSelected && styles.todayText,
                      isSelected && styles.selectedDayText,
                    ]}
                  >
                    {format(day, 'd')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selected Date Summary */}
          <View style={styles.selectedSummary}>
            <Ionicons name="time-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.selectedSummaryText}>
              Selected: <Text style={{ fontWeight: '700', color: COLORS.primary }}>{format(tempDate, 'EEEE, dd MMMM yyyy')}</Text>
            </Text>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity activeOpacity={0.85} style={styles.confirmBtn} onPress={handleConfirm}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.confirmBtnText}>Set Payment Start Date</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 20,
    ...SHADOWS.medium,
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
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activePresetChip: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activePresetChipText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  navBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekDayText: {
    width: 40,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  dayCell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  todayCell: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  selectedCell: {
    backgroundColor: COLORS.primary,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  outsideMonthText: {
    color: COLORS.border,
  },
  todayText: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  selectedSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedSummaryText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  confirmBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
