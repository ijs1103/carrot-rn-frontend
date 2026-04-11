import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../theme';

import HomeScreen from '../screens/tabs/HomeScreen';
import LifeScreen from '../screens/tabs/LifeScreen';
import ChatListScreen from '../screens/tabs/ChatListScreen';
import ProfileScreen from '../screens/tabs/ProfileScreen';

export type TabParamList = {
  Home: undefined;
  Life: undefined;
  ChatList: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<string, {active: string; inactive: string}> = {
  Home: {active: 'home', inactive: 'home-outline'},
  Life: {active: 'newspaper', inactive: 'newspaper-outline'},
  ChatList: {active: 'chatbubble-ellipses', inactive: 'chatbubble-ellipses-outline'},
  Profile: {active: 'person', inactive: 'person-outline'},
};

const TAB_LABELS: Record<string, string> = {
  Home: '홈',
  Life: '동네생활',
  ChatList: '채팅',
  Profile: '나의 당근',
};

export default function TabNavigator() {
  const {colors} = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, size}) => {
          const icons = TAB_ICONS[route.name];
          return (
            <Icon
              name={focused ? icons.active : icons.inactive}
              size={size}
              color={focused ? colors.primary : colors.textTertiary}
            />
          );
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
        },
        tabBarLabel: TAB_LABELS[route.name],
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {fontWeight: '600'},
        headerShadowVisible: false,
      })}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{title: '홈'}}
      />
      <Tab.Screen
        name="Life"
        component={LifeScreen}
        options={{title: '동네생활'}}
      />
      <Tab.Screen
        name="ChatList"
        component={ChatListScreen}
        options={{title: '채팅'}}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{title: '나의 당근'}}
      />
    </Tab.Navigator>
  );
}
