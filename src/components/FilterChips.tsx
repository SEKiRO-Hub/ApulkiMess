import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FilterStatus, SortOption } from '../types';
import { COLORS } from '../constants/theme';

interface Props {
  activeFilter: FilterStatus;
  onSelectFilter: (filter: FilterStatus) => void;
  activeSort: SortOption;
  onSelectSort: (sort: SortOption) => void;
}

export const FilterChips: React.FC<Props> = ({
  activeFilter,
  onSelectFilter,
  activeSort,
  onSelectSort,
}) => {
  const filters: { key: FilterStatus; label: string; countBadge?: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: '🟢 Active' },
    { key: 'expiring', label: '🟠 Expiring Soon' },
    { key: 'expired', label: '🔴 Expired' },
    { key: 'unpaid', label: '⚪ Unpaid' },
    { key: 'paused', label: '⏸️ Paused' },
  ];

  const sortOptions: { key: SortOption; label: string }[] = [
    { key: 'name_asc', label: 'Name A-Z' },
    { key: 'name_desc', label: 'Name Z-A' },
    { key: 'expiry_asc', label: 'Expiry Date' },
    { key: 'recently_paid', label: 'Recently Paid' },
  ];

  const cycleSort = () => {
    const currentIndex = sortOptions.findIndex((s) => s.key === activeSort);
    const nextIndex = (currentIndex + 1) % sortOptions.length;
    onSelectSort(sortOptions[nextIndex].key);
  };

  const currentSortLabel = sortOptions.find((s) => s.key === activeSort)?.label || 'Sort';

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={cycleSort}
          style={styles.sortButton}
        >
          <Ionicons name="swap-vertical" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
          <Text style={styles.sortText}>{currentSortLabel}</Text>
        </TouchableOpacity>

        {filters.map((item) => {
          const isSelected = activeFilter === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.8}
              onPress={() => onSelectFilter(item.key)}
              style={[
                styles.chip,
                isSelected && styles.chipSelected,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextSelected,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 6,
  },
  scrollContainer: {
    paddingRight: 10,
    alignItems: 'center',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  sortText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  chip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipSelected: {
    backgroundColor: COLORS.textPrimary,
    borderColor: COLORS.textPrimary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
