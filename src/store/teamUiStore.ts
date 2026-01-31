import { create } from 'zustand';
import { Team } from '../types';

interface TeamUiState {
  teams: Team[];
  activeTeamId?: string;
  setTeams: (teams: Team[]) => void;
  setActiveTeamId: (teamId?: string) => void;
}

export const useTeamUiStore = create<TeamUiState>((set) => ({
  teams: [],
  activeTeamId: undefined,
  setTeams: (teams) => set({ teams }),
  setActiveTeamId: (activeTeamId) => set({ activeTeamId }),
}));
