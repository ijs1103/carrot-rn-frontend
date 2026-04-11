import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import {useInfiniteQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {useAuthStore} from '../../stores/authStore';
import {useTheme} from '../../theme';
import {productsApi} from '../../api';
import {Product} from '../../types';
import ListProduct from '../../components/ListProduct';
import SlideUpModal from '../../components/SlideUpModal';

export default function HomeScreen() {
  const {colors} = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const queryClient = useQueryClient();
  const {user: me} = useAuthStore();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['products'],
    queryFn: async ({pageParam}) => {
      const res = await productsApi.list({
        cursor: pageParam ?? undefined,
        limit: 20,
      });
      return res.data;
    },
    getNextPageParam: lastPage =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
    initialPageParam: null as number | null,
  });

  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const allProducts = data?.pages.flatMap(page => page.data) ?? [];
  const selectedProduct = allProducts.find(p => p.id === selectedProductId);
  const isAuthor = me && selectedProduct && me.id === selectedProduct.user_id;

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['products']});
      queryClient.invalidateQueries({queryKey: ['myProducts']});
      setSelectedProductId(null);
    },
    onError: () => {
      Alert.alert('오류', '삭제에 실패했습니다.');
    },
  });

  const handleDelete = () => {
    if (!selectedProductId) return;
    Alert.alert('삭제', '정말 삭제하시겠습니까?', [
      {text: '취소', style: 'cancel'},
      {text: '삭제', style: 'destructive', onPress: () => deleteMutation.mutate(selectedProductId)},
    ]);
  };

  const blockMutation = useMutation({
    mutationFn: (id: number) => productsApi.block(id),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['products']});
      setSelectedProductId(null);
      Alert.alert('차단 완료', '해당 상품이 홈 화면에서 차단되었습니다.');
    },
    onError: () => {
      Alert.alert('오류', '상품 차단에 실패했습니다.');
    },
  });

  const handleHide = () => {
    if (!selectedProductId) return;
    Alert.alert('차단', '이 판매자의 상품을 더 이상 보지 않겠습니까?', [
      {text: '취소', style: 'cancel'},
      {text: '차단하기', style: 'destructive', onPress: () => blockMutation.mutate(selectedProductId)},
    ]);
  };
  
  const handleReport = () => {
    if (!selectedProductId) return;
    const productId = selectedProductId;
    setSelectedProductId(null);
    navigation.navigate('Report', {targetType: 'PRODUCT', targetId: productId});
  };

  const renderItem = useCallback(
    ({item}: {item: Product}) => (
      <ListProduct
        id={item.id}
        title={item.title}
        price={item.price}
        photo={item.photo}
        created_at={item.created_at}
        neighborhood={item.neighborhood}
        onOptionsPress={() => setSelectedProductId(item.id)}
      />
    ),
    [],
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.centered,
          {backgroundColor: colors.background},
        ]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <FlatList
        data={allProducts}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        onEndReached={() => {
          if (hasNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, {backgroundColor: colors.border}]} />
        )}
      />

      <TouchableOpacity
        style={[styles.fab, {backgroundColor: colors.primary}]}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('ProductAdd')}>
        <Icon name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      <SlideUpModal
        visible={!!selectedProductId}
        onClose={() => setSelectedProductId(null)}>
        <View style={[styles.modalContent, {backgroundColor: colors.background}]}>
          {isAuthor ? (
            <>
              <TouchableOpacity style={styles.modalActionRow} onPress={handleDelete}>
                <Text style={[styles.modalActionText, {color: colors.danger || '#EF4444'}]}>삭제하기</Text>
              </TouchableOpacity>
              <View style={[styles.modalDivider, {backgroundColor: colors.border}]} />
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.modalActionRow} onPress={handleHide}>
                <Text style={[styles.modalActionText, {color: colors.text}]}>이 글 차단하기</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalActionRow} onPress={handleReport}>
                <Text style={[styles.modalActionText, {color: colors.danger || '#EF4444'}]}>신고하기</Text>
              </TouchableOpacity>
              <View style={[styles.modalDivider, {backgroundColor: colors.border}]} />
            </>
          )}
          <TouchableOpacity style={styles.modalActionRow} onPress={() => setSelectedProductId(null)}>
            <Text style={[styles.modalActionText, {color: colors.text, fontWeight: '600'}]}>닫기</Text>
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
  list: {
    padding: 16,
  },
  separator: {
    height: 1,
    marginVertical: 8,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
