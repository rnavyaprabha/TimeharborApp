import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { TimeSession } from '../types';
import { formatTimer } from '../services/timeSessionService';

interface ActiveSessionCardProps {
  session: TimeSession;
  elapsedSeconds: number;
}

export const ActiveSessionCard: React.FC<ActiveSessionCardProps> = ({
  session,
  elapsedSeconds,
}) => {
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={20}
            color={colors.success}
          />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Work Session</Text>
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>Active</Text>
          </View>
        </View>
        <View style={styles.timerBadge}>
          <Text style={styles.timerText}>{formatTimer(elapsedSeconds)}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <Text style={styles.statusText}>
          {session.ticketTitle ? `Working on: ${session.ticketTitle}` : 'Clocked In'}
        </Text>
        <Text style={styles.timeText}>
          {formatDate(session.startTime)}, {formatTime(session.startTime)} - Now
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  activeBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  activeBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textOnPrimary,
  },
  timerBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  timerText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textOnPrimary,
  },
  details: {
    marginLeft: 48,
  },
  statusText: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  timeText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
});
