import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import { useQueryClient } from '@tanstack/react-query';
import { chatsApi } from '../api';
import { Message } from '../types';
import { formatToTimeAgo } from '../utils';
import { uploadToCloudinary } from '../utils/cloudinary';
import { NAVER_CLIENT_ID, NAVER_CLIENT_SECRET } from '../config/naver';
import { getAddressFromCoords } from '../utils/geocoding';

const IMAGE_PREFIX = '[image]';
const LOCATION_PREFIX = '[location]';
const screenWidth = Dimensions.get('window').width;

interface ChatMessagesListProps {
  initialMessages: Message[];
  userId: number;
  chatRoomId: string;
  ticket?: string;
  username: string;
  avatar: string;
}

export default function ChatMessagesList({
  initialMessages,
  userId,
  chatRoomId,
  ticket,
  username,
  avatar,
}: ChatMessagesListProps) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const navigation = useNavigation<any>();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [message, setMessage] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    setMessages(prev => {
      const messageMap = new Map();
      initialMessages.forEach(m => messageMap.set(m.id, m));
      return Array.from(messageMap.values()).sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });
  }, [initialMessages]);

  const isConnectingRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  useEffect(() => {
    if (!ticket) return;
    if (isConnectingRef.current) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    let isCancelled = false;

    const connect = () => {
      if (isCancelled) return;
      isConnectingRef.current = true;

      const host = Platform.OS === 'android' ? '10.0.2.2:8787' : 'localhost:8787';
      const wsUrl = `ws://${host}/ws/rooms/${chatRoomId}?ticket=${ticket}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WS connected room: ', chatRoomId);
        retryCountRef.current = 0;
        isConnectingRef.current = false;
      };

      ws.onmessage = (e) => {
        try {
          if (typeof e.data === 'string') {
            const newMsg = JSON.parse(e.data);
            setMessages(prev => [...prev, newMsg]);
          }
        } catch (err) {
          console.error("Parse error", err);
        }
      };

      ws.onerror = (e) => {
        console.error("WS error: ", e);
      };

      ws.onclose = () => {
        console.log('WS closed');
        isConnectingRef.current = false;
        wsRef.current = null;
        if (!isCancelled && retryCountRef.current < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 8000);
          retryCountRef.current += 1;
          setTimeout(connect, delay);
        }
      };

      wsRef.current = ws;
    };

    connect();

    return () => {
      isCancelled = true;
      isConnectingRef.current = false;
      retryCountRef.current = 0;
      if (wsRef.current) {
        // Prevent any handlers from firing after the component is unmounted
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [chatRoomId, ticket, userId]);

  const sendMessagePayload = async (payload: string) => {
    const newMsg: Message = {
      id: Date.now(),
      payload,
      created_at: new Date().toISOString(),
      userId,
      chatRoomId,
      user: { username, avatar },
    };

    setMessages(prev => [...prev, newMsg]);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        roomId: chatRoomId,
        userId: userId,
        payload,
        user: { username, avatar },
      }));
    } else {
      await chatsApi.sendMessage(chatRoomId, payload);
    }
    queryClient.invalidateQueries({ queryKey: ['my-chat-rooms'] });
    queryClient.invalidateQueries({ queryKey: ['chat-messages', chatRoomId] });
  };

  const onSubmit = async () => {
    if (!message.trim()) return;
    await sendMessagePayload(message);
    setMessage('');
  };

  // 이미지 업로드 후 전송
  const handleImageSend = async (uri: string) => {
    setShowAttachments(false);
    setIsUploading(true);
    try {
      const cloudinaryUrl = await uploadToCloudinary(uri);
      await sendMessagePayload(`${IMAGE_PREFIX}${cloudinaryUrl}`);
    } catch (error) {
      Alert.alert('오류', '이미지 업로드에 실패했습니다.');
      console.error('Image upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePickFromAlbum = () => {
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.8, selectionLimit: 1 },
      (response) => {
        if (response.didCancel || response.errorCode) return;
        const asset = response.assets?.[0];
        if (asset?.uri) {
          handleImageSend(asset.uri);
        }
      },
    );
  };

  const handleTakePhoto = () => {
    launchCamera(
      { mediaType: 'photo', quality: 0.8, saveToPhotos: false },
      (response) => {
        if (response.didCancel || response.errorCode) return;
        const asset = response.assets?.[0];
        if (asset?.uri) {
          handleImageSend(asset.uri);
        }
      },
    );
  };

  // 장소 공유
  const handleShareLocation = () => {
    setShowAttachments(false);
    navigation.navigate('LocationShare', {
      onLocationSelected: async (lat: number, lng: number) => {
        const { fullAddress } = await getAddressFromCoords(lat, lng);
        sendMessagePayload(`${LOCATION_PREFIX}${lat},${lng},${fullAddress}`);
      },
    });
  };

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: false });
    }, 100);
  }, [messages.length]);

  // 메시지 타입 판별
  const isImageMessage = (payload: string) => payload.startsWith(IMAGE_PREFIX);
  const getImageUrl = (payload: string) => payload.slice(IMAGE_PREFIX.length);
  const isLocationMessage = (payload: string) => payload.startsWith(LOCATION_PREFIX);
  const getLocationCoords = (payload: string) => {
    const parts = payload.slice(LOCATION_PREFIX.length).split(',');
    return {
      lat: parseFloat(parts[0]),
      lng: parseFloat(parts[1]),
      address: parts[2] || '',
    };
  };



  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.userId === userId;
    const isImage = isImageMessage(item.payload);
    const isLocation = isLocationMessage(item.payload);

    const msgDateObj = new Date(item.created_at);
    const isValidDate = !isNaN(msgDateObj.getTime());
    const currentDate = isValidDate ? msgDateObj.toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric'
    }) : '';

    let showDate = false;
    if (isValidDate) {
      if (index === 0) {
        showDate = true;
      } else {
        const prevMsgDate = new Date(messages[index - 1].created_at);
        if (!isNaN(prevMsgDate.getTime())) {
          const prevDate = prevMsgDate.toLocaleDateString('ko-KR', {
            year: 'numeric', month: 'long', day: 'numeric'
          });
          if (currentDate !== prevDate) {
            showDate = true;
          }
        }
      }
    }

    const imageWidth = screenWidth * 0.55;
    const imageHeight = imageWidth * 1.2;
    const mapPreviewWidth = screenWidth * 0.6;
    const mapPreviewHeight = mapPreviewWidth * 0.65;

    return (
      <View>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={[styles.dateText, { color: colors.textTertiary }]}>{currentDate}</Text>
          </View>
        )}
        <View
          style={[styles.msgRow, isMe && styles.msgRowMe]}>
          {!isMe && (
            item.user.avatar ? (
              <Image
                source={{ uri: item.user.avatar }}
                style={styles.avatar}
              />
            ) : (
              <Icon name="person-circle-outline" size={32} color={colors.textTertiary} style={styles.avatar} />
            )
          )}
          <View style={[styles.msgContent, isMe && styles.msgContentMe]}>
            {isLocation ? (
              (() => {
                const { lat, lng, address } = getLocationCoords(item.payload);
                return (
                  <View style={[styles.locationBubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.locationTextContainer}>
                      <View style={styles.locationIconCircle}>
                        <Icon name="location" size={20} color="#F97316" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.locationTitle, { color: colors.text }]}>공유된 장소</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.locationViewButton, { borderTopColor: colors.border }]}
                      onPress={() => navigation.navigate('LocationView', { latitude: lat, longitude: lng })}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.locationViewText, { color: colors.primary }]}>장소 보기</Text>
                    </TouchableOpacity>
                  </View>
                );
              })()
            ) : isImage ? (
              <Image
                source={{ uri: getImageUrl(item.payload) }}
                style={[styles.chatImage, { width: imageWidth, height: imageHeight }]}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.bubble,
                  {
                    backgroundColor: isMe
                      ? colors.chatBubbleMe
                      : colors.chatBubbleOther,
                  },
                ]}>
                <Text
                  style={{
                    color: isMe
                      ? colors.chatBubbleTextMe
                      : colors.chatBubbleTextOther,
                    fontSize: 15,
                  }}>
                  {item.payload}
                </Text>
              </View>
            )}
            <Text style={[styles.time, { color: colors.textTertiary }]}>
              {formatToTimeAgo(item.created_at)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      />
      {isUploading && (
        <View style={[styles.uploadingBar, { backgroundColor: colors.border }]}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={{ color: colors.text, marginLeft: 8, fontSize: 13 }}>이미지 업로드 중...</Text>
        </View>
      )}
      <View style={[styles.inputRow, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={{ marginRight: 4 }}
          onPress={() => {
            if (!showAttachments) {
              Keyboard.dismiss();
            }
            setShowAttachments(!showAttachments);
          }}
        >
          <Icon name={showAttachments ? "close" : "add"} size={28} color={colors.textTertiary} />
        </TouchableOpacity>
        <TextInput
          value={message}
          onChangeText={setMessage}
          onFocus={() => setShowAttachments(false)}
          placeholder="메시지를 입력하세요..."
          placeholderTextColor={colors.textTertiary}
          style={[
            styles.input,
            {
              color: colors.text,
              borderColor: colors.inputBorder,
              backgroundColor: colors.inputBackground,
            },
          ]}
          onSubmitEditing={onSubmit}
          returnKeyType="send"
        />
        <TouchableOpacity onPress={onSubmit} activeOpacity={0.7}>
          <Icon name="arrow-up-circle" size={40} color={colors.primary} />
        </TouchableOpacity>
      </View>
      {showAttachments && (
        <View style={styles.attachmentsContainer}>
          <TouchableOpacity style={styles.attachmentButton} activeOpacity={0.7} onPress={handlePickFromAlbum}>
            <View style={[styles.attachmentIconBox, { backgroundColor: colors.border }]}>
              <Icon name="image-outline" size={30} color={colors.text} />
            </View>
            <Text style={[styles.attachmentText, { color: colors.text }]}>앨범</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.attachmentButton} activeOpacity={0.7} onPress={handleTakePhoto}>
            <View style={[styles.attachmentIconBox, { backgroundColor: colors.border }]}>
              <Icon name="camera-outline" size={30} color={colors.text} />
            </View>
            <Text style={[styles.attachmentText, { color: colors.text }]}>카메라</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.attachmentButton} activeOpacity={0.7} onPress={handleShareLocation}>
            <View style={[styles.attachmentIconBox, { backgroundColor: colors.border }]}>
              <Icon name="location-outline" size={30} color={colors.text} />
            </View>
            <Text style={[styles.attachmentText, { color: colors.text }]}>장소</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    fontSize: 12,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  msgRowMe: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  msgContent: {
    maxWidth: '75%',
    gap: 4,
  },
  msgContentMe: {
    alignItems: 'flex-end',
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  chatImage: {
    borderRadius: 12,
  },
  locationBubble: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  locationMapImage: {
    borderTopLeftRadius: 11,
    borderTopRightRadius: 11,
  },
  locationTextContainer: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 200,
  },
  locationIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 13,
  },
  locationViewButton: {
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  locationViewText: {
    fontSize: 14,
    fontWeight: '700',
  },
  time: {
    fontSize: 11,
  },
  uploadingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  attachmentsContainer: {
    height: 260,
    flexDirection: 'row',
    padding: 24,
    gap: 32,
  },
  attachmentButton: {
    alignItems: 'center',
    gap: 8,
  },
  attachmentIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentText: {
    fontSize: 13,
  },
});
