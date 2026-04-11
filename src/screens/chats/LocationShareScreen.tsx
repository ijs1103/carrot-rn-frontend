import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  PermissionsAndroid,
  ActivityIndicator,
} from 'react-native';
import {NaverMapView} from '@mj-studio/react-native-naver-map';
import type {Camera} from '@mj-studio/react-native-naver-map';
import Geolocation from '@react-native-community/geolocation';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../../theme';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {getAddressFromCoords} from '../../utils/geocoding';
import {authApi} from '../../api/endpoints';
import {useAuthStore} from '../../stores/authStore';
import {Alert} from 'react-native';

type LocationShareRouteParams = {
  params?: {
    onLocationSelected?: (lat: number, lng: number) => void;
    mode?: 'share' | 'neighborhood';
  };
};

export default function LocationShareScreen() {
  const {colors} = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<LocationShareRouteParams>>();

  // 서울시청 기본 좌표
  const [center, setCenter] = useState({latitude: 37.5665, longitude: 126.978});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const mapRef = useRef<any>(null);
  const {setUser} = useAuthStore();

  const mode = route.params?.mode || 'share';
  const isNeighborhoodMode = mode === 'neighborhood';

  useEffect(() => {
    navigation.setOptions({
      title: isNeighborhoodMode ? '내 동네 설정' : '장소공유',
    });
  }, [navigation, isNeighborhoodMode]);

  // 현재 위치 가져오기
  useEffect(() => {
    const requestLocationPermission = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.error('Permission error:', err);
          setIsLoading(false);
          return;
        }
      }

      Geolocation.getCurrentPosition(
        (position) => {
          setCenter({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setIsLoading(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setIsLoading(false);
        },
        {enableHighAccuracy: true, timeout: 10000, maximumAge: 5000},
      );
    };

    requestLocationPermission();
  }, []);

  const handleCameraChange = useCallback((params: Camera & {reason: string; region: any}) => {
    setCenter({
      latitude: params.latitude,
      longitude: params.longitude,
    });
  }, []);

  const handleShare = () => {
    if (route.params?.onLocationSelected) {
      route.params.onLocationSelected(center.latitude, center.longitude);
    }
    navigation.goBack();
  };

  const handleSetNeighborhood = async () => {
    setIsSaving(true);
    try {
      const {neighborhood} = await getAddressFromCoords(center.latitude, center.longitude);
      if (!neighborhood) {
        Alert.alert('오류', '동네 정보를 가져올 수 없는 위치입니다.');
        return;
      }

      const {data: updatedUser} = await authApi.updateMe({neighborhood});
      setUser(updatedUser);
      navigation.goBack();
    } catch (err) {
      console.error('Update neighborhood error:', err);
      Alert.alert('오류', '동네 설정 중 문제가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 현재 위치로 이동
  const handleMoveToMyLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const newCenter = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setCenter(newCenter);
        mapRef.current?.animateCameraTo({
          latitude: newCenter.latitude,
          longitude: newCenter.longitude,
          zoom: 16,
        });
      },
      (error) => console.error('Geolocation error:', error),
      {enableHighAccuracy: true, timeout: 10000, maximumAge: 5000},
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, {backgroundColor: colors.background}]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{color: colors.text, marginTop: 12}}>위치를 가져오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* 네이버 지도 */}
      <View style={styles.mapContainer}>
        <NaverMapView
          ref={mapRef}
          style={styles.map}
          initialCamera={{
            latitude: center.latitude,
            longitude: center.longitude,
            zoom: 16,
          }}
          onCameraChanged={handleCameraChange}
          isShowLocationButton={false}
          isShowZoomControls={false}
          isShowCompass={false}
          isShowScaleBar={false}
        />
        {/* 중앙 고정 마커 */}
        <View style={styles.centerMarker} pointerEvents="none">
          <Icon name="location" size={44} color="#F97316" />
        </View>

        {/* 현재 위치 버튼 */}
        <TouchableOpacity
          style={[styles.myLocationBtn, {backgroundColor: colors.background}]}
          onPress={handleMoveToMyLocation}
          activeOpacity={0.8}
        >
          <Icon name="locate" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* 하단 공유 버튼 */}
      <View style={[styles.bottomBar, {backgroundColor: colors.background}]}>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={isNeighborhoodMode ? handleSetNeighborhood : handleShare}
          activeOpacity={0.8}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.shareButtonText}>
              {isNeighborhoodMode ? '나의 동네 설정' : '이 장소 공유하기'}
            </Text>
          )}
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
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  centerMarker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -22,
    marginTop: -44,
    zIndex: 10,
  },
  myLocationBtn: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  bottomBar: {
    padding: 16,
    paddingBottom: 32,
  },
  shareButton: {
    backgroundColor: '#F97316',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
