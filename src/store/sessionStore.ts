import { create } from 'zustand';
import { TimeSession } from '../types';

interface SessionState {
  activeSession: TimeSession | null;
  lastCompletedSession: TimeSession | null;
  setActiveSession: (session: TimeSession | null) => void;
  setLastCompletedSession: (session: TimeSession | null) => void;
  resetSessionState: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  activeSession: null,
  lastCompletedSession: null,
  setActiveSession: (session) => set({ activeSession: session }),
  setLastCompletedSession: (session) => set({ lastCompletedSession: session }),
  resetSessionState: () => set({ activeSession: null, lastCompletedSession: null }),
}));
