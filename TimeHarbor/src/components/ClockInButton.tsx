import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { formatTimer } from '../services/timeSessionService';

interface ClockInButtonProps {
  isActive: boolean;
  elapsedSeconds: number;
  onPress: () => void;
  disabled?: boolean;
}

// Bottom bar style button to mirror the provided web screenshot
export const ClockInButton: React.FC<ClockInButtonProps> = ({
  isActive,
  elapsedSeconds,
  onPress,
  disabled = false,
}) => {
  const circleColor = isActive ? colors.error : colors.primary;
  const labelTitle = isActive ? 'Session Active' : 'Ready to Work?';
  const labelSubtitle = isActive ? 'Click to Clock Out' : 'Click to Clock In';

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[styles.container, disabled && styles.disabled]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.9}
      >
        <View style={[styles.circle, { backgroundColor: circleColor }]}>
          <Text style={styles.circleTimer}>{formatTimer(elapsedSeconds)}</Text>
        </View>

        <View style={styles.labelContainer}>
          <Text style={styles.title}>{labelTitle}</Text>
          <Text style={[styles.subtitle, isActive && styles.subtitleActive]}>
            {labelSubtitle}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.OS === 'ios' ? 18 : 12,
    alignItems: 'center',
    zIndex: 200,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    ...shadows.lg,
    minWidth: 280,
  },
  disabled: {
    opacity: 0.7,
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  circleTimer: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textOnPrimary,
  },
  labelContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
  },
  subtitleActive: {
    color: colors.error,
  },
});
