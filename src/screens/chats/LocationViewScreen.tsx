import React, {useEffect} from 'react';
import {View, StyleSheet} from 'react-native';
import {NaverMapView, NaverMapMarkerOverlay} from '@mj-studio/react-native-naver-map';
import {useTheme} from '../../theme';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';

type LocationViewRouteParams = {
  params: {
    latitude: number;
    longitude: number;
  };
};

export default function LocationViewScreen() {
  const {colors} = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<LocationViewRouteParams>>();
  const {latitude, longitude} = route.params;

  useEffect(() => {
    navigation.setOptions({
      title: '장소 보기',
    });
  }, [navigation]);

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <NaverMapView
        style={styles.map}
        initialCamera={{
          latitude,
          longitude,
          zoom: 16,
        }}
        isShowLocationButton={false}
        isShowZoomControls={true}
        isShowCompass={true}
      >
        <NaverMapMarkerOverlay
          latitude={latitude}
          longitude={longitude}
          width={40}
          height={44}
          anchor={{x: 0.5, y: 1}}
        />
      </NaverMapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
