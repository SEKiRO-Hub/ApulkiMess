import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SubscriptionStatus } from '../types';
import { COLORS } from '../constants/theme';

interface Props {
  status: SubscriptionStatus;
  daysRemaining?: number;
  size?: 'small' | 'medium' | 'large';
}

export const StatusBadge: React.FC<Props> = ({ status, daysRemaining, size = 'medium' }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'active':
        return {
          bg: COLORS.activeBg,
          border: COLORS.activeBorder,
          text: COLORS.active,
          dot: '🟢',
          label: 'Active',
        };
      case 'expiring':
        return {
          bg: COLORS.expiringBg,
          border: COLORS.expiringBorder,
          text: COLORS.expiring,
          dot: '🟠',
          label: daysRemaining === 0 ? 'Expires Today' : daysRemaining === 1 ? 'Expires Tomorrow' : 'Expiring Soon',
        };
      case 'expired':
        return {
          bg: COLORS.expiredBg,
          border: COLORS.expiredBorder,
          text: COLORS.expired,
          dot: '🔴',
          label: 'Expired',
        };
      case 'unpaid':
      default:
        return {
          bg: COLORS.unpaidBg,
          border: COLORS.unpaidBorder,
          text: COLORS.unpaid,
          dot: '⚪',
          label: 'Unpaid',
        };
    }
  };

  const badge = getBadgeStyle();
  const isSmall = size === 'small';
  const isLarge = size === 'large';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: badge.bg, borderColor: badge.border },
        isSmall && styles.containerSmall,
        isLarge && styles.containerLarge,
      ]}
    >
      <Text style={[styles.dot, isSmall && styles.dotSmall]}>{badge.dot}</Text>
      <Text
        style={[
          styles.text,
          { color: badge.text },
          isSmall && styles.textSmall,
          isLarge && styles.textLarge,
        ]}
      >
        {badge.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  containerSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  containerLarge: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 24,
  },
  dot: {
    fontSize: 10,
    marginRight: 6,
  },
  dotSmall: {
    fontSize: 8,
    marginRight: 4,
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
  },
  textSmall: {
    fontSize: 11,
    fontWeight: '600',
  },
  textLarge: {
    fontSize: 15,
    fontWeight: '700',
  },
});
