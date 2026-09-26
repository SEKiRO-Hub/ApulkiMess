import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { FilterStatus } from '../types';

interface Props {
  title: string;
  count: number;
  type: 'total' | 'active' | 'expiring' | 'expired' | 'unpaid' | 'paused';
  filterKey: FilterStatus;
  activeFilter: FilterStatus;
  onPress: (filter: FilterStatus) => void;
}

export const SummaryCard: React.FC<Props> = ({
  title,
  count,
  type,
  filterKey,
  activeFilter,
  onPress,
}) => {
  const isSelected = activeFilter === filterKey;

  const getTheme = () => {
    switch (type) {
      case 'active':
        return {
          color: COLORS.active,
          bg: COLORS.activeBg,
          icon: 'checkmark-circle-outline' as const,
        };
      case 'expiring':
        return {
          color: COLORS.expiring,
          bg: COLORS.expiringBg,
          icon: 'time-outline' as const,
        };
      case 'expired':
        return {
          color: COLORS.expired,
          bg: COLORS.expiredBg,
          icon: 'alert-circle-outline' as const,
        };
      case 'unpaid':
        return {
          color: COLORS.textMuted || '#9E9E9E',
          bg: '#F5F5F5',
          icon: 'wallet-outline' as const,
        };
      case 'paused':
        return {
          color: '#2196F3',
          bg: '#E3F2FD',
          icon: 'pause-circle-outline' as const,
        };
      case 'total':
      default:
        return {
          color: COLORS.primary,
          bg: COLORS.primaryLight,
          icon: 'people-outline' as const,
        };
    }
  };

  const theme = getTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress(filterKey)}
      style={[
        styles.card,
        isSelected && { borderColor: theme.color, borderWidth: 2, backgroundColor: theme.bg },
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconContainer, { backgroundColor: theme.bg }]}>
          <Ionicons name={theme.icon} size={20} color={theme.color} />
        </View>
        <Text style={[styles.countText, { color: theme.color }]}>{count}</Text>
      </View>
      <Text style={styles.titleText}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 24,
    fontWeight: '800',
  },
  titleText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
