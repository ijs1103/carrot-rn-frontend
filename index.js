/**
 * @format
 */

import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

// 백그라운드 메시지 핸들러 등록
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('[FCM] Message handled in the background!', remoteMessage);
});

// Notifee 백그라운드 이벤트 등록
notifee.onBackgroundEvent(async ({type, detail}) => {
  console.log('[Notifee] Background Event:', type, detail.notification?.data);
});

AppRegistry.registerComponent(appName, () => App);
