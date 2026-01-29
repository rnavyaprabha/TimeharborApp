import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { TimeSession, DashboardStats, Ticket } from '../types';

/**
 * Start a new time session (clock in)
 */
export const clockIn = async (
  userId: string,
  ticketId?: string,
  ticketTitle?: string,
  teamId?: string
): Promise<TimeSession> => {
  try {
    const now = new Date();
    
    const sessionData = {
      userId,
      teamId: teamId || null,
      ticketId: ticketId || null,
      ticketTitle: ticketTitle || null,
      startTime: Timestamp.fromDate(now),
      endTime: null,
      duration: 0,
      status: 'active' as const,
      createdAt: Timestamp.fromDate(now),
    };

    const docRef = await addDoc(collection(db, 'timeSessions'), sessionData);

    return {
      id: docRef.id,
      userId,
      teamId,
      ticketId,
      ticketTitle,
      startTime: now,
      endTime: null,
      duration: 0,
      status: 'active',
      createdAt: now,
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to clock in');
  }
};

/**
 * End a time session (clock out)
 */
export const clockOut = async (sessionId: string): Promise<TimeSession> => {
  try {
    const sessionRef = doc(db, 'timeSessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
      throw new Error('Session not found');
    }

    const sessionData = sessionSnap.data();
    const now = new Date();
    const startTime = sessionData.startTime.toDate();
    const duration = Math.floor((now.getTime() - startTime.getTime()) / 1000);

    await updateDoc(sessionRef, {
      endTime: Timestamp.fromDate(now),
      duration,
      status: 'completed',
    });

    // If there's a ticket associated, update its total time
    if (sessionData.ticketId) {
      const ticketRef = doc(db, 'tickets', sessionData.ticketId);
      const ticketSnap = await getDoc(ticketRef);
      if (ticketSnap.exists()) {
        const ticketData = ticketSnap.data();
        await updateDoc(ticketRef, {
          totalTimeSpent: (ticketData.totalTimeSpent || 0) + duration,
          updatedAt: Timestamp.fromDate(now),
        });
      }
    }

    return {
      id: sessionId,
      userId: sessionData.userId,
      teamId: sessionData.teamId,
      ticketId: sessionData.ticketId,
      ticketTitle: sessionData.ticketTitle,
      startTime,
      endTime: now,
      duration,
      status: 'completed',
      createdAt: sessionData.createdAt.toDate(),
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to clock out');
  }
};

/**
 * Get active session for a user
 */
export const getActiveSession = async (userId: string): Promise<TimeSession | null> => {
  try {
    const q = query(
      collection(db, 'timeSessions'),
      where('userId', '==', userId),
      where('status', '==', 'active'),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    return {
      id: doc.id,
      userId: data.userId,
      teamId: data.teamId,
      ticketId: data.ticketId,
      ticketTitle: data.ticketTitle,
      startTime: data.startTime.toDate(),
      endTime: null,
      duration: 0,
      status: 'active',
      createdAt: data.createdAt.toDate(),
    };
  } catch (error: any) {
    console.error('Error getting active session:', error);
    return null;
  }
};

/**
 * Get recent sessions for a user
 */
export const getRecentSessions = async (
  userId: string,
  limitCount: number = 10
): Promise<TimeSession[]> => {
  try {
    // To avoid composite index requirements, fetch by userId and sort client-side
    const q = query(collection(db, 'timeSessions'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const sessions: TimeSession[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      sessions.push({
        id: doc.id,
        userId: data.userId,
        teamId: data.teamId,
        ticketId: data.ticketId,
        ticketTitle: data.ticketTitle,
        startTime: data.startTime.toDate(),
        endTime: data.endTime ? data.endTime.toDate() : null,
        duration: data.duration || 0,
        status: data.status,
        createdAt: data.createdAt.toDate(),
      });
    });

    // Sort by startTime desc then createdAt desc
    sessions.sort((a, b) => {
      const aStart = a.startTime?.getTime() || 0;
      const bStart = b.startTime?.getTime() || 0;
      return bStart - aStart;
    });

    return sessions.slice(0, limitCount);
  } catch (error: any) {
    console.error('Error getting recent sessions:', error);
    return [];
  }
};

/**
 * Get dashboard stats for a user
 */
export const getDashboardStats = async (
  userId: string,
  teams: { memberIds: string[] }[]
): Promise<DashboardStats> => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)

    const getStart = (data: any): Date | null => {
      if (data.startTime?.toDate) return data.startTime.toDate();
      if (data.createdAt?.toDate) return data.createdAt.toDate();
      return null;
    };

    const computeDuration = (data: any, nowDate: Date): number => {
      const start = getStart(data);
      if (!start) return 0;

      // Use stored duration if available and completed
      if (data.status === 'completed') {
        if (typeof data.duration === 'number' && data.duration > 0) return data.duration;
        if (data.endTime?.toDate) {
          const end = data.endTime.toDate();
          return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
        }
      }

      // Active session: compute running
      const end = data.endTime?.toDate ? data.endTime.toDate() : nowDate;
      return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
    };

    // Fetch all sessions for this user (avoids composite index requirements)
    const sessionsQuery = query(collection(db, 'timeSessions'), where('userId', '==', userId));
    const sessionsSnap = await getDocs(sessionsQuery);

    // Get open tickets count
    const ticketsQuery = query(
      collection(db, 'tickets'),
      where('userId', '==', userId),
      where('status', 'in', ['open', 'in_progress'])
    );

    const [ticketsSnap] = await Promise.all([getDocs(ticketsQuery)]);

    // Calculate today's hours
    let todaySeconds = 0;
    // Calculate week's hours
    let weekSeconds = 0;

    sessionsSnap.forEach((doc) => {
      const data = doc.data();
      const start = getStart(data);
      if (!start) return;

      const duration = computeDuration(data, now);

      if (start >= todayStart) {
        todaySeconds += duration;
      }
      if (start >= weekStart) {
        weekSeconds += duration;
      }
    });

    // Count team members
    let teamMembers = 0;
    teams.forEach((team) => {
      teamMembers += team.memberIds.length;
    });

    return {
      todayHours: todaySeconds,
      weekHours: weekSeconds,
      openTickets: ticketsSnap.size,
      teamMembers: teamMembers || 1, // At least count the user
    };
  } catch (error: any) {
    console.error('Error getting dashboard stats:', error);
    return {
      todayHours: 0,
      weekHours: 0,
      openTickets: 0,
      teamMembers: 1,
    };
  }
};

/**
 * Update active session with a ticket
 */
export const updateSessionTicket = async (
  sessionId: string,
  ticketId?: string,
  ticketTitle?: string
): Promise<void> => {
  try {
    const sessionRef = doc(db, 'timeSessions', sessionId);
    await updateDoc(sessionRef, {
      ticketId: ticketId ?? null,
      ticketTitle: ticketTitle ?? null,
    });
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update session');
  }
};

/**
 * Format seconds to HH:MM:SS
 */
export const formatTimer = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format seconds to Xh Xm format
 */
export const formatDurationShort = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }

  if (mins > 0) {
    return `${mins}m`;
  }

  // Show seconds when under 1 minute so short sessions display correctly
  return `${secs}s`;
};
