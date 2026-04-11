import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {launchImageLibrary} from 'react-native-image-picker';
import {useForm, Controller} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import Icon from 'react-native-vector-icons/Ionicons';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useTheme} from '../../theme';
import {productsApi} from '../../api';
import {uploadToCloudinary} from '../../utils/cloudinary';
import Button from '../../components/Button';
import Input from '../../components/Input';

const schema = z.object({
  title: z.string().min(1, '제목을 입력해주세요'),
  price: z.string().min(1, '가격을 입력해주세요'),
  description: z.string().min(1, '설명을 입력해주세요'),
});

type FormData = z.infer<typeof schema>;

export default function ProductAddScreen() {
  const {colors} = useTheme();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isGiveaway, setIsGiveaway] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: {errors},
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      price: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: {
      title: string;
      price: number;
      photo: string;
      description: string;
    }) => productsApi.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({queryKey: ['products']});
      queryClient.invalidateQueries({queryKey: ['myProducts']});
      navigation.replace('ProductDetail', {id: (res.data as any).id || res.data});
    },
    onError: () => {
      Alert.alert('오류', '상품 등록에 실패했습니다.');
    },
  });

  const pickImage = async () => {
    if (previews.length >= 10) {
      Alert.alert('알림', '최대 10장까지 첨부할 수 있습니다.');
      return;
    }
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 10 - previews.length,
    });
    if (result.assets) {
      const newUris = result.assets.map(a => a.uri!).filter(Boolean);
      setPreviews(prev => [...prev, ...newUris].slice(0, 10));
    }
  };

  const removeImage = (index: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleGiveawayToggle = (isGive: boolean) => {
    setIsGiveaway(isGive);
    if (isGive) {
      setValue('price', '0');
    } else {
      setValue('price', '');
    }
  };

  const onSubmit = async (data: FormData) => {
    if (previews.length === 0) {
      Alert.alert('알림', '대표 사진을 최소 1장 이상 등록해주세요.');
      return;
    }

    setIsUploading(true);
    let photoUrl = '';

    try {
      if (previews.length > 0) {
        const uploadPromises = previews.map(uri => uploadToCloudinary(uri));
        const uploadedUrls = await Promise.all(uploadPromises);
        photoUrl = uploadedUrls.join(',');
      }
      
      mutation.mutate({
        title: data.title,
        price: parseFloat(data.price),
        photo: photoUrl,
        description: data.description,
      });
    } catch (error) {
      Alert.alert('업로드 오류', '이미지 업로드 중 문제가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        
        {/* 사진 등록 영역 */}
        <View style={styles.photoSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoScrollContent}>
            <TouchableOpacity
              style={[styles.cameraBox, {borderColor: colors.border}]}
              activeOpacity={0.7}
              onPress={pickImage}>
              <Icon name="camera" size={24} color={colors.textTertiary} />
              <Text style={[styles.cameraText, {color: previews.length > 0 ? colors.primary : colors.textTertiary}]}>
                {previews.length}/10
              </Text>
            </TouchableOpacity>
            
            {previews.map((uri, idx) => (
              <View key={idx} style={styles.previewItemWrapper}>
                <Image source={{uri}} style={styles.previewImage} />
                <TouchableOpacity
                  style={[styles.removeBtn, {backgroundColor: 'rgba(0,0,0,0.6)'}]}
                  onPress={() => removeImage(idx)}>
                  <Icon name="close" size={14} color="#FFF" />
                </TouchableOpacity>
                {idx === 0 && (
                  <View style={[styles.mainPhotoBadge, {backgroundColor: 'rgba(0,0,0,0.7)'}]}>
                    <Text style={styles.mainPhotoText}>대표사진</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={[styles.divider, {backgroundColor: colors.border}]} />

        <View style={styles.section}>
          <Text style={[styles.label, {color: colors.text}]}>제목</Text>
          <Controller
            control={control}
            name="title"
            render={({field: {onChange, onBlur, value}}) => (
              <Input
                name="title"
                placeholder="제목을 입력해주세요."
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                errors={errors.title ? [errors.title.message!] : []}
              />
            )}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, {color: colors.text}]}>자세한 설명</Text>
          <Controller
            control={control}
            name="description"
            render={({field: {onChange, onBlur, value}}) => (
              <Input
                name="description"
                placeholder={`신림동에 올릴 게시글 내용을 작성해 주세요. (판매 금지 물품은 게시가 제한될 수 있어요.)\n\n신뢰할 수 있는 거래를 위해 자세히 적어주세요.\n과학기술정보통신부, 한국 인터넷진흥원과 함께 해요.`}
                multiline
                style={styles.descInput}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                errors={errors.description ? [errors.description.message!] : []}
              />
            )}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, {color: colors.text}]}>가격</Text>
          <View style={styles.priceToggleRow}>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                !isGiveaway ? {backgroundColor: '#333', borderColor: '#333'} : {backgroundColor: colors.background, borderColor: colors.border},
              ]}
              activeOpacity={0.8}
              onPress={() => handleGiveawayToggle(false)}>
              <Text style={[styles.toggleText, {color: !isGiveaway ? '#FFF' : colors.text}]}>판매하기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                isGiveaway ? {backgroundColor: '#333', borderColor: '#333'} : {backgroundColor: colors.background, borderColor: colors.border},
              ]}
              activeOpacity={0.8}
              onPress={() => handleGiveawayToggle(true)}>
              <Text style={[styles.toggleText, {color: isGiveaway ? '#FFF' : colors.text}]}>나눔하기</Text>
            </TouchableOpacity>
          </View>
          <Controller
            control={control}
            name="price"
            render={({field: {onChange, onBlur, value}}) => (
              <Input
                name="price"
                placeholder="₩ 가격을 입력해주세요."
                keyboardType="numeric"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                editable={!isGiveaway}
                errors={errors.price ? [errors.price.message!] : []}
              />
            )}
          />
        </View>
      </ScrollView>

      {/* 하단 고정 작성 완료 버튼 */}
      <View style={[styles.bottomBtnContainer, {backgroundColor: colors.background, borderTopColor: colors.border}]}>
        <Button
          text="작성 완료"
          onPress={handleSubmit(onSubmit)}
          loading={isUploading || mutation.isPending}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 120, // 버튼에 가려지지 않게 여백 추가
  },
  photoSection: {
    paddingVertical: 16,
  },
  photoScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  cameraBox: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  cameraText: {
    fontSize: 12,
    fontWeight: '500',
  },
  previewItemWrapper: {
    width: 72,
    height: 72,
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainPhotoBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 4,
    alignItems: 'center',
  },
  mainPhotoText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 8,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
  descInput: {
    height: 150,
  },
  priceToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  toggleBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bottomBtnContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
});

