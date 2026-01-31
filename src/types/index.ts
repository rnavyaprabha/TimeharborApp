// User type definition
export interface User {
  uid: string;
  email: string;
  displayName: string;
  role?: string;
  teamIds?: string[];
  fcmToken?: string;
  expoPushToken?: string;
  apnsToken?: string;
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
  description?: string;
  url?: string;
  priority?: 'Low' | 'Medium' | 'High';
  userId: string; // creator
  teamId?: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  totalTimeSpent: number; // in seconds
  lastTrackedDuration?: number; // in seconds (most recent session)
  status: 'Open' | 'In Progress' | 'Closed';
  assignee?: {
    id: string;
    full_name: string;
    email: string;
  };
}

// Team type definition
export interface Team {
  id: string;
  name: string;
  joinCode: string;
  ownerId: string;
  memberIds: string[];
  createdAt: Date;
  members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  name: string;
  email?: string;
  role: 'Leader' | 'Member';
  status?: 'online' | 'offline';
}

// Time Session type definition
export interface TimeSession {
  id: string;
  userId: string;
  teamId?: string;
  ticketId?: string;
  ticketTitle?: string;
  ticketStartTime?: Date | null;
  note?: string;
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
