import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const getProjectId = (): string | undefined => {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.easConfig?.projectId
  );
};

export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const projectId = getProjectId();
  const tokenResponse = projectId
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : await Notifications.getExpoPushTokenAsync();
  return tokenResponse.data;
};

export const upsertUserPushToken = async (
  userId: string,
  token: string
): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  await setDoc(
    userRef,
    {
      expoPushToken: token,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  const tokenRef = doc(db, 'userPushTokens', token);
  await setDoc(
    tokenRef,
    {
      userId,
      token,
      platform: Platform.OS,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const registerNotificationListeners = () => {
  const received = Notifications.addNotificationReceivedListener(() => {});
  const responded = Notifications.addNotificationResponseReceivedListener(() => {});

  return () => {
    Notifications.removeNotificationSubscription(received);
    Notifications.removeNotificationSubscription(responded);
  };
};
