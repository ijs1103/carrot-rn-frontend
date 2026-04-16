import React, {useEffect} from 'react';
import {ActivityIndicator, View, StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {useAuthStore} from '../stores/authStore';
import {useTheme} from '../theme';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { navigationRef } from './navigationRef';

export default function RootNavigator() {
  const {isAuthenticated, isLoading, initialize, logout} = useAuthStore();
  const {colors, isDark} = useTheme();

  useEffect(() => {
    initialize();
    
    // 401 에러 시 로그아웃 처리 등록
    import('../api/client').then(({setUnauthorizedCallback}) => {
      setUnauthorizedCallback(logout);
    });
  }, [initialize, logout]);

  if (isLoading) {
    return (
      <View style={[styles.splash, {backgroundColor: colors.background}]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={{
        dark: isDark,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          notification: colors.primary,
        },
        fonts: {
          regular: {fontFamily: 'System', fontWeight: '400'},
          medium: {fontFamily: 'System', fontWeight: '500'},
          bold: {fontFamily: 'System', fontWeight: '700'},
          heavy: {fontFamily: 'System', fontWeight: '800'},
        },
      }}>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
