import React, { useEffect, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, Image, Text, TouchableOpacity, Alert } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../theme';
import { chatsApi } from '../../api';
import { useAuthStore } from '../../stores/authStore';
import ChatMessagesList from '../../components/ChatMessagesList';

export default function ChatRoomScreen() {
  const { colors } = useTheme();
  const route = useRoute<RouteProp<{ params: { id: string, ticket?: string } }>>();
  const navigation = useNavigation<any>();
  const { id, ticket } = route.params;
  const user = useAuthStore(state => state.user);
  const queryClient = useQueryClient();

  const { data: room, isLoading: isRoomLoading } = useQuery({
    queryKey: ['chat-room', id],
    queryFn: async () => {
      try {
        const res = await chatsApi.getRoom(id);
        return res.data;
      } catch (err: any) {
        console.log('Room fetch error:', err?.response?.data || err?.message || err);
        throw err;
      }
    },
  });

  const { data: messages, isLoading: isMessagesLoading } = useQuery({
    queryKey: ['chat-messages', id],
    queryFn: async () => {
      const res = await chatsApi.getMessages(id);
      return res.data;
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const handleLeave = useCallback(() => {
    Alert.alert(
      '채팅방 나가기',
      '채팅방을 나가면 대화 내용이 모두 삭제됩니다.\n정말 나가시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '나가기',
          style: 'destructive',
          onPress: async () => {
            try {
              await chatsApi.leaveRoom(id);
              // 채팅 목록 캐시 무효화
              queryClient.invalidateQueries({ queryKey: ['my-chat-rooms'] });
              navigation.goBack();
            } catch (err: any) {
              Alert.alert('오류', '채팅방 나가기에 실패했습니다.');
            }
          },
        },
      ],
    );
  }, [id, navigation, queryClient]);

  useEffect(() => {
    if (room && user) {
      const otherUser = room.buyer_id === user.id ? room.seller : room.buyer;
      navigation.setOptions({
        title: otherUser.username,
        headerRight: () => (
          <TouchableOpacity onPress={handleLeave} style={{ paddingHorizontal: 4 }}>
            <Icon name="exit-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        ),
      });
    }
  }, [room, user, navigation, handleLeave, colors.text]);

  if (isRoomLoading || isMessagesLoading || !messages || !user) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {room && (
        <View style={[styles.productHeader, { borderBottomColor: colors.border }]}>
          <Image
            source={{ uri: room.product.photo ? room.product.photo.split(',')[0].trim() : '' }}
            style={styles.productImage}
          />
          <View style={styles.productInfo}>
            <View style={styles.productTitleRow}>
              {room.product.status && (
                <Text style={styles.productStatus}>{room.product.status}</Text>
              )}
              <Text style={[styles.productTitle, { color: colors.text }]} numberOfLines={1}>
                {room.product.title}
              </Text>
            </View>
            <Text style={[styles.productPrice, { color: colors.text }]}>
              {room.product.price.toLocaleString()}원
            </Text>
          </View>
        </View>
      )}
      <ChatMessagesList
        initialMessages={messages}
        userId={user.id}
        chatRoomId={id}
        ticket={ticket || room?.ticket}
        username={user.username}
        avatar={user.avatar ?? ''}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productHeader: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
  },
  productImage: {
    width: 48,
    height: 48,
    borderRadius: 6,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-around',
  },
  productTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productStatus: {
    fontWeight: 'bold',
    marginRight: 4,
    color: '#F97316',
  },
  productTitle: {
    fontSize: 15,
    flexShrink: 1,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
