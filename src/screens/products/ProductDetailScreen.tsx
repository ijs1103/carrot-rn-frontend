import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Modal,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

const { width } = Dimensions.get('window');
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { productsApi, chatsApi, authApi } from '../../api';
import { formatToWon } from '../../utils';
import SlideUpModal from '../../components/SlideUpModal';

export default function ProductDetailScreen() {
  const { colors } = useTheme();
  const route = useRoute<RouteProp<{ params: { id: number } }>>();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const id = route.params?.id;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showKebabMenu, setShowKebabMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const { data: product, isLoading, isError, error } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (id === undefined) throw new Error('Invalid product ID');
      const res = await productsApi.getById(id);

      
      
      const data = (res.data as any).data || res.data;
      if (!data) throw new Error('Empty response from server');

      return data;
    },
    enabled: id !== undefined,
    retry: 1, 
  });

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await authApi.getMe();
      return res.data;
    },
  });

  const { data: favoriteData } = useQuery({
    queryKey: ['product', id, 'favorite'],
    queryFn: async () => {
      if (id === undefined) throw new Error('Invalid product ID');
      const res = await productsApi.getFavorite(id);
      return res.data;
    },
    enabled: id !== undefined && !!me, 
  });
  const isLiked = favoriteData?.is_favorited ?? false;

  const favoriteMutation = useMutation({
    mutationFn: () => productsApi.toggleFavorite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', id, 'favorite'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['myFavorites'] });
    },
    onError: () => {
      Alert.alert('오류', '찜하기 처리에 실패했습니다.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['myProducts'] });
      navigation.navigate('Tabs');
    },
    onError: () => {
      Alert.alert('오류', '상품 삭제에 실패했습니다.');
    },
  });

  const handleDeleteClick = () => {
    setShowKebabMenu(false);
    deleteMutation.mutate();
  };

  const statusMutation = useMutation({
    mutationFn: (newStatus: string) => productsApi.updateStatus(id, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['myProducts'] });
      setShowStatusMenu(false);
    },
    onError: () => {
      Alert.alert('오류', '상태 변경에 실패했습니다.');
    },
  });

  const isAuthor = me && product && me.id === product.user_id;

  useLayoutEffect(() => {
    if (isAuthor) {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity
            onPress={() => setShowKebabMenu(true)}
            activeOpacity={0.7}
            style={{ paddingLeft: 10 }}>
            <Icon name="ellipsis-vertical" size={24} color={colors.text} />
          </TouchableOpacity>
        ),
      });
    } else {
      navigation.setOptions({
        headerRight: undefined,
      });
    }
  }, [navigation, me, product, colors]);

  const images = product?.photo ? product.photo.split(',').map((url: string) => url.trim()) : [];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setCurrentIdx(Math.round(index));
  };

  const handleChat = async () => {
    if (!product) return;
    try {
      const res = await chatsApi.createRoom(product.id);
      // 채팅 목록 무효화하여 새로운 방이 보이도록 함
      queryClient.invalidateQueries({ queryKey: ['my-chat-rooms'] });
      navigation.navigate('ChatRoom', { id: res.data.room.id, ticket: res.data.ticket });
    } catch (e) {
      console.error(e);
      Alert.alert('오류', '채팅방을 생성할 수 없습니다.');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !product) {
    const errorMessage = error instanceof Error ? error.message : '네트워크 오류가 발생했습니다.';
    const is404 = errorMessage.includes('404');

    return (
      <View style={[styles.centered, { backgroundColor: colors.background, padding: 20 }]}>
        <Icon name="alert-circle-outline" size={60} color={colors.danger} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>
          {is404 ? '상품을 찾을 수 없습니다.' : '데이터를 가져오지 못했습니다.'}
        </Text>
        <Text style={[styles.errorDetail, { color: colors.textSecondary }]}>
          {errorMessage} (ID: {id})
        </Text>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>홈으로 돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>
        <View style={styles.carouselContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}>
            {images.map((img: string, idx: number) => (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.9}
                onPress={() => setIsFullScreen(true)}>
                <Image
                  source={{ uri: img }}
                  style={[styles.image, { width }]}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
          {images.length > 0 && (
            <View style={styles.indicatorBadge}>
              <Text style={styles.indicatorText}>
                {currentIdx + 1} / {images.length}
              </Text>
            </View>
          )}
        </View>
        <View style={[styles.userRow, { borderBottomColor: colors.border }]}>
          <TouchableOpacity activeOpacity={0.8} style={[styles.userAvatar, { backgroundColor: colors.surface }]}>
            {product.user?.avatar ? (
              <Image source={{ uri: product.user.avatar }} style={styles.userAvatarImage} />
            ) : (
              <Icon name="person" size={24} color={colors.textTertiary} />
            )}
          </TouchableOpacity>
          <View style={styles.userInfo}>
            <Text style={[styles.username, { color: colors.text }]}>
              {product.user?.username || '판매자'}
            </Text>
            {(product.user?.neighborhood || product.neighborhood) && (
              <Text style={[styles.neighborhood, { color: colors.textTertiary }]}>
                {product.user?.neighborhood || product.neighborhood}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.info}>
          {isAuthor && (
            <TouchableOpacity
              style={[styles.statusToggleBtn, { borderColor: colors.border }]}
              onPress={() => setShowStatusMenu(true)}
              activeOpacity={0.7}>
              <Text style={[styles.statusToggleText, { color: colors.text }]}>{product.status || '판매중'}</Text>
              <Icon name="chevron-down" size={16} color={colors.text} />
            </TouchableOpacity>
          )}
          <Text style={[styles.title, { color: colors.text }]}>
            {product.title}
          </Text>
          <Text style={[styles.price, { color: colors.text }]}>
            {formatToWon(product.price)}원
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {product.description}
          </Text>
          <Text style={[styles.metrics, { color: colors.textTertiary }]}>
            관심 {product.favorite_count ?? 0} · 조회 {product.views ?? 0}
          </Text>
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          { backgroundColor: colors.surface, borderTopColor: colors.border },
        ]}>
        <TouchableOpacity
          style={styles.likeBtn}
          onPress={() => favoriteMutation.mutate()}
          disabled={isAuthor || product.status === '거래완료' || favoriteMutation.isPending}
          activeOpacity={0.7}>
          <Icon
            name={isLiked ? 'heart' : 'heart-outline'}
            size={28}
            color={
              (isAuthor || product.status === '거래완료')
                ? colors.border
                : isLiked
                ? colors.danger || '#EF4444'
                : colors.textTertiary
            }
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.chatBtn,
            {
              backgroundColor:
                isAuthor || product.status === '거래완료' ? colors.border : colors.primary,
            },
          ]}
          disabled={product.status === '거래완료'}
          activeOpacity={0.8}
          onPress={handleChat}>
          <Text
            style={[
              styles.chatBtnText,
              isAuthor ? { color: colors.text } : (product.status === '거래완료' && { color: colors.textTertiary }),
            ]}>
            {isAuthor ? '대화중인 채팅' : (product.status === '거래완료' ? '거래완료' : '채팅하기')}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={isFullScreen} transparent={false} animationType="fade">
        <View style={styles.fullScreenContainer}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setIsFullScreen(false)}>
            <Icon name="close" size={32} color="#FFF" />
          </TouchableOpacity>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {images.map((img: string, idx: number) => (
              <View key={idx} style={[styles.fullScreenImageWrap, { width }]}>
                <Image source={{ uri: img }} style={styles.fullScreenImage} resizeMode="contain" />
              </View>
            ))}
          </ScrollView>
          <View style={styles.fullScreenDots}>
            {images.map((_: string, idx: number) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  currentIdx === idx ? styles.dotActive : styles.dotInactive
                ]}
              />
            ))}
          </View>
        </View>
      </Modal>

      {}
      <SlideUpModal
        visible={showKebabMenu}
        onClose={() => setShowKebabMenu(false)}>
        <View style={[styles.modalContent, {backgroundColor: colors.background}]}>
          <TouchableOpacity style={styles.modalActionRow} onPress={handleDeleteClick}>
            <Text style={[styles.modalActionText, {color: colors.danger || '#EF4444'}]}>삭제</Text>
          </TouchableOpacity>
          <View style={[styles.modalDivider, {backgroundColor: colors.border}]} />
          <TouchableOpacity style={styles.modalActionRow} onPress={() => setShowKebabMenu(false)}>
            <Text style={[styles.modalActionText, {color: colors.text, fontWeight: '600'}]}>닫기</Text>
          </TouchableOpacity>
        </View>
      </SlideUpModal>

      {}
      <SlideUpModal
        visible={showStatusMenu}
        onClose={() => setShowStatusMenu(false)}>
        <View style={[styles.modalContent, {backgroundColor: colors.background}]}>
          <TouchableOpacity style={styles.modalActionRow} onPress={() => statusMutation.mutate('판매중')}>
            <Text style={[styles.modalActionText, {color: colors.text}]}>판매중</Text>
          </TouchableOpacity>
          <View style={[styles.modalDivider, {backgroundColor: colors.border, height: 1}]} />
          <TouchableOpacity style={styles.modalActionRow} onPress={() => statusMutation.mutate('거래완료')}>
            <Text style={[styles.modalActionText, {color: colors.text}]}>거래완료</Text>
          </TouchableOpacity>
          <View style={[styles.modalDivider, {backgroundColor: colors.border, height: 8}]} />
          <TouchableOpacity style={styles.modalActionRow} onPress={() => setShowStatusMenu(false)}>
            <Text style={[styles.modalActionText, {color: colors.text, fontWeight: '600'}]}>취소</Text>
          </TouchableOpacity>
        </View>
      </SlideUpModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselContainer: {
    position: 'relative',
  },
  image: {
    aspectRatio: 1,
  },
  indicatorBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  indicatorText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  userAvatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  userInfo: {
    justifyContent: 'center',
    gap: 2,
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
  },
  neighborhood: {
    fontSize: 13,
  },
  info: {
    padding: 16,
    gap: 8,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  errorDetail: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 24,
  },
  backBtn: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statusToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
    gap: 4,
    marginBottom: 8,
  },
  statusToggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  price: {
    fontSize: 22,
    fontWeight: '700',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  metrics: {
    fontSize: 13,
    marginTop: 16,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 32,
    borderTopWidth: 1,
    gap: 16,
  },
  likeBtn: {
    padding: 4,
  },
  verticalDivider: {
    width: 1,
    height: 32,
  },
  chatBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  chatBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  fullScreenImageWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  fullScreenDots: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: '#FFF',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 40,
    paddingTop: 8,
  },
  modalActionRow: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  modalActionText: {
    fontSize: 16,
  },
  modalDivider: {
    height: 8,
    width: '100%',
  },
});
