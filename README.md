# TimeharborApp
Time Harbor is a cross-platform time tracking and team productivity application designed for modern teams. It helps employees track working hours, manage tickets, and collaborate within teams, while giving managers clear visibility into activity, time logs, and productivity — all in one place.

## Push Notifications (Clock In/Out)
- Register devices with Expo Notifications and store tokens on `users/{userId}`.
- Deploy Firebase Cloud Functions in `TimeHarbor/functions` for clock-in/clock-out alerts.
- Configure APNs/FCM credentials in Firebase and Expo for iOS/Android delivery.

### Functions Setup
```bash
cd TimeHarbor/functions
npm install
npm run build
npm run deploy
```
