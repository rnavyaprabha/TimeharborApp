import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

type TeamDoc = {
  name?: string;
  ownerId?: string;
  managerIds?: string[];
};

type UserDoc = {
  displayName?: string;
  fcmToken?: string;
  expoPushToken?: string;
};

const app = admin.apps.length ? admin.app() : admin.initializeApp();
const db = admin.firestore(app);

const formatDuration = (seconds: number) => {
  const safe = Math.max(0, seconds || 0);
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
};

const sendFcm = async (tokens: string[], payload: admin.messaging.MessagingPayload) => {
  if (tokens.length === 0) return;
  await admin.messaging().sendEachForMulticast({
    tokens,
    notification: payload.notification,
    data: payload.data,
  });
};

const sendExpo = async (tokens: string[], title: string, body: string, data: Record<string, string>) => {
  if (tokens.length === 0) return;
  const messages = tokens.map((token) => ({
    to: token,
    title,
    body,
    data,
  }));
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  });
};

const getTeamRecipients = async (teamId: string, actorId: string) => {
  const teamSnap = await db.collection('teams').doc(teamId).get();
  if (!teamSnap.exists) return { teamName: 'team', recipientIds: [] as string[] };

  const team = teamSnap.data() as TeamDoc;
  const ids = new Set<string>();
  if (team.ownerId) ids.add(team.ownerId);
  (team.managerIds || []).forEach((id) => ids.add(id));
  ids.delete(actorId);
  return { teamName: team.name || 'team', recipientIds: Array.from(ids) };
};

const getRecipientTokens = async (userIds: string[]) => {
  if (userIds.length === 0) return { fcm: [] as string[], expo: [] as string[] };
  const snaps = await Promise.all(userIds.map((uid) => db.collection('users').doc(uid).get()));
  const fcm: string[] = [];
  const expo: string[] = [];
  snaps.forEach((snap) => {
    if (!snap.exists) return;
    const user = snap.data() as UserDoc;
    if (user.fcmToken) fcm.push(user.fcmToken);
    if (user.expoPushToken) expo.push(user.expoPushToken);
  });
  return { fcm, expo };
};

const getUserName = async (userId: string) => {
  const snap = await db.collection('users').doc(userId).get();
  if (!snap.exists) return 'Team member';
  const user = snap.data() as UserDoc;
  return user.displayName || 'Team member';
};

export const notifyOnClockIn = functions.firestore
  .document('timeSessions/{sessionId}')
  .onCreate(async (snap, context) => {
    const session = snap.data();
    if (!session?.teamId || !session?.userId) return;

    const { teamName, recipientIds } = await getTeamRecipients(session.teamId, session.userId);
    if (recipientIds.length === 0) return;

    const userName = await getUserName(session.userId);
    const { fcm, expo } = await getRecipientTokens(recipientIds);

    const title = 'Team Member Clocked In';
    const body = `${userName} clocked in to ${teamName}`;
    const data = { type: 'clock_in', sessionId: context.params.sessionId };

    await sendFcm(fcm, { notification: { title, body }, data });
    await sendExpo(expo, title, body, data);
  });

export const notifyOnClockOut = functions.firestore
  .document('timeSessions/{sessionId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (!before || !after) return;

    const wasCompleted = before.status === 'completed';
    const isCompleted = after.status === 'completed';
    if (wasCompleted || !isCompleted) return;

    if (!after.teamId || !after.userId) return;

    const { teamName, recipientIds } = await getTeamRecipients(after.teamId, after.userId);
    if (recipientIds.length === 0) return;

    const userName = await getUserName(after.userId);
    const { fcm, expo } = await getRecipientTokens(recipientIds);
    const duration = formatDuration(after.duration || 0);

    const title = 'Team Member Clocked Out';
    const body = `${userName} clocked out from ${teamName} (${duration})`;
    const data = { type: 'clock_out', sessionId: context.params.sessionId };

    await sendFcm(fcm, { notification: { title, body }, data });
    await sendExpo(expo, title, body, data);
  });
