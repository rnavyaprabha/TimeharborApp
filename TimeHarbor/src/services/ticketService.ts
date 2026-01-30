import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Ticket } from '../types';

export interface CreateTicketData {
  title: string;
  description?: string;
  status?: Ticket['status'];
  priority?: Ticket['priority'];
  link?: string;
  assignedTo?: string;
}

export interface UpdateTicketData {
  title?: string;
  description?: string;
  status?: Ticket['status'];
  priority?: Ticket['priority'];
  link?: string;
  assignedTo?: string;
}

const normalizeStatus = (status?: string): Ticket['status'] => {
  if (status === 'open' || status === 'Open') return 'Open';
  if (status === 'in_progress' || status === 'In Progress') return 'In Progress';
  if (status === 'done' || status === 'Closed') return 'Closed';
  return 'Open';
};

export const createTicket = async (
  userId: string,
  title: string,
  url?: string,
  teamId?: string,
  assignedTo?: string,
  description?: string,
  priority: Ticket['priority'] = 'Medium',
  status: Ticket['status'] = 'Open'
): Promise<Ticket> => {
  try {
    const now = new Date();
    const ticketData = {
      title: title.trim(),
      url: url?.trim() || '',
      userId,
      teamId: teamId || null,
      assignedTo: assignedTo || userId,
      description: description?.trim() || '',
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      totalTimeSpent: 0,
      lastTrackedDuration: 0,
      status: normalizeStatus(status),
      priority,
    };

    const docRef = await addDoc(collection(db, 'tickets'), ticketData);

    return {
      id: docRef.id,
      title: ticketData.title,
      url: ticketData.url,
      userId: ticketData.userId,
      teamId: teamId || undefined,
      assignedTo: ticketData.assignedTo || undefined,
      description: ticketData.description || undefined,
      createdAt: now,
      updatedAt: now,
      totalTimeSpent: 0,
      lastTrackedDuration: 0,
      status: normalizeStatus(status),
      priority,
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to create ticket');
  }
};

export const createTicketForTeam = async (
  teamId: string,
  data: CreateTicketData,
  userId: string
): Promise<Ticket> => {
  return createTicket(
    userId,
    data.title,
    data.link,
    teamId,
    data.assignedTo,
    data.description,
    data.priority || 'Medium',
    data.status || 'Open'
  );
};

export const getTickets = async (
  teamId: string,
  options?: { sort?: string; status?: string }
): Promise<Ticket[]> => {
  try {
    let q = query(collection(db, 'tickets'), where('teamId', '==', teamId));
    if (options?.status) {
      q = query(collection(db, 'tickets'), where('teamId', '==', teamId), where('status', '==', options.status));
    }
    const snapshot = await getDocs(q);
    const tickets: Ticket[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      tickets.push({
        id: docSnap.id,
        title: data.title,
        url: data.url,
        userId: data.userId,
        teamId: data.teamId || undefined,
        assignedTo: data.assignedTo || undefined,
        description: data.description || undefined,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        totalTimeSpent: data.totalTimeSpent || 0,
        lastTrackedDuration: data.lastTrackedDuration || 0,
        status: normalizeStatus(data.status),
        priority: data.priority || 'Medium',
      });
    });
    tickets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return tickets;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch tickets');
  }
};

export const getUserTickets = async (userId: string, teamId?: string): Promise<Ticket[]> => {
  try {
    const assignedQuery = query(
      collection(db, 'tickets'),
      where('assignedTo', '==', userId)
    );
    const createdQuery = query(
      collection(db, 'tickets'),
      where('userId', '==', userId)
    );

    const [assignedSnap, createdSnap] = await Promise.all([
      getDocs(assignedQuery),
      getDocs(createdQuery),
    ]);

    const ticketsMap = new Map<string, Ticket>();

    const ingest = (snap: any) => {
      snap.forEach((doc: any) => {
        const data = doc.data();
        ticketsMap.set(doc.id, {
          id: doc.id,
          title: data.title,
          url: data.url,
          userId: data.userId,
          teamId: data.teamId || undefined,
          assignedTo: data.assignedTo || undefined,
          description: data.description || undefined,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          totalTimeSpent: data.totalTimeSpent || 0,
          lastTrackedDuration: data.lastTrackedDuration || 0,
          status: normalizeStatus(data.status),
          priority: data.priority || 'Medium',
        });
      });
    };

    ingest(assignedSnap);
    ingest(createdSnap);

    let tickets = Array.from(ticketsMap.values());
    if (teamId) {
      tickets = tickets.filter((t) => t.teamId === teamId);
    }
    tickets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return tickets;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch tickets');
  }
};

export const updateTicket = async (
  teamId: string,
  ticketId: string,
  data: UpdateTicketData
): Promise<void> => {
  await updateDoc(doc(db, 'tickets', ticketId), {
    ...data,
    updatedAt: Timestamp.fromDate(new Date()),
  });
};

export const deleteTicket = async (teamId: string, ticketId: string): Promise<void> => {
  await deleteDoc(doc(db, 'tickets', ticketId));
};

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};
