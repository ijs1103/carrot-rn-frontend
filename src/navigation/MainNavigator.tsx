import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useTheme} from '../theme';

import TabNavigator from './TabNavigator';
import ProductDetailScreen from '../screens/products/ProductDetailScreen';
import ProductAddScreen from '../screens/products/ProductAddScreen';
import PostDetailScreen from '../screens/posts/PostDetailScreen';
import PostAddScreen from '../screens/posts/PostAddScreen';
import ChatRoomScreen from '../screens/chats/ChatRoomScreen';
import LocationShareScreen from '../screens/chats/LocationShareScreen';
import LocationViewScreen from '../screens/chats/LocationViewScreen';
import ProfileEditScreen from '../screens/tabs/ProfileEditScreen';
import FavoriteScreen from '../screens/products/FavoriteScreen';
import ReportScreen from '../screens/ReportScreen';

export type MainStackParamList = {
  Tabs: undefined;
  ProductDetail: {id: number};
  ProductAdd: undefined;
  PostDetail: {id: number};
  PostAdd: undefined;
  ChatRoom: {id: string};
  LocationShare: {onLocationSelected: (lat: number, lng: number) => void};
  LocationView: {latitude: number; longitude: number};
  ProfileEdit: undefined;
  Favorites: undefined;
  Report: {targetType: string; targetId: number};
};

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainNavigator() {
  const {colors} = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: colors.background},
        headerTintColor: colors.text,
        headerTitleStyle: {fontWeight: '600'},
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: {backgroundColor: colors.background},
      }}>
      <Stack.Screen
        name="Tabs"
        component={TabNavigator}
        options={{
          headerShown: false,
          headerBackTitle: ' ',
          title: '',
        }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{title: ''}}
      />
      <Stack.Screen
        name="ProductAdd"
        component={ProductAddScreen}
        options={{title: '상품 등록'}}
      />
      <Stack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{title: ''}}
      />
      <Stack.Screen
        name="PostAdd"
        component={PostAddScreen}
        options={{title: '글쓰기'}}
      />
      <Stack.Screen
        name="ChatRoom"
        component={ChatRoomScreen}
        options={{title: '채팅'}}
      />
      <Stack.Screen
        name="LocationShare"
        component={LocationShareScreen}
        options={{title: '장소공유'}}
      />
      <Stack.Screen
        name="LocationView"
        component={LocationViewScreen}
        options={{title: '장소 보기'}}
      />
      <Stack.Screen
        name="ProfileEdit"
        component={ProfileEditScreen}
        options={{title: '프로필 수정'}}
      />
      <Stack.Screen
        name="Favorites"
        component={FavoriteScreen}
        options={{title: '관심목록'}}
      />
      <Stack.Screen
        name="Report"
        component={ReportScreen}
        options={{title: ''}}
      />
    </Stack.Navigator>
  );
}

