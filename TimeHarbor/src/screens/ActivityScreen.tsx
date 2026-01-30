import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { getRecentSessions } from '../services/timeSessionService';
import { TimeSession } from '../types';
import { formatTimer, formatDurationShort } from '../services/timeSessionService';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { useSessionStore } from '../store/sessionStore';

interface ActivityScreenProps {
  onBack: () => void;
}

export const ActivityScreen: React.FC<ActivityScreenProps> = ({ onBack }) => {
  const user = useAuthStore((s) => s.user);
  const [sessions, setSessions] = useState<TimeSession[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { activeSession, lastCompletedSession, setLastCompletedSession } = useSessionStore();

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const recent = await getRecentSessions(user.uid, 50);
      setSessions(recent);
    };
    load();
  }, [user]);

  useEffect(() => {
    if (activeSession) {
      setElapsed(Math.floor((Date.now() - activeSession.startTime.getTime()) / 1000));
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - activeSession.startTime.getTime()) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      setElapsed(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSession]);

  useEffect(() => {
    if (!lastCompletedSession) return;
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== lastCompletedSession.id);
      return [lastCompletedSession, ...filtered];
    });
    setLastCompletedSession(null);
  }, [lastCompletedSession, setLastCompletedSession]);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });

  const allSessions = activeSession
    ? [activeSession, ...sessions.filter((s) => s.id !== activeSession.id)]
    : sessions;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>All Activity</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {allSessions.length === 0 ? (
          <Text style={styles.emptyText}>No activity found</Text>
        ) : (
          allSessions.map((session) => {
            const isActive = session.status === 'active';
            return (
              <View key={session.id} style={[styles.row, isActive && styles.rowActive]}>
                <View style={styles.rowIcon}>
                  <MaterialCommunityIcons name="clock-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.rowContent}>
                  <View style={styles.rowHeader}>
                    <Text style={styles.rowTitle}>Work Session</Text>
                    {isActive && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>Active</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.rowSubtitle}>
                    {session.note
                      ? session.note
                      : session.ticketTitle
                        ? `Working on: ${session.ticketTitle}`
                        : 'Clocked In'}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {formatDate(session.startTime)}, {formatTime(session.startTime)} -{' '}
                    {isActive ? 'Now' : session.endTime ? formatTime(session.endTime) : 'N/A'}
                  </Text>
                </View>
                <View style={[styles.durationBadge, isActive && styles.durationBadgeActive]}>
                  <Text style={[styles.durationText, isActive && styles.durationTextActive]}>
                    {isActive ? formatTimer(elapsed) : formatDurationShort(session.duration)}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundStart,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    fontFamily: typography.fonts.bold,
    color: colors.textPrimary,
  },
  content: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  rowActive: {
    backgroundColor: '#DCFCE7',
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rowContent: {
    flex: 1,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowTitle: {
    fontWeight: typography.weights.semibold,
    fontFamily: typography.fonts.semibold,
    color: colors.textPrimary,
  },
  activeBadge: {
    backgroundColor: '#BBF7D0',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  activeBadgeText: {
    fontSize: 10,
    color: '#166534',
    fontWeight: typography.weights.semibold,
  },
  rowSubtitle: {
    color: colors.textSecondary,
    marginTop: 2,
    fontFamily: typography.fonts.medium,
  },
  rowMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  durationBadge: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  durationBadgeActive: {
    backgroundColor: colors.success,
  },
  durationText: {
    color: colors.textSecondary,
    fontWeight: typography.weights.semibold,
    fontFamily: typography.fonts.semibold,
  },
  durationTextActive: {
    color: colors.textOnPrimary,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
  },
});
