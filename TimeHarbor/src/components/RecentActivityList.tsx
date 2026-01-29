import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { TimeSession } from '../types';
import { formatTimer, formatDurationShort } from '../services/timeSessionService';

interface RecentActivityListProps {
  sessions: TimeSession[];
  activeSession: TimeSession | null;
  elapsedSeconds: number;
  onSeeAll?: () => void;
  maxItems?: number;
}

export const RecentActivityList: React.FC<RecentActivityListProps> = ({
  sessions,
  activeSession,
  elapsedSeconds,
  onSeeAll,
  maxItems = 5,
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

  const renderSession = ({ item, index }: { item: TimeSession; index: number }) => {
    const isActive = item.status === 'active';

    return (
      <View style={[styles.sessionRow, isActive && styles.sessionRowActive]}>
        <View style={[styles.sessionIcon, isActive && styles.sessionIconActive]}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={18}
            color={isActive ? colors.success : colors.primary}
          />
        </View>

        <View style={styles.sessionContent}>
          <View style={styles.sessionHeader}>
            <Text style={styles.sessionTitle}>Work Session</Text>
            {isActive && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
            )}
          </View>
          <Text style={styles.sessionDescription}>
            {item.ticketTitle ? `Worked on: ${item.ticketTitle}` : 'No tickets recorded'}
          </Text>
          <Text style={styles.sessionTime}>
            {formatDate(item.startTime)}, {formatTime(item.startTime)} -{' '}
            {isActive ? 'Now' : item.endTime ? formatTime(item.endTime) : 'N/A'}
          </Text>
        </View>

        <View style={[styles.durationBadge, isActive && styles.durationBadgeActive]}>
          <Text style={[styles.durationText, isActive && styles.durationTextActive]}>
            {isActive ? formatTimer(elapsedSeconds) : formatDurationShort(item.duration)}
          </Text>
        </View>
      </View>
    );
  };

  // Combine active session with recent sessions
  const allSessions = activeSession
    ? [activeSession, ...sessions.filter((s) => s.id !== activeSession.id)]
    : sessions;
  const displaySessions = allSessions.slice(0, maxItems);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {onSeeAll && (
          <TouchableOpacity style={styles.seeAllButton} onPress={onSeeAll}>
            <Text style={styles.seeAllText}>See All</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={18}
              color={colors.primary}
            />
          </TouchableOpacity>
        )}
      </View>

      {displaySessions.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={48}
            color={colors.textMuted}
          />
          <Text style={styles.emptyTitle}>No Activity Yet</Text>
          <Text style={styles.emptyText}>
            Clock in to start tracking your work time
          </Text>
        </View>
      ) : (
        <FlatList
          data={displaySessions}
          renderItem={renderSession}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  sessionRowActive: {
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  sessionIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  sessionIconActive: {
    backgroundColor: colors.surface,
  },
  sessionContent: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  sessionTitle: {
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
  sessionDescription: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  sessionTime: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  durationBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  durationBadgeActive: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  durationText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  durationTextActive: {
    color: colors.textOnPrimary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
