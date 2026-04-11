import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  FlatList,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useLayoutEffect } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../../api';
import { Product } from '../../types';
import ListProduct from '../../components/ListProduct';

type SalesTab = '판매중' | '거래완료';

const ThemeSwitchButton = () => {
  const { colors, setThemeMode, isDark } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 15, gap: 8 }}>
      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>다크모드</Text>
      <Switch
        value={isDark}
        onValueChange={(val) => setThemeMode(val ? 'dark' : 'light')}
        trackColor={{ false: colors.border, true: colors.primary }}
      />
    </View>
  );
};

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user, logout } = useAuthStore();
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<SalesTab>('판매중');

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: logout },
    ]);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: '', // 기존 중앙 타이틀 제거
      headerLeft: () => (
        <View style={{ paddingLeft: 15 }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text }}>나의 당근</Text>
        </View>
      ),
      headerRight: () => <ThemeSwitchButton />,
    });
  }, [navigation, colors.text]);

  // 판매중 상품 조회
  const { data: forSaleData, isLoading: isLoadingForSale } = useQuery({
    queryKey: ['myProducts', user?.id, '판매중'],
    queryFn: async () => {
      const res = await productsApi.myProducts({ status: '판매중' });
      return res.data;
    },
    enabled: !!user,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
  });

  // 거래완료 상품 조회
  const { data: soldData, isLoading: isLoadingSold } = useQuery({
    queryKey: ['myProducts', user?.id, '거래완료'],
    queryFn: async () => {
      const res = await productsApi.myProducts({ status: '거래완료' });
      return res.data;
    },
    enabled: !!user,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
  });

  const forSaleItems = forSaleData?.data ?? [];
  const soldItems = soldData?.data ?? [];
  const currentItems = activeTab === '판매중' ? forSaleItems : soldItems;
  const isLoadingItems = activeTab === '판매중' ? isLoadingForSale : isLoadingSold;

  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <ListProduct
        id={item.id}
        title={item.title}
        price={item.price}
        photo={item.photo}
        created_at={item.created_at}
        neighborhood={item.neighborhood}
      />
    ),
    [],
  );

  const ListHeader = () => (
    <>
      { }
      <View style={styles.profileHeader}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('ProfileEdit')}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View
              style={[
                styles.avatar,
                styles.avatarPlaceholder,
                { backgroundColor: colors.surface },
              ]}>
              <Icon name="person" size={40} color={colors.textTertiary} />
            </View>
          )}
        </TouchableOpacity>
        <Text style={[styles.username, { color: colors.text }]}>
          {user?.username}
        </Text>

        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.8}
          onPress={handleLogout}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </View>

      { }
      <View style={styles.menuSection}>
        <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 10 }} />
        <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => navigation.navigate('Favorites')}>
          <View style={styles.menuLeft}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <Icon name="heart-outline" size={24} color={colors.text} />
              <Text style={[styles.menuText, { color: colors.text }]}>관심목록</Text>
            </View>
          </View>
        </TouchableOpacity>
        <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 10 }} />
        <TouchableOpacity
          style={styles.menuRow}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('LocationShare', { mode: 'neighborhood' })}
        >
          <View style={styles.menuLeft}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <Icon name="location-outline" size={24} color={colors.text} />
              <Text style={[styles.menuText, { color: colors.text }]}>내 동네 설정</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={[styles.menuValue, { color: colors.text }]}>
              {user?.neighborhood || '위치 미설정'}
            </Text>
            <Icon name="chevron-forward" size={18} color={colors.textTertiary} />
          </View>
        </TouchableOpacity>
        <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 10 }} />

      </View>

      { }
      <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === '판매중' && styles.tabItemActive,
            activeTab === '판매중' && { borderBottomColor: colors.text },
          ]}
          activeOpacity={0.7}
          onPress={() => setActiveTab('판매중')}>
          <Text
            style={[
              styles.tabText,
              { color: activeTab === '판매중' ? colors.text : colors.textTertiary },
              activeTab === '판매중' && styles.tabTextActive,
            ]}>
            판매중 {forSaleItems.length}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === '거래완료' && styles.tabItemActive,
            activeTab === '거래완료' && { borderBottomColor: colors.text },
          ]}
          activeOpacity={0.7}
          onPress={() => setActiveTab('거래완료')}>
          <Text
            style={[
              styles.tabText,
              { color: activeTab === '거래완료' ? colors.text : colors.textTertiary },
              activeTab === '거래완료' && styles.tabTextActive,
            ]}>
            거래완료 {soldItems.length}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const ListEmpty = () => {
    if (isLoadingItems) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Icon name="bag-outline" size={48} color={colors.textTertiary} />
        <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
          {activeTab === '판매중' ? '판매중인 상품이 없습니다.' : '거래완료된 상품이 없습니다.'}
        </Text>
      </View>
    );
  };


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={currentItems}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  username: {
    fontSize: 22,
    fontWeight: '700',
  },

  menuSection: {
    paddingVertical: 10,
    marginTop: 10,
  },
  menuRow: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 16,
  },
  menuValue: {
    fontSize: 15,
    fontWeight: '500',
  },

  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginTop: 20,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 15,
  },
  tabTextActive: {
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
  separator: {
    height: 1,
    marginVertical: 4,
  },
  logoutBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
