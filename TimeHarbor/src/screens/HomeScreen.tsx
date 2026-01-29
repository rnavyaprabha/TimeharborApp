import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { getUserTeams } from '../services/teamService';
import { getUserTickets } from '../services/ticketService';
import {
  clockIn,
  clockOut,
  getActiveSession,
  getRecentSessions,
  getDashboardStats,
  updateSessionTicket,
} from '../services/timeSessionService';
import { colors, spacing } from '../theme';
import { TimeSession, Ticket, DashboardStats as DashboardStatsType, Team } from '../types';

// Import components
import { ClockInButton } from '../components/ClockInButton';
import { ActiveSessionCard } from '../components/ActiveSessionCard';
import { DashboardStats } from '../components/DashboardStats';
import { TicketList } from '../components/TicketList';
import { RecentActivityList } from '../components/RecentActivityList';

export const HomeScreen: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  
  // State
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<TimeSession | null>(null);
  const [recentSessions, setRecentSessions] = useState<TimeSession[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [stats, setStats] = useState<DashboardStatsType>({
    todayHours: 0,
    weekHours: 0,
    openTickets: 0,
    teamMembers: 1,
  });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
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
      const [userTeams, userTickets, session, sessions] = await Promise.all([
        getUserTeams(user.uid),
        getUserTickets(user.uid),
        getActiveSession(user.uid),
        getRecentSessions(user.uid, 10),
      ]);

      setTeams(userTeams);
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
      const dashStats = await getDashboardStats(user.uid, userTeams);
      setStats(dashStats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  /**
   * Start timer when active session exists
   */
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
      }, 1000);
    } else {
      // Clear timer when no active session
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setElapsedSeconds(0);
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

  /**
   * Handle refresh
   */
  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  /**
   * Handle clock in/out
   */
  const handleClockInOut = async () => {
    if (!user) return;

    try {
      if (activeSession) {
        // Clock out
        const completedSession = await clockOut(activeSession.id);
        setActiveSession(null);
        setActiveTicketId(undefined);
        setElapsedSeconds(0);
        
        // Add to recent sessions
        setRecentSessions((prev) => [completedSession, ...prev]);

        // Optimistically update stats locally so UI reflects immediately
        setStats((prev) => ({
          ...prev,
          todayHours: prev.todayHours + completedSession.duration,
          weekHours: prev.weekHours + completedSession.duration,
        }));
        
        // Refresh stats
        const dashStats = await getDashboardStats(user.uid, teams);
        setStats(dashStats);

        // Show confirmation
        if (Platform.OS === 'web') {
          // Don't show alert on web, just update UI
        } else {
          Alert.alert('Clocked Out', 'Your session has been saved.');
        }
      } else {
        // Clock in
        const teamId = teams.length > 0 ? teams[0].id : undefined;
        const newSession = await clockIn(user.uid, undefined, undefined, teamId);
        setActiveSession(newSession);
        
        // Refresh stats
        const dashStats = await getDashboardStats(user.uid, teams);
        setStats(dashStats);
      }
    } catch (error: any) {
      console.error('Clock in/out error:', error);
      if (Platform.OS === 'web') {
        window.alert(error.message || 'Failed to clock in/out');
      } else {
        Alert.alert('Error', error.message || 'Failed to clock in/out');
      }
    }
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
          await updateSessionTicket(activeSession.id, undefined, undefined);
          setActiveSession({
            ...activeSession,
            ticketId: undefined,
            ticketTitle: undefined,
          });
          setActiveTicketId(undefined);
        } else {
          // Switch to this ticket within the same session
          await updateSessionTicket(activeSession.id, ticket.id, ticket.title);
          setActiveSession({
            ...activeSession,
            ticketId: ticket.id,
            ticketTitle: ticket.title,
          });
          setActiveTicketId(ticket.id);
        }
      } else {
        // Start new session with ticket
        const teamId = teams.length > 0 ? teams[0].id : undefined;
        const newSession = await clockIn(user.uid, ticket.id, ticket.title, teamId);
        setActiveSession(newSession);
        setActiveTicketId(ticket.id);
        
        // Refresh stats
        const dashStats = await getDashboardStats(user.uid, teams);
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
          {/* Dashboard Stats */}
          <View style={styles.sectionMargin}>
            <DashboardStats stats={stats} />
          </View>

          {/* Open Tickets */}
          <View style={styles.sectionMargin}>
            <TicketList
              tickets={tickets}
              activeTicketId={activeTicketId}
              activeTicketElapsedSeconds={elapsedSeconds}
              onStartTicket={handleStartTicket}
              onStopTicket={handleStartTicket}
              onSeeAll={() => {}}
            />
          </View>

          {/* Recent Activity */}
          <View style={styles.sectionMargin}>
            <RecentActivityList
              sessions={recentSessions}
              activeSession={activeSession}
              elapsedSeconds={elapsedSeconds}
              onSeeAll={() => {}}
            />
          </View>

          {/* Spacer for clock button */}
          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

      {/* Clock In/Out Button */}
      <ClockInButton
        isActive={!!activeSession}
        elapsedSeconds={elapsedSeconds}
        onPress={handleClockInOut}
        disabled={loading}
      />
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
    paddingTop: Platform.OS === 'ios' ? spacing.xxxl + 40 : spacing.xl,
    paddingBottom: 120, // Space for clock button
    alignItems: 'center',
  },
  contentWidth: {
    width: '100%',
  },
  sectionMargin: {
    marginBottom: spacing.lg,
  },
  bottomSpacer: {
    height: 20,
  },
});
