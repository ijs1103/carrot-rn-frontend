import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { Product } from '../types';
import { formatToTimeAgo, formatToWon } from '../utils';
import Icon from 'react-native-vector-icons/Ionicons';

type Props = Pick<Product, 'id' | 'title' | 'price' | 'photo' | 'created_at' | 'neighborhood'> & {
  onOptionsPress?: () => void;
};

export default function ListProduct({
  id,
  title,
  price,
  photo,
  created_at,
  neighborhood,
  onOptionsPress,
}: Props) {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const coverPhoto = photo ? photo.split(',')[0].trim() : '';

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('ProductDetail', { id })}>
      <View style={[styles.imageContainer, { backgroundColor: colors.surface }]}>
        <Image
          source={{ uri: coverPhoto }}
          style={styles.image}
          resizeMode="cover"
        />
      </View>
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.metaRow}>
          {neighborhood && (
            <>
              <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                {neighborhood}
              </Text>
              <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                ·
              </Text>
            </>
          )}
          <Text style={[styles.metaText, { color: colors.textTertiary }]}>
            {formatToTimeAgo(created_at)}
          </Text>
        </View>
        <Text style={[styles.price, { color: colors.text }]}>
          {formatToWon(price)}원
        </Text>
      </View>

      {onOptionsPress && (
        <TouchableOpacity
          onPress={onOptionsPress}
          style={styles.optionsBtn}
          activeOpacity={0.7}>
          <Icon name="ellipsis-vertical" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
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
  image: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
    gap: 4,
    justifyContent: 'center',
    paddingRight: 24, 
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
  },
  optionsBtn: {
    position: 'absolute',
    top: 4,
    right: -4,
    padding: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
  },
  price: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 2,
  },
});
