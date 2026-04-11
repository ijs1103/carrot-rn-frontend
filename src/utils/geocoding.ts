import { NAVER_CLIENT_ID, NAVER_CLIENT_SECRET } from '../config/naver';

interface GeocodeResult {
  fullAddress: string;
  neighborhood: string;
}

/**
 * 네이버 역지오코딩 API를 사용하여 좌표를 주소로 변환합니다.
 * @param lat 위도
 * @param lng 경도
 * @returns {Promise<GeocodeResult>} 전체 주소와 동네 이름을 포함하는 객체
 */
export const getAddressFromCoords = async (lat: number, lng: number): Promise<GeocodeResult> => {
  try {
    const url = `https://maps.apigw.ntruss.com/map-reversegeocode/v2/gc?coords=${encodeURIComponent(`${lng},${lat}`)}&orders=${encodeURIComponent('legalcode,admcode,addr,roadaddr')}&output=json`;
    const response = await fetch(url, {
      headers: {
        'x-ncp-apigw-api-key-id': NAVER_CLIENT_ID,
        'x-ncp-apigw-api-key': NAVER_CLIENT_SECRET,
      },
    });

    const data = await response.json();
    console.log('Naver Geocoding Response:', JSON.stringify(data));

    if (data?.status?.code == 0 && data?.results?.length > 0) {
      // 여러 결과 중 첫 번째를 사용 (도로명 주소 우선순위)
      const res = data.results[0];
      const region = res.region;
      const land = res.land;

      // 전체 주소 생성
      const fullAddress = `${region.area1.name} ${region.area2.name} ${region.area3.name} ${land?.name || ''} ${land?.number1 || ''}`.trim();

      // 동네 이름 (area3: 법정동/읍/면)
      const neighborhood = region.area3.name || '';

      return {
        fullAddress,
        neighborhood,
      };
    }

    return {
      fullAddress: '',
      neighborhood: '',
    };
  } catch (error) {
    console.error('Reverse Geocode error:', error);
    return {
      fullAddress: '',
      neighborhood: '',
    };
  }
};
