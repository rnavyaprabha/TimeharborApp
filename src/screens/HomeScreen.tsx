import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Text,
  Platform,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { getUserTickets } from '../services/ticketService';
import {
  clockIn,
  getActiveSession,
  getRecentSessions,
  getDashboardStats,
  startTicketTracking,
  stopTicketTracking,
} from '../services/timeSessionService';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { TimeSession, Ticket, DashboardStats as DashboardStatsType } from '../types';

// Import components
import { DashboardStats } from '../components/DashboardStats';
import { TicketList } from '../components/TicketList';
import { RecentActivityList } from '../components/RecentActivityList';
import { useTeamUiStore } from '../store/teamUiStore';
import { useSessionStore } from '../store/sessionStore';

interface HomeScreenProps {
  onOpenActivity?: () => void;
  onOpenAddTicket?: () => void;
  onOpenTickets?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onOpenActivity,
  onOpenAddTicket,
  onOpenTickets,
}) => {
  const user = useAuthStore((state) => state.user);
  
  // State
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recentSessions, setRecentSessions] = useState<TimeSession[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const { teams, activeTeamId } = useTeamUiStore();
  const {
    activeSession,
    lastCompletedSession,
    setActiveSession,
    setLastCompletedSession,
  } = useSessionStore();
  const [stats, setStats] = useState<DashboardStatsType>({
    todayHours: 0,
    weekHours: 0,
    openTickets: 0,
    teamMembers: 1,
  });
  const statsRef = useRef<DashboardStatsType>({
    todayHours: 0,
    weekHours: 0,
    openTickets: 0,
    teamMembers: 1,
  });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeTicketElapsedSeconds, setActiveTicketElapsedSeconds] = useState(0);
  const [activeTicketId, setActiveTicketId] = useState<string | undefined>();

  // Timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const contentMaxWidth = 1180;

  /**
   * Load all dashboard data
   */
  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      const [userTickets, session, sessions] = await Promise.all([
        getUserTickets(user.uid, activeTeamId),
        getActiveSession(user.uid),
        getRecentSessions(user.uid, 10, activeTeamId),
      ]);

      setTickets(userTickets);
      setActiveSession(session);
      setRecentSessions(sessions.filter((s) => s.status === 'completed'));
      
      if (session) {
        setActiveTicketId(session.ticketId || undefined);
        // Calculate initial elapsed time
        const elapsed = Math.floor((Date.now() - session.startTime.getTime()) / 1000);
        setElapsedSeconds(elapsed);
      }

      // Get dashboard stats
      const dashStats = await getDashboardStats(user.uid, teams, activeTeamId);
      setStats(dashStats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, activeTeamId, teams, setActiveSession]);

  /**
   * Start timer when active session exists
   */
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  useEffect(() => {
    if (activeSession) {
      // Clear any existing timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Start new timer
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - activeSession.startTime.getTime()) / 1000);
        setElapsedSeconds(elapsed);
        if (activeSession.ticketStartTime) {
          const ticketElapsed = Math.floor(
            (Date.now() - activeSession.ticketStartTime.getTime()) / 1000
          );
          setActiveTicketElapsedSeconds(ticketElapsed);
        } else {
          setActiveTicketElapsedSeconds(0);
        }
      }, 1000);
    } else {
      // Clear timer when no active session
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setElapsedSeconds(0);
      setActiveTicketElapsedSeconds(0);
    }

    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [activeSession]);

  /**
   * Initial data load
   */
  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    if (!activeSession) {
      setActiveTicketId(undefined);
      return;
    }
    setActiveTicketId(activeSession.ticketId || undefined);
    if (activeSession.ticketStartTime) {
      setActiveTicketElapsedSeconds(
        Math.floor((Date.now() - activeSession.ticketStartTime.getTime()) / 1000)
      );
    } else {
      setActiveTicketElapsedSeconds(0);
    }
  }, [activeSession]);

  useEffect(() => {
    if (!lastCompletedSession) return;
    setRecentSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== lastCompletedSession.id);
      return [lastCompletedSession, ...filtered];
    });
    if (user) {
      setStats((prev) => {
        const next = {
          ...prev,
          todayHours: prev.todayHours + lastCompletedSession.duration,
          weekHours: prev.weekHours + lastCompletedSession.duration,
        };
        statsRef.current = next;
        return next;
      });
      setTimeout(() => {
        getDashboardStats(user.uid, teams, activeTeamId)
          .then((fresh) => {
            setStats((prev) => {
              if (fresh.todayHours < prev.todayHours || fresh.weekHours < prev.weekHours) {
                return prev;
              }
              statsRef.current = fresh;
              return fresh;
            });
          })
          .catch(() => {});
      }, 1200);
    }
    setLastCompletedSession(null);
  }, [lastCompletedSession, setLastCompletedSession, user, teams, activeTeamId]);

  /**
   * Handle refresh
   */
  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  /**
   * Handle starting work on a ticket
   */
  const handleStartTicket = async (ticket: Ticket) => {
    if (!user) return;

    try {
      if (activeSession) {
        // If same ticket is active -> stop tracking that ticket
        if (activeTicketId === ticket.id) {
          const stopped = await stopTicketTracking(activeSession.id);
          setActiveSession({
            ...activeSession,
            ticketId: undefined,
            ticketTitle: undefined,
            ticketStartTime: null,
          });
          setActiveTicketId(undefined);
          if (stopped?.ticketId) {
            setTickets((prev) =>
              prev.map((t) =>
                t.id === stopped.ticketId
                  ? {
                      ...t,
                      totalTimeSpent: t.totalTimeSpent + stopped.duration,
                      lastTrackedDuration: stopped.duration,
                    }
                  : t
              )
            );
          }
        } else {
          // Switch to this ticket within the same session
          const stopped = await stopTicketTracking(activeSession.id);
          await startTicketTracking(activeSession.id, ticket.id, ticket.title);
          setActiveSession({
            ...activeSession,
            ticketId: ticket.id,
            ticketTitle: ticket.title,
            ticketStartTime: new Date(),
          });
          setActiveTicketId(ticket.id);
          setTickets((prev) =>
            prev.map((t) =>
              t.id === ticket.id ? { ...t, lastTrackedDuration: 0 } : t
            )
          );
          if (stopped?.ticketId) {
            setTickets((prev) =>
              prev.map((t) =>
                t.id === stopped.ticketId
                  ? {
                      ...t,
                      totalTimeSpent: t.totalTimeSpent + stopped.duration,
                      lastTrackedDuration: stopped.duration,
                    }
                  : t
              )
            );
          }
        }
      } else {
        // Start new session with ticket
        const teamId = activeTeamId || (teams.length > 0 ? teams[0].id : undefined);
        const newSession = await clockIn(user.uid, ticket.id, ticket.title, teamId);
        setActiveSession(newSession);
        setActiveTicketId(ticket.id);
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticket.id ? { ...t, lastTrackedDuration: 0 } : t
          )
        );
        
        // Refresh stats
        const dashStats = await getDashboardStats(user.uid, teams, activeTeamId);
        setStats(dashStats);
      }
    } catch (error: any) {
      console.error('Start ticket error:', error);
      if (Platform.OS === 'web') {
        window.alert(error.message || 'Failed to start ticket');
      } else {
        Alert.alert('Error', error.message || 'Failed to start ticket');
      }
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.contentWidth, { maxWidth: contentMaxWidth }]}>
          {/* Dashboard Overview */}
          <View style={styles.dashboardCard}>
            <Text style={styles.dashboardTitle}>Dashboard Overview</Text>
            <DashboardStats stats={stats} />
          </View>

          {/* Open Tickets */}
          <View style={styles.sectionMargin}>
            <TicketList
              tickets={tickets}
              activeTicketId={activeTicketId}
              activeTicketElapsedSeconds={activeTicketElapsedSeconds}
              onStartTicket={handleStartTicket}
              onStopTicket={handleStartTicket}
              onAddTicket={onOpenAddTicket}
              onSeeAll={onOpenTickets}
            />
          </View>

          {/* Recent Activity */}
          <View style={styles.sectionMargin}>
            <RecentActivityList
              sessions={recentSessions}
              activeSession={activeSession}
              elapsedSeconds={elapsedSeconds}
              onSeeAll={onOpenActivity}
            />
          </View>

          {/* Spacer for clock button */}
          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundStart,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: 40,
    alignItems: 'center',
  },
  contentWidth: {
    width: '100%',
  },
  sectionMargin: {
    marginBottom: spacing.lg,
  },
  dashboardCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  dashboardTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    fontFamily: typography.fonts.bold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  bottomSpacer: {
    height: 0,
  },
});
