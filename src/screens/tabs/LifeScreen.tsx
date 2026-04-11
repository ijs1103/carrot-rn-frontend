import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import {useQuery} from '@tanstack/react-query';
import {useTheme} from '../../theme';
import {postsApi} from '../../api';
import {PostListItem} from '../../types';
import {formatToTimeAgo} from '../../utils';

const TOPIC_COLORS: Record<string, string> = {
  '동네친구': '#3B82F6',
  '맛집': '#EF4444',
  '일반': '#6B7280',
};

export default function LifeScreen() {
  const {colors} = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const {data, isLoading, refetch, isRefetching} = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const res = await postsApi.list();
      return res.data.data;
    },
  });

  const renderItem = ({item}: {item: PostListItem}) => (
    <TouchableOpacity
      style={[styles.postItem, {borderBottomColor: colors.border}]}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('PostDetail', {id: item.id})}>
      {}
      <View style={styles.topicRow}>
        <View
          style={[
            styles.topicBadge,
            {backgroundColor: (TOPIC_COLORS[item.topic] || '#6B7280') + '18'},
          ]}>
          <Text
            style={[
              styles.topicText,
              {color: TOPIC_COLORS[item.topic] || '#6B7280'},
            ]}>
            {item.topic}
          </Text>
        </View>
      </View>

      {}
      <Text style={[styles.postTitle, {color: colors.text}]}>
        {item.title}
      </Text>
      {item.description && (
        <Text
          style={[styles.postDesc, {color: colors.textSecondary}]}
          numberOfLines={2}>
          {item.description}
        </Text>
      )}

      {}
      <View style={styles.postMeta}>
        <View style={styles.metaLeft}>
          {item.author.neighborhood && (
            <>
              <Text style={[styles.metaText, {color: colors.textTertiary}]}>
                {item.author.neighborhood}
              </Text>
              <Text style={[styles.metaDot, {color: colors.textTertiary}]}>
                ·
              </Text>
            </>
          )}
          <Text style={[styles.metaText, {color: colors.textTertiary}]}>
            {formatToTimeAgo(item.created_at)}
          </Text>
        </View>
        <View style={styles.metaRight}>
          <View style={styles.metaIcon}>
            <Icon name="eye-outline" size={14} color={colors.textTertiary} />
            <Text style={[styles.metaText, {color: colors.textTertiary}]}>
              {item.views}
            </Text>
          </View>
          <View style={styles.metaIcon}>
            <Icon
              name="chatbubble-outline"
              size={14}
              color={colors.textTertiary}
            />
            <Text style={[styles.metaText, {color: colors.textTertiary}]}>
              {item.comment_count}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={[styles.centered, {backgroundColor: colors.background}]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <FlatList
        data={data ?? []}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="newspaper-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, {color: colors.textTertiary}]}>
              아직 게시글이 없어요
            </Text>
            <Text style={[styles.emptySubtext, {color: colors.textTertiary}]}>
              첫 번째 글을 작성해 보세요!
            </Text>
          </View>
        }
      />

      {}
      <TouchableOpacity
        style={[styles.fab, {backgroundColor: colors.primary}]}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('PostAdd')}>
        <Icon name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
  },
  postItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 8,
  },
  topicRow: {
    flexDirection: 'row',
  },
  topicBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  topicText: {
    fontSize: 12,
    fontWeight: '600',
  },
  postTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  postDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  postMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaDot: {
    fontSize: 13,
  },
  metaText: {
    fontSize: 13,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
