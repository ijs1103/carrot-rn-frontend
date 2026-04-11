import React, {useState} from 'react';
import {TouchableOpacity, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../theme';
import {postsApi} from '../api';

interface LikeButtonProps {
  isLiked: boolean;
  likeCount: number;
  postId: number;
}

export default function LikeButton({
  isLiked: initialIsLiked,
  likeCount: initialLikeCount,
  postId,
}: LikeButtonProps) {
  const {colors} = useTheme();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);

  const handlePress = async () => {
    
    setIsLiked(prev => !prev);
    setLikeCount(prev => (isLiked ? prev - 1 : prev + 1));

    try {
      if (isLiked) {
        await postsApi.unlike(postId);
      } else {
        await postsApi.like(postId);
      }
    } catch {
      
      setIsLiked(prev => !prev);
      setLikeCount(prev => (isLiked ? prev + 1 : prev - 1));
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={[
        styles.button,
        {
          backgroundColor: isLiked ? colors.primary : 'transparent',
          borderColor: isLiked ? colors.primary : colors.textTertiary,
        },
      ]}>
      <Icon
        name={isLiked ? 'thumbs-up' : 'thumbs-up-outline'}
        size={18}
        color={isLiked ? '#FFFFFF' : colors.textTertiary}
      />
      <Text
        style={[
          styles.text,
          {color: isLiked ? '#FFFFFF' : colors.textTertiary},
        ]}>
        {isLiked ? ` ${likeCount}` : `공감하기 (${likeCount})`}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
});
