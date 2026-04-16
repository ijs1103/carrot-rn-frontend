import axios, {AxiosError, InternalAxiosRequestConfig} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';

const TOKEN_KEY = '@carrot_token';
const REFRESH_TOKEN_KEY = '@carrot_refresh_token';

const baseURL = Platform.select({
  android: 'http://10.0.2.2:8000/api/v1',
  ios: 'http://localhost:8000/api/v1',
});

export const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

// 로그아웃 콜백 저장용
let onUnauthorized: (() => void) | null = null;

export const setUnauthorizedCallback = (callback: () => void) => {
  onUnauthorized = callback;
};

// 토큰 갱신 중복 방지 플래그 변수
let isRefreshing = false;
// 토큰 갱신중 발생한 다른 api 요청들을 담아두는 대기열
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {_retry?: boolean};

    // 401이고 아직 재시도하지 않은 요청인 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      // login 또는 refresh 요청은 갱신 대상 x
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/refresh')
      ) {
        return Promise.reject(error);
      }

      // 이미 다른 요청이 토큰 갱신 중이면 대기열에 추가
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({resolve, reject});
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const {data} = await axios.post(`${baseURL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const newAccessToken = data.access_token;
        const newRefreshToken = data.refresh_token;

        await AsyncStorage.setItem(TOKEN_KEY, newAccessToken);
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);

        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // refresh도 실패 => 로그아웃 처리
        await AsyncStorage.removeItem(TOKEN_KEY);
        await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
        if (onUnauthorized) {
          onUnauthorized();
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export const tokenStorage = {
  get: () => AsyncStorage.getItem(TOKEN_KEY),
  set: (token: string) => AsyncStorage.setItem(TOKEN_KEY, token),
  remove: async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  },
  getRefresh: () => AsyncStorage.getItem(REFRESH_TOKEN_KEY),
  setRefresh: (token: string) => AsyncStorage.setItem(REFRESH_TOKEN_KEY, token),
};

export default api;
