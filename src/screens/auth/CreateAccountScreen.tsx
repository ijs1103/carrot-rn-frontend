import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import Button from '../../components/Button';
import Input from '../../components/Input';

const schema = z
  .object({
    username: z.string().min(3, '3자 이상 입력해주세요').max(10, '10자 이하로 입력해주세요'),
    email: z.string().email('올바른 이메일을 입력해주세요'),
    password: z.string().min(4, '4자 이상 입력해주세요'),
    confirm_password: z.string().min(4, '4자 이상 입력해주세요'),
  })
  .refine(data => data.password === data.confirm_password, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirm_password'],
  });

type FormData = z.infer<typeof schema>;

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function CreateAccountScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const signup = useAuthStore(state => state.signup);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await signup({
        username: data.username,
        email: data.email,
        password: data.password,
      });
    } catch (err: any) {
      Alert.alert(
        '회원가입 실패',
        err?.response?.data?.detail || '다시 시도해주세요.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>안녕하세요!</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            아래 양식을 작성하여 가입하세요
          </Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="username"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                name="username"
                placeholder="사용자 이름"
                autoCapitalize="none"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                errors={errors.username ? [errors.username.message!] : []}
              />
            )}
          />
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                name="email"
                placeholder="이메일"
                keyboardType="email-address"
                autoCapitalize="none"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                errors={errors.email ? [errors.email.message!] : []}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                name="password"
                placeholder="비밀번호"
                secureTextEntry
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                errors={errors.password ? [errors.password.message!] : []}
              />
            )}
          />
          <Controller
            control={control}
            name="confirm_password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                name="confirm_password"
                placeholder="비밀번호 확인"
                secureTextEntry
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                errors={
                  errors.confirm_password
                    ? [errors.confirm_password.message!]
                    : []
                }
              />
            )}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          text="회원가입"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    gap: 32,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
  },
  form: {
    gap: 14,
  },
  footer: {
    padding: 24,
    paddingTop: 8,
  },
});

