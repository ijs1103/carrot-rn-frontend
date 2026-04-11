import React from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../theme';
import { chatsApi } from '../../api';
import { formatToTimeAgo } from '../../utils';

interface ChatRoomListItem {
  id: string;
  product: {
    id: number;
    title: string;
    photo: string;
    price: number;
  };
  other_user: {
    id: number;
    username: string;
    avatar?: string | null;
    neighborhood?: string | null;
  };
  last_message?: {
    payload: string;
    created_at: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export default function ChatListScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['my-chat-rooms'],
    queryFn: async () => {
      const res = await chatsApi.getMyRooms();
      return res.data as ChatRoomListItem[];
    },
  });

  const renderItem = ({ item }: { item: ChatRoomListItem }) => {
    const lastMsgDate = item.last_message
      ? formatToTimeAgo(item.last_message.created_at)
      : formatToTimeAgo(item.created_at);

    return (
      <TouchableOpacity
        style={[styles.roomItem, { borderBottomColor: colors.border }]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('ChatRoom', { id: item.id })}>
        {/* 상품 이미지 */}
        <View style={[styles.imageContainer, { backgroundColor: colors.surface }]}>
          {item.product.photo ? (
            <Image
              source={{ uri: item.product.photo }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.productImage, { backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }]}>
              <Icon name="image-outline" size={24} color={colors.textTertiary} />
            </View>
          )}
        </View>

        {/* 채팅 정보 */}
        <View style={styles.chatInfo}>
          <View style={styles.topRow}>
            <Text style={[styles.username, { color: colors.text }]} numberOfLines={1}>
              {item.other_user.username}
            </Text>
            {item.other_user.neighborhood && (
              <Text style={[styles.neighborhood, { color: colors.textTertiary }]}>
                {' '}· {item.other_user.neighborhood}
              </Text>
            )}
            <Text style={[styles.date, { color: colors.textTertiary }]}>
              {' '}· {lastMsgDate}
            </Text>
          </View>
          <Text
            style={[styles.lastMessage, { color: colors.textSecondary }]}
            numberOfLines={1}>
            {item.last_message?.payload
              ? item.last_message.payload.startsWith('[image]')
                ? '사진'
                : item.last_message.payload.startsWith('[location]')
                  ? '위치'
                  : item.last_message.payload
              : '아직 메시지가 없습니다'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {rooms && rooms.length > 0 ? (
        <FlatList
          data={rooms}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Icon name="chatbubbles-outline" size={48} color={colors.textTertiary} />
          <Text style={[styles.empty, { color: colors.textTertiary }]}>
            채팅 목록이 없습니다
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  roomItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  imageContainer: {
    width: 52,
    height: 52,
    borderRadius: 8,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 5,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  neighborhood: {
    fontSize: 13,
  },
  date: {
    fontSize: 13,
  },
  lastMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  empty: {
    fontSize: 15,
  },
});
