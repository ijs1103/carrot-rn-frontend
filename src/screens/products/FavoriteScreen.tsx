import React, { useCallback } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { productsApi } from '../../api';
import { Product } from '../../types';
import { formatToWon, formatToTimeAgo } from '../../utils';


interface FavoriteItemProps {
  item: Product;
  onUnfavorite: (id: number) => void;
  isRemoving: boolean;
}

function FavoriteItem({ item, onUnfavorite, isRemoving }: FavoriteItemProps) {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const coverPhoto = item.photo ? item.photo.split(',')[0].trim() : '';

  return (
    <TouchableOpacity
      style={styles.itemContainer}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('ProductDetail', { id: item.id })}>
      <View style={[styles.imageContainer, { backgroundColor: colors.surface }]}>
        <Image source={{ uri: coverPhoto }} style={styles.image} resizeMode="cover" />
      </View>

      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.metaRow}>
          {item.neighborhood && (
            <>
              <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                {item.neighborhood}
              </Text>
              <Text style={[styles.metaText, { color: colors.textTertiary }]}>·</Text>
            </>
          )}
          <Text style={[styles.metaText, { color: colors.textTertiary }]}>
            {formatToTimeAgo(item.created_at)}
          </Text>
        </View>
        <Text style={[styles.price, { color: colors.text }]}>
          {formatToWon(item.price)}원
        </Text>
      </View>

      {/* 하트 버튼 (찜 해제) */}
      <TouchableOpacity
        style={styles.heartBtn}
        activeOpacity={0.7}
        disabled={isRemoving}
        onPress={() => onUnfavorite(item.id)}>
        {isRemoving ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Icon name="heart" size={22} color={colors.primary} />
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}


export default function FavoriteScreen() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const { data, isLoading } = useQuery({
    queryKey: ['myFavorites'],
    queryFn: async () => {
      const res = await productsApi.myFavorites();
      return res.data;
    },
  });

  const unfavoriteMutation = useMutation({
    mutationFn: (productId: number) => productsApi.toggleFavorite(productId),
    onSuccess: (_data, productId) => {
      // 목록에서 즉시 제거
      queryClient.setQueryData<any>(['myFavorites'], (old: any) => {
        if (!old) return old;
        return { ...old, data: old.data.filter((p: Product) => p.id !== productId) };
      });
      // 해당 상품 캐시도 무효화
      queryClient.invalidateQueries({ queryKey: ['product', productId, 'favorite'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });

      Alert.alert('찜 해제 완료', '관심목록에서 삭제되었습니다.');
    },
    onError: () => {
      Alert.alert('오류', '찜 해제에 실패했습니다.');
    },
  });

  const handleUnfavorite = useCallback((productId: number) => {
    Alert.alert('찜 해제', '관심목록에서 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '해제',
        style: 'destructive',
        onPress: () => unfavoriteMutation.mutate(productId),
      },
    ]);
  }, [unfavoriteMutation]);

  const items: Product[] = data?.data ?? [];

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={items}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <FavoriteItem
            item={item}
            onUnfavorite={handleUnfavorite}
            isRemoving={unfavoriteMutation.isPending && unfavoriteMutation.variables === item.id}
          />
        )}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Icon name="heart-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              관심목록이 비어있습니다.
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 40 },
  itemContainer: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 8,
  },
  imageContainer: {
    width: 112,
    height: 112,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  info: {
    flex: 1,
    gap: 4,
    justifyContent: 'center',
    paddingRight: 28,
  },
  title: { fontSize: 16, fontWeight: '500' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13 },
  price: { fontSize: 17, fontWeight: '700', marginTop: 2 },
  heartBtn: {
    position: 'absolute',
    top: 4,
    right: -4,
    padding: 8,
  },
  separator: { height: 1, marginVertical: 4 },
  emptyContainer: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyText: { fontSize: 14 },
});
