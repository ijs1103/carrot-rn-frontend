import React, {useState} from 'react';
import {View, Text, ScrollView, Alert, StyleSheet} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useForm, Controller} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {useTheme} from '../../theme';
import {useAuthStore} from '../../stores/authStore';
import Button from '../../components/Button';
import Input from '../../components/Input';

const schema = z.object({
  username: z.string().min(1, '사용자 이름을 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
});

type FormData = z.infer<typeof schema>;

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function LoginScreen({navigation}: Props) {
  const {colors} = useTheme();
  const login = useAuthStore(state => state.login);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await login(data.username, data.password);
    } catch (err: any) {
      Alert.alert(
        '로그인 실패',
        err?.response?.data?.detail || '사용자 이름 또는 비밀번호를 확인해주세요.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: colors.background}]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={[styles.title, {color: colors.text}]}>안녕하세요!</Text>
        <Text style={[styles.subtitle, {color: colors.textSecondary}]}>
          사용자 이름과 비밀번호로 로그인하세요
        </Text>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="username"
          render={({field: {onChange, onBlur, value}}) => (
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
          name="password"
          render={({field: {onChange, onBlur, value}}) => (
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
        <Button
          text="로그인"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
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
});
