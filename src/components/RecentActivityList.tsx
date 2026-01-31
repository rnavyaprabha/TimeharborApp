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

  const renderSession = ({ item }: { item: TimeSession }) => {
    const isActive = item.status === 'active';

    return (
      <View style={[styles.sessionRow, isActive && styles.sessionRowActive]}>
        <View style={[styles.sessionIcon, isActive && styles.sessionIconActive]}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={16}
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
            {item.note
              ? item.note
              : item.ticketTitle
                ? `Working on: ${item.ticketTitle}`
                : 'Clocked In'}
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
              size={16}
              color={colors.primary}
            />
          </TouchableOpacity>
        )}
      </View>

      {displaySessions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No recent activity</Text>
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
    fontFamily: typography.fonts.bold,
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
    fontFamily: typography.fonts.medium,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sessionRowActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  sessionIcon: {
    width: 30,
    height: 30,
    borderRadius: borderRadius.full,
    backgroundColor: colors.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  sessionIconActive: {
    backgroundColor: '#DCFCE7',
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
    fontFamily: typography.fonts.semibold,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  activeBadge: {
    backgroundColor: '#BBF7D0',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.semibold,
    color: '#166534',
  },
  sessionDescription: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: 2,
    fontFamily: typography.fonts.medium,
  },
  sessionTime: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontFamily: typography.fonts.medium,
  },
  durationBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.borderLight,
  },
  durationBadgeActive: {
    backgroundColor: colors.success,
  },
  durationText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    fontFamily: typography.fonts.semibold,
    color: colors.textSecondary,
  },
  durationTextActive: {
    color: colors.textOnPrimary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    fontFamily: typography.fonts.medium,
  },
});
