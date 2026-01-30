import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  query,
  where,
  Timestamp,
  arrayUnion,
  arrayRemove,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Team, TeamMember } from '../types';

/**
 * Generate a random 6-character alphanumeric join code
 */
export const generateJoinCode = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

/**
 * Create a new team
 */
export const createTeam = async (
  userId: string,
  teamName: string
): Promise<Team> => {
  try {
    const now = new Date();
    const joinCode = generateJoinCode();
    
    const teamData = {
      name: teamName.trim(),
      joinCode,
      ownerId: userId,
      memberIds: [userId], // Owner is automatically a member
      createdAt: Timestamp.fromDate(now),
    };

    const docRef = await addDoc(collection(db, 'teams'), teamData);

    return {
      id: docRef.id,
      name: teamData.name,
      joinCode: teamData.joinCode,
      ownerId: teamData.ownerId,
      memberIds: teamData.memberIds,
      createdAt: now,
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to create team');
  }
};

/**
 * Get all teams where user is owner or member
 */
export const getUserTeams = async (userId: string): Promise<Team[]> => {
  try {
    // Query for teams where user is owner
    const ownerQuery = query(
      collection(db, 'teams'),
      where('ownerId', '==', userId)
    );

    // Query for teams where user is a member
    const memberQuery = query(
      collection(db, 'teams'),
      where('memberIds', 'array-contains', userId)
    );

    const [ownerSnapshot, memberSnapshot] = await Promise.all([
      getDocs(ownerQuery),
      getDocs(memberQuery),
    ]);

    const teamsMap = new Map<string, Team>();

    // Add owner teams
    ownerSnapshot.forEach((doc) => {
      const data = doc.data();
      teamsMap.set(doc.id, {
        id: doc.id,
        name: data.name,
        joinCode: data.joinCode,
        ownerId: data.ownerId,
        memberIds: data.memberIds,
        createdAt: data.createdAt.toDate(),
      });
    });

    // Add member teams (avoid duplicates)
    memberSnapshot.forEach((doc) => {
      if (!teamsMap.has(doc.id)) {
        const data = doc.data();
        teamsMap.set(doc.id, {
          id: doc.id,
          name: data.name,
          joinCode: data.joinCode,
          ownerId: data.ownerId,
          memberIds: data.memberIds,
          createdAt: data.createdAt.toDate(),
        });
      }
    });

    // Convert map to array and sort by creation date
    const teams = Array.from(teamsMap.values());
    teams.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const memberIds = Array.from(new Set(teams.flatMap((t) => t.memberIds)));
    const memberMap = new Map<string, { displayName?: string; email?: string }>();

    await Promise.all(
      memberIds.map(async (id) => {
        const snap = await getDoc(doc(db, 'users', id));
        if (snap.exists()) {
          const data = snap.data() as any;
          memberMap.set(id, { displayName: data.displayName, email: data.email });
        }
      })
    );

    return teams.map((team) => {
      const members: TeamMember[] = team.memberIds.map((id) => {
        const data = memberMap.get(id);
        const name = data?.displayName || data?.email || 'Member';
        return {
          id,
          name,
          email: data?.email,
          role: id === team.ownerId ? 'Leader' : 'Member',
          status: 'online',
        };
      });
      return { ...team, members };
    });
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch teams');
  }
};

/**
 * Join a team using join code
 */
export const joinTeam = async (
  userId: string,
  joinCode: string
): Promise<Team> => {
  try {
    const code = joinCode.trim().toUpperCase();
    
    if (!code || code.length !== 6) {
      throw new Error('Join code must be 6 characters');
    }

    // Find team by join code
    const teamsQuery = query(
      collection(db, 'teams'),
      where('joinCode', '==', code)
    );
    
    const snapshot = await getDocs(teamsQuery);
    
    if (snapshot.empty) {
      throw new Error('Invalid join code. Team not found.');
    }

    const teamDoc = snapshot.docs[0];
    const teamData = teamDoc.data();
    
    // Check if user is already a member
    if (teamData.memberIds.includes(userId)) {
      throw new Error('You are already a member of this team');
    }

    // Add user to team members
    await updateDoc(doc(db, 'teams', teamDoc.id), {
      memberIds: arrayUnion(userId),
    });

    return {
      id: teamDoc.id,
      name: teamData.name,
      joinCode: teamData.joinCode,
      ownerId: teamData.ownerId,
      memberIds: [...teamData.memberIds, userId],
      createdAt: teamData.createdAt.toDate(),
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to join team');
  }
};

/**
 * Update team name
 */
export const updateTeamName = async (teamId: string, name: string): Promise<void> => {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Team name is required');
  await updateDoc(doc(db, 'teams', teamId), { name: trimmed });
};

/**
 * Delete a team
 */
export const deleteTeam = async (teamId: string): Promise<void> => {
  await deleteDoc(doc(db, 'teams', teamId));
};

/**
 * Add a member to a team by email
 */
export const addMemberToTeam = async (teamId: string, email: string): Promise<string> => {
  const normalized = email.trim().toLowerCase();
  if (!normalized) throw new Error('Email is required');

  const userQuery = query(collection(db, 'users'), where('email', '==', normalized));
  const userSnap = await getDocs(userQuery);
  if (userSnap.empty) {
    throw new Error('User not found');
  }

  const memberDoc = userSnap.docs[0];
  await updateDoc(doc(db, 'teams', teamId), {
    memberIds: arrayUnion(memberDoc.id),
  });

  return memberDoc.id;
};

/**
 * Remove a member from a team
 */
export const removeMemberFromTeam = async (
  teamId: string,
  userIdToRemove: string,
  ownerId: string
): Promise<void> => {
  if (userIdToRemove === ownerId) {
    throw new Error('Cannot remove the team owner');
  }
  await updateDoc(doc(db, 'teams', teamId), {
    memberIds: arrayRemove(userIdToRemove),
  });
};
