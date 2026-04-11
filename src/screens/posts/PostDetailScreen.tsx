import React, {useState, useLayoutEffect} from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from 'react-native';
import {RouteProp, useRoute, useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {useTheme} from '../../theme';
import {postsApi, authApi} from '../../api';
import {PostDetail, Comment as CommentType} from '../../types';
import {formatToTimeAgo} from '../../utils';

const screenWidth = Dimensions.get('window').width;

const TOPIC_COLORS: Record<string, string> = {
  '동네친구': '#3B82F6',
  '맛집': '#EF4444',
  '일반': '#6B7280',
};

export default function PostDetailScreen() {
  const {colors} = useTheme();
  const route = useRoute<RouteProp<{params: {id: number}}>>();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const {id} = route.params;
  const [commentText, setCommentText] = useState('');

  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

  const {data: post, isLoading, isError, refetch, isRefetching} = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const res = await postsApi.getById(id);
      return res.data as PostDetail;
    },
  });

  const {data: me} = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await authApi.getMe();
      return res.data;
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: (payload: string) => postsApi.addComment(id, payload),
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({queryKey: ['post', id]});
    },
    onError: () => {
      Alert.alert('오류', '댓글 작성에 실패했습니다.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => postsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['posts']});
      navigation.goBack();
    },
    onError: () => {
      Alert.alert('오류', '게시글 삭제에 실패했습니다.');
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => postsApi.deleteComment(id, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['post', id]});
    },
    onError: () => {
      Alert.alert('오류', '댓글 삭제에 실패했습니다.');
    },
  });

  const handleDelete = () => {
    Alert.alert('게시글 삭제', '정말 삭제하시겠습니까?', [
      {text: '취소', style: 'cancel'},
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(),
      },
    ]);
  };

  const handleDeleteComment = (commentId: number) => {
    Alert.alert('댓글 삭제', '댓글을 삭제하시겠습니까?', [
      {text: '취소', style: 'cancel'},
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => deleteCommentMutation.mutate(commentId),
      },
    ]);
  };

  useLayoutEffect(() => {
    const isAuthor = me && post && me.id === post.author.id;
    navigation.setOptions({
      headerRight: () => {
        if (isAuthor) {
          return (
            <TouchableOpacity onPress={handleDelete} activeOpacity={0.7} style={{paddingLeft: 10}}>
              <Icon name="trash-outline" size={24} color={colors.danger} />
            </TouchableOpacity>
          );
        }
        return null;
      },
    });
  }, [navigation, me, post, colors]);

  const handleSubmitComment = () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    addCommentMutation.mutate(trimmed);
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, {backgroundColor: colors.background}]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !post) {
    return (
      <View style={[styles.centered, {backgroundColor: colors.background}]}>
        <Icon name="alert-circle-outline" size={48} color={colors.danger} />
        <Text style={[styles.errorText, {color: colors.text}]}>
          게시글을 불러올 수 없습니다.
        </Text>
      </View>
    );
  }

  const topicColor = TOPIC_COLORS[post.topic] || '#6B7280';

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={isRefetching} 
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {}
        <View style={styles.topicRow}>
          <View
            style={[
              styles.topicBadge,
              {backgroundColor: topicColor + '18'},
            ]}>
            <Text style={[styles.topicText, {color: topicColor}]}>
              {post.topic}
            </Text>
          </View>
        </View>

        {}
        <View style={styles.authorRow}>
          {post.author.avatar ? (
            <Image
              source={{uri: post.author.avatar}}
              style={styles.avatar}
            />
          ) : (
            <View
              style={[
                styles.avatar,
                styles.avatarPlaceholder,
                {backgroundColor: colors.surface},
              ]}>
              <Icon name="person" size={18} color={colors.textTertiary} />
            </View>
          )}
          <View style={styles.authorInfo}>
            <Text style={[styles.authorName, {color: colors.text}]}>
              {post.author.username}
            </Text>
            <View style={styles.authorMeta}>
              {post.author.neighborhood && (
                <>
                  <Text
                    style={[styles.authorMetaText, {color: colors.textTertiary}]}>
                    {post.author.neighborhood}
                  </Text>
                  <Text
                    style={[styles.metaDot, {color: colors.textTertiary}]}>
                    ·
                  </Text>
                </>
              )}
              <Text
                style={[styles.authorMetaText, {color: colors.textTertiary}]}>
                {formatToTimeAgo(post.created_at)}
              </Text>
            </View>
          </View>
        </View>

        {}
        <Text style={[styles.title, {color: colors.text}]}>{post.title}</Text>
        {post.description && (
          <Text style={[styles.description, {color: colors.textSecondary}]}>
            {post.description}
          </Text>
        )}

        {}
        {post.images && post.images.length > 0 && (
          <View style={styles.imagesContainer}>
            {post.images.map(img => {
              if (failedImages[img.id]) return null;
              return (
                <Image
                  key={img.id}
                  source={{uri: img.url}}
                  style={styles.postImage}
                  resizeMode="cover"
                  onError={() => setFailedImages(prev => ({...prev, [img.id]: true}))}
                />
              );
            })}
          </View>
        )}

        {}
        <View style={[styles.statsRow, {borderTopColor: colors.border}]}>
          <View style={styles.statItem}>
            <Icon name="eye-outline" size={16} color={colors.textTertiary} />
            <Text style={[styles.statText, {color: colors.textTertiary}]}>
              {post.views}명이 봤어요
            </Text>
          </View>
        </View>

        {}
        <View style={[styles.commentsSection, {borderTopColor: colors.border}]}>
          <Text style={[styles.commentsTitle, {color: colors.text}]}>
            댓글 {post.comments?.length ?? 0}
          </Text>
          {post.comments && post.comments.length > 0 ? (
            post.comments.map((comment: CommentType) => (
              <View
                key={comment.id}
                style={[styles.commentItem, {borderBottomColor: colors.border}]}>
                <View style={styles.commentHeader}>
                  <View style={styles.commentHeaderLeft}>
                    {comment.user.avatar ? (
                      <Image
                        source={{uri: comment.user.avatar}}
                        style={styles.commentAvatar}
                      />
                    ) : (
                      <View
                        style={[
                          styles.commentAvatar,
                          styles.avatarPlaceholder,
                          {backgroundColor: colors.surface},
                        ]}>
                        <Icon
                          name="person"
                          size={12}
                          color={colors.textTertiary}
                        />
                      </View>
                    )}
                    <Text style={[styles.commentAuthor, {color: colors.text}]}>
                      {comment.user.username}
                    </Text>
                    <Text
                      style={[
                        styles.commentTime,
                        {color: colors.textTertiary},
                      ]}>
                      {formatToTimeAgo(comment.created_at)}
                    </Text>
                  </View>
                  {me && me.id === comment.user.id && (
                    <TouchableOpacity
                      style={styles.deleteCommentBtn}
                      activeOpacity={0.7}
                      onPress={() => handleDeleteComment(comment.id)}>
                      <Icon name="trash-outline" size={16} color={colors.textTertiary} />
                    </TouchableOpacity>
                  )}
                </View>
                <Text
                  style={[styles.commentText, {color: colors.textSecondary}]}>
                  {comment.payload}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.noComments, {color: colors.textTertiary}]}>
              아직 댓글이 없어요. 첫 댓글을 남겨보세요!
            </Text>
          )}
        </View>
      </ScrollView>

      {}
      <View
        style={[
          styles.commentInputRow,
          {borderTopColor: colors.border, backgroundColor: colors.surface},
        ]}>
        <TextInput
          value={commentText}
          onChangeText={setCommentText}
          placeholder="댓글을 입력하세요..."
          placeholderTextColor={colors.textTertiary}
          style={[
            styles.commentInput,
            {
              color: colors.text,
              borderColor: colors.inputBorder,
              backgroundColor: colors.inputBackground,
            },
          ]}
          onSubmitEditing={handleSubmitComment}
          returnKeyType="send"
        />
        <TouchableOpacity
          onPress={handleSubmitComment}
          disabled={addCommentMutation.isPending}
          activeOpacity={0.7}>
          <Icon
            name="arrow-up-circle"
            size={36}
            color={
              commentText.trim()
                ? colors.primary
                : colors.textTertiary
            }
          />
        </TouchableOpacity>
      </View>
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
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
  },
  scrollContent: {
    padding: 20,
    gap: 14,
    paddingBottom: 80,
  },
  topicRow: {
    flexDirection: 'row',
  },
  topicBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  topicText: {
    fontSize: 12,
    fontWeight: '600',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorInfo: {
    flex: 1,
    gap: 2,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
  },
  authorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorMetaText: {
    fontSize: 12,
  },
  metaDot: {
    fontSize: 12,
  },
  deleteBtn: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
  },
  imagesContainer: {
    gap: 8,
  },
  postImage: {
    width: screenWidth - 40,
    height: screenWidth - 40,
    borderRadius: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
  },
  commentsSection: {
    borderTopWidth: 1,
    paddingTop: 16,
    gap: 12,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  noComments: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  commentItem: {
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    gap: 6,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commentHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteCommentBtn: {
    padding: 6,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentTime: {
    fontSize: 12,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 36,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  commentInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 14,
  },
});
