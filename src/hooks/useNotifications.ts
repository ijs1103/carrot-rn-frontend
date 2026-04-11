import {useEffect} from 'react';
import {Platform} from 'react-native';
import {firebase} from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import notifee, {AndroidImportance} from '@notifee/react-native';
import {useAuthStore} from '../stores/authStore';
import {notificationsApi} from '../api/endpoints';
import {getCurrentRouteName, getParams, navigate} from '../navigation/navigationRef';

export const useNotifications = () => {
  const {isAuthenticated, user} = useAuthStore();

  const isFirebaseInitialized = firebase.apps.length > 0;

  useEffect(() => {
    if (!isFirebaseInitialized) {
      console.warn('[FCM] Firebase has not been initialized. Please check your GoogleService-Info.plist/google-services.json files.');
      return;
    }

    if (isAuthenticated && user) {
      requestUserPermission();
      getToken();
    }
  }, [isAuthenticated, user, isFirebaseInitialized]);

  useEffect(() => {
    if (!isFirebaseInitialized) return;

    //포그라운드 메시지 리스너
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('[FCM] Foreground Message handled:', remoteMessage);
      
      const roomId = remoteMessage.data?.roomId as string;
      
      //현재화면 확인 로직
      const currentRouteName = getCurrentRouteName();
      const params = getParams() as any;
      const isCurrentlyInThisChatRoom = 
        currentRouteName === 'ChatRoom' && params?.chatRoomId === roomId;

      if (isCurrentlyInThisChatRoom) {
        console.log('[FCM] Already in the chat room. Skipping notification.');
      } else {
        await displayLocalNotification(remoteMessage);
      }
    });

    // 알림 클릭 시 (포그라운드 - Notifee)
    const unsubscribeNotifee = notifee.onForegroundEvent(({type, detail}) => {
      if (type === 1) {
        handleNotificationClick(detail.notification);
      }
    });

    // 알림 클릭 시 (백그라운드 - Firebase native)
    messaging().onNotificationOpenedApp(remoteMessage => {
      handleNotificationClick(remoteMessage);
    });

    // 앱 종료 상태에서 알림으로 열릴 때 (Firebase native)
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          handleNotificationClick(remoteMessage);
        }
      });
      
    // 앱 종료 상태에서 알림으로 열릴 때 (Notifee)
    notifee.getInitialNotification().then(notification => {
      if (notification) {
        handleNotificationClick(notification.notification);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeNotifee();
    };
  }, [isFirebaseInitialized]);

  const requestUserPermission = async () => {
    try {
      // 1. Firebase Messaging 권한 요청
      const authStatus = await messaging().requestPermission();
      console.log('[FCM] Permission status:', authStatus);

      // 2. iOS Notifee 권한 요청 (로컬 알림용)
      if (Platform.OS === 'ios') {
        const settings = await notifee.requestPermission();
        console.log('[Notifee] Permission settings:', settings);
      }
    } catch (e) {
      console.error('[FCM] Permission request error:', e);
    }
  };

  const getToken = async () => {
    try {
      if (!isFirebaseInitialized) return;

      if (Platform.OS === 'ios') {
        console.log('[FCM] Registering for remote messages...');
        await messaging().registerDeviceForRemoteMessages();
      }

      const token = await messaging().getToken();
      if (token) {
        console.log('[FCM] Token obtained:', token);
        console.log('[FCM] Attempting to update token on server...');
        
        const response = await notificationsApi.updateToken(token);
        
        console.log('[FCM] Server response status:', response.status);
        console.log('[FCM] Token updated on server successfully!');
      }
    } catch (error: any) {
      console.error('[FCM] Error in getToken process:', error.message || error);
      if (error.response) {
        console.error('[FCM] Server error data:', error.response.data);
        console.error('[FCM] Server error status:', error.response.status);
      } else if (error.request) {
        console.error('[FCM] No response received from server. Check your baseURL/network.');
      }
    }
  };

  const displayLocalNotification = async (message: any) => {
    console.log('[FCM] Displaying local notification...', message.notification);
    const channelId = await notifee.createChannel({
      id: 'chat_notifications',
      name: 'Chat Notifications',
      importance: AndroidImportance.HIGH,
    });

    await notifee.displayNotification({
      title: message.notification?.title || '새 메시지',
      body: message.notification?.body || '',
      android: {
        channelId,
        pressAction: {
          id: 'default',
        },
      },
      data: message.data,
    });
  };

  const handleNotificationClick = (message: any) => {
    if (!message) return;
    
    // roomId 추출
    const roomId = message.data?.roomId || message.roomId;
    
    console.log('[FCM] Notification Clicked. RoomID:', roomId);
    
    if (roomId) {
      navigate('ChatRoom', {id: roomId});
    }
  };

  return null;
};
