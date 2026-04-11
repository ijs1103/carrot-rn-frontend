import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTheme} from '../../theme';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function LandingScreen({navigation}: Props) {
  const {colors} = useTheme();

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={styles.hero}>
        <Text style={styles.emoji}>🥕</Text>
        <Text style={[styles.title, {color: colors.text}]}>당신 근처의 당근</Text>
        <Text style={[styles.subtitle, {color: colors.textSecondary}]}>
          {`동네라서 가능한 모든 것\n지금 내 동네를 선택하고 시작해보세요!`}
        </Text>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={[styles.primaryBtn, {backgroundColor: colors.primary}]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('CreateAccount')}>
          <Text style={styles.primaryBtnText}>시작하기</Text>
        </TouchableOpacity>

        <View style={styles.loginRow}>
          <Text style={[styles.loginText, {color: colors.textSecondary}]}>
            이미 계정이 있나요?
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.loginLink, {color: colors.primary}]}>
              로그인
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 48,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  bottom: {
    gap: 16,
    alignItems: 'center',
  },
  primaryBtn: {
    width: '100%',
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  loginRow: {
    flexDirection: 'row',
    gap: 6,
  },
  loginText: {
    fontSize: 15,
  },
  loginLink: {
    fontSize: 15,
    fontWeight: '600',
  },
});
