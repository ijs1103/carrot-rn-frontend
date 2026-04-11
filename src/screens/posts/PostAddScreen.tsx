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
import {postsApi} from '../../api';
import {uploadToCloudinary} from '../../utils/cloudinary';
import Button from '../../components/Button';
import Input from '../../components/Input';

const TOPICS = ['동네친구', '맛집', '일반'] as const;

const TOPIC_COLORS: Record<string, string> = {
  '동네친구': '#3B82F6',
  '맛집': '#EF4444',
  '일반': '#6B7280',
};

const schema = z.object({
  title: z.string().min(1, '제목을 입력해주세요'),
  description: z.string().min(1, '내용을 입력해주세요'),
});

type FormData = z.infer<typeof schema>;

export default function PostAddScreen() {
  const {colors} = useTheme();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [selectedTopic, setSelectedTopic] = useState<string>('일반');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (data: {
      title: string;
      description: string;
      topic: string;
      image_urls: string[];
    }) => postsApi.create(data),
    onSuccess: res => {
      queryClient.invalidateQueries({queryKey: ['posts']});
      const postId = (res.data as any).id;
      if (postId) {
        navigation.replace('PostDetail', {id: postId});
      } else {
        navigation.goBack();
      }
    },
    onError: () => {
      Alert.alert('오류', '게시글 등록에 실패했습니다.');
    },
  });

  const pickImages = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 5,
    });
    if (result.assets) {
      const uris = result.assets
        .map(asset => asset.uri)
        .filter((uri): uri is string => !!uri);
      setImageUris(prev => [...prev, ...uris].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    setImageUris(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    setIsUploading(true);
    try {
      
      const uploadedUrls: string[] = [];
      for (const uri of imageUris) {
        const url = await uploadToCloudinary(uri);
        uploadedUrls.push(url);
      }

      mutation.mutate({
        title: data.title,
        description: data.description,
        topic: selectedTopic,
        image_urls: uploadedUrls,
      });
    } catch {
      Alert.alert('업로드 오류', '이미지 업로드 중 문제가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
      {}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, {color: colors.text}]}>
          주제 선택
        </Text>
        <View style={styles.topicRow}>
          {TOPICS.map(topic => {
            const isSelected = selectedTopic === topic;
            const topicColor = TOPIC_COLORS[topic];
            return (
              <TouchableOpacity
                key={topic}
                style={[
                  styles.topicChip,
                  {
                    backgroundColor: isSelected
                      ? topicColor + '20'
                      : colors.surface,
                    borderColor: isSelected ? topicColor : colors.border,
                  },
                ]}
                onPress={() => setSelectedTopic(topic)}>
                <Text
                  style={[
                    styles.topicChipText,
                    {color: isSelected ? topicColor : colors.textSecondary},
                  ]}>
                  {topic}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {}
      <Controller
        control={control}
        name="title"
        render={({field: {onChange, onBlur, value}}) => (
          <Input
            name="title"
            placeholder="제목을 입력해주세요"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            errors={errors.title ? [errors.title.message!] : []}
          />
        )}
      />

      {}
      <Controller
        control={control}
        name="description"
        render={({field: {onChange, onBlur, value}}) => (
          <Input
            name="description"
            placeholder="동네 이웃들과 나누고 싶은 이야기를 적어보세요"
            multiline
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            errors={errors.description ? [errors.description.message!] : []}
          />
        )}
      />

      {}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, {color: colors.text}]}>
          사진 첨부 ({imageUris.length}/5)
        </Text>
        <View style={styles.imageRow}>
          {}
          {imageUris.length < 5 && (
            <TouchableOpacity
              style={[
                styles.addImageBox,
                {borderColor: colors.inputBorder, backgroundColor: colors.surface},
              ]}
              onPress={pickImages}>
              <Icon name="camera-outline" size={28} color={colors.textTertiary} />
              <Text style={[styles.addImageText, {color: colors.textTertiary}]}>
                추가
              </Text>
            </TouchableOpacity>
          )}

          {}
          {imageUris.map((uri, index) => (
            <View key={index} style={styles.imagePreviewContainer}>
              <Image source={{uri}} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.removeImageBtn}
                onPress={() => removeImage(index)}>
                <Icon name="close-circle" size={22} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      </ScrollView>

      {}
      <View style={[styles.bottomButtonContainer, {backgroundColor: colors.background, borderTopColor: colors.border}]}>
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
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  bottomButtonContainer: {
    padding: 16,
    borderTopWidth: 1,
    paddingBottom: 32, 
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  topicRow: {
    flexDirection: 'row',
    gap: 10,
  },
  topicChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  topicChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  imageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  addImageBox: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addImageText: {
    fontSize: 12,
  },
  imagePreviewContainer: {
    position: 'relative',
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#fff',
    borderRadius: 11,
  },
});
