const admin = require('firebase-admin');
const functions = require('firebase-functions');

admin.initializeApp();
const db = admin.firestore();

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hrs > 0) return `${hrs}h ${remMins}m`;
  if (mins > 0) return `${mins}m`;
  return `${seconds}s`;
};

const chunkArray = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

const sendExpoPush = async (messages) => {
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  });
  if (!response.ok) {
    const body = await response.text();
    console.error('Expo push failed', response.status, body);
  }
};

exports.notifyAdminOnClock = functions.firestore
  .document('timeSessions/{sessionId}')
  .onWrite(async (change, context) => {
    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.exists ? change.after.data() : null;
    if (!after) return null;

    const wasCreated = !before;
    const statusBefore = before?.status;
    const statusAfter = after.status;

    const teamId = after.teamId;
    if (!teamId) return null;

    const teamSnap = await db.collection('teams').doc(teamId).get();
    if (!teamSnap.exists) return null;
    const team = teamSnap.data();
    const ownerId = team?.ownerId;
    if (!ownerId) return null;

    const memberSnap = await db.collection('users').doc(after.userId).get();
    const memberName =
      memberSnap.exists ? memberSnap.data()?.displayName || 'Member' : 'Member';

    let title = '';
    let body = '';
    let type = '';

    if (wasCreated && statusAfter === 'active') {
      title = 'Team member clocked in';
      body = `${memberName} clocked in.`;
      type = 'clock-in';
    } else if (statusBefore !== 'completed' && statusAfter === 'completed') {
      const duration = typeof after.duration === 'number' ? after.duration : 0;
      title = 'Team member clocked out';
      body = `${memberName} clocked out (${formatDuration(duration)}).`;
      type = 'clock-out';
    } else {
      return null;
    }

    const tokenSnap = await db
      .collection('userPushTokens')
      .where('userId', '==', ownerId)
      .get();

    if (tokenSnap.empty) return null;
    const tokens = tokenSnap.docs
      .map((d) => d.data()?.token)
      .filter(Boolean);

    if (!tokens.length) return null;

    const messages = tokens.map((token) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data: {
        type,
        teamId,
        sessionId: context.params.sessionId,
        memberId: after.userId,
      },
    }));

    const batches = chunkArray(messages, 100);
    for (const batch of batches) {
      await sendExpoPush(batch);
    }

    return null;
  });
