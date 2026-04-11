import React, { useState, useLayoutEffect, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { authApi } from '../../api';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { useAuthStore } from '../../stores/authStore';

export default function ProfileEditScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();

  const { data: me, isLoading: isLoadingMe } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await authApi.getMe();
      return res.data;
    },
  });

  const [username, setUsername] = useState('');
  const [avatarUri, setAvatarUri] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (me) {
      setUsername(me.username);
      setAvatarUri(me.avatar || '');
    }
  }, [me]);

  const updateMutation = useMutation({
    mutationFn: (data: { username?: string; avatar?: string }) => authApi.updateMe(data),
    onSuccess: (res) => {
      // API 응답으로 온 최신 유저 정보를 전역 상태(Zustand store)에도 반영해줍니다.
      useAuthStore.getState().setUser(res.data);
      queryClient.invalidateQueries({ queryKey: ['me'] });
      navigation.goBack();
    },
    onError: () => {
      Alert.alert('오류', '프로필 수정에 실패했습니다. 이미 사용중인 닉네임일 수 있습니다.');
    },
  });

  const handlePickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 1,
    });
    if (result.assets && result.assets.length > 0) {
      setAvatarUri(result.assets[0].uri!);
    }
  };

  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert('알림', '닉네임을 입력해주세요.');
      return;
    }

    setIsUploading(true);
    let finalAvatarUrl = me?.avatar || null;

    try {
      if (avatarUri && avatarUri !== me?.avatar) {
        finalAvatarUrl = await uploadToCloudinary(avatarUri);
      }

      const updateData: { username?: string; avatar?: string } = {};
      if (username !== me?.username) updateData.username = username;
      if (finalAvatarUrl !== me?.avatar) updateData.avatar = finalAvatarUrl || undefined;

      if (Object.keys(updateData).length > 0) {
        updateMutation.mutate(updateData);
      } else {
        
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('오류', '이미지 업로드 중 문제가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: '프로필 수정',
      headerRight: () => (
        <TouchableOpacity onPress={handleSave} disabled={isUploading || updateMutation.isPending} style={styles.headerBtn}>
          {isUploading || updateMutation.isPending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.headerBtnText, { color: colors.text }]}>완료</Text>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, username, avatarUri, me, isUploading, updateMutation.isPending, colors]);

  if (isLoadingMe) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.avatarContainer}>
        <TouchableOpacity activeOpacity={0.8} onPress={handlePickImage} testID="edit-avatar-btn">
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface }]}>
              <Icon name="person" size={60} color={colors.textTertiary} />
            </View>
          )}
          <View style={[styles.cameraBadge, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Icon name="camera" size={16} color={colors.textTertiary} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.inputSection}>
        <Text style={[styles.label, { color: colors.text }]}>닉네임</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          placeholder="닉네임을 입력해주세요"
          placeholderTextColor={colors.textTertiary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBtn: {
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 3,
  },
  inputSection: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
});
