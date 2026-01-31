import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface PushTokenResult {
  expoPushToken?: string;
  fcmToken?: string;
  apnsToken?: string;
}

/**
 * Register the device for push notifications and persist tokens on the user document.
 */
export const registerForPushNotifications = async (userId: string): Promise<PushTokenResult | null> => {
  if (Platform.OS === 'web') return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const request = await Notifications.requestPermissionsAsync();
    finalStatus = request.status;
  }

  if (finalStatus !== 'granted') return null;

  const expoPushToken = (await Notifications.getExpoPushTokenAsync()).data;
  let fcmToken: string | undefined;
  let apnsToken: string | undefined;

  try {
    const deviceToken = await Notifications.getDevicePushTokenAsync();
    if (deviceToken?.type === 'fcm') {
      fcmToken = deviceToken.data;
    }
    if (deviceToken?.type === 'apns') {
      apnsToken = deviceToken.data;
    }
  } catch {
    // Ignore device token failures; Expo token still works.
  }

  const payload: PushTokenResult = {
    expoPushToken,
    ...(fcmToken ? { fcmToken } : {}),
    ...(apnsToken ? { apnsToken } : {}),
  };

  await setDoc(doc(db, 'users', userId), payload, { merge: true });

  return payload;
};
