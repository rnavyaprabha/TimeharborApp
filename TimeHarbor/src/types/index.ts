// User type definition
export interface User {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Date;
}

// Auth state type
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

// Ticket type definition
export interface Ticket {
  id: string;
  title: string;
  url?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  totalTimeSpent: number; // in seconds
  status: 'open' | 'in_progress' | 'done';
}

// Team type definition
export interface Team {
  id: string;
  name: string;
  joinCode: string;
  ownerId: string;
  memberIds: string[];
  createdAt: Date;
}

// Time Session type definition
export interface TimeSession {
  id: string;
  userId: string;
  teamId?: string;
  ticketId?: string;
  ticketTitle?: string;
  startTime: Date;
  endTime: Date | null;
  duration: number; // in seconds
  status: 'active' | 'completed';
  createdAt: Date;
}

// Dashboard Stats type
export interface DashboardStats {
  todayHours: number; // in seconds
  weekHours: number; // in seconds
  openTickets: number;
  teamMembers: number;
}
