import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Ticket } from '../types';

/**
 * Create a new ticket
 */
export const createTicket = async (
  userId: string,
  title: string,
  url?: string
): Promise<Ticket> => {
  try {
    const now = new Date();
    const ticketData = {
      title: title.trim(),
      url: url?.trim() || '',
      userId,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      totalTimeSpent: 0,
      status: 'open' as const,
    };

    const docRef = await addDoc(collection(db, 'tickets'), ticketData);

    return {
      id: docRef.id,
      title: ticketData.title,
      url: ticketData.url,
      userId: ticketData.userId,
      createdAt: now,
      updatedAt: now,
      totalTimeSpent: 0,
      status: 'open',
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to create ticket');
  }
};

/**
 * Get all tickets for a user
 */
export const getUserTickets = async (userId: string): Promise<Ticket[]> => {
  try {
    const q = query(
      collection(db, 'tickets'),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    
    const tickets: Ticket[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      tickets.push({
        id: doc.id,
        title: data.title,
        url: data.url,
        userId: data.userId,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        totalTimeSpent: data.totalTimeSpent,
        status: data.status,
      });
    });

    // Sort by createdAt in descending order (newest first)
    tickets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return tickets;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch tickets');
  }
};

/**
 * Format time duration in human-readable format
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};
