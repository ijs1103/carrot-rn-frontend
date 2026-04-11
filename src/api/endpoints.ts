import api from './client';
import {
  TokenResponse,
  User,
  Product,
  ProductListResponse,
  Post,
  PostListResponse,
  PostDetail,
  Comment,
  Message,
  ChatRoom,
  ChatRoomDetail,
} from '../types';


export const authApi = {
  signup: (data: {username: string; email?: string; password: string}) =>
    api.post<User>('/auth/signup', data),

  login: (username: string, password: string) => {
    const payload = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
    return api.post<TokenResponse>('/auth/login', payload, {
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    });
  },

  getMe: () => api.get<User>('/auth/me'),

  updateMe: (data: {username?: string; avatar?: string; neighborhood?: string}) =>
    api.patch<User>('/auth/me', data),
};


export const productsApi = {
  list: (params?: {cursor?: number; limit?: number}) =>
    api.get<ProductListResponse>('/products', {params}),

  getById: (id: number | string) => api.get<Product>(`/products/${id}`),

  create: (data: {
    title: string;
    price: number;
    photo: string;
    description: string;
  }) => api.post<Product>('/products', data),

  delete: (id: number | string) => api.delete(`/products/${id}`),

  myProducts: (params?: {status?: string}) =>
    api.get<ProductListResponse>('/products/me', {params}),

  myFavorites: (params?: {cursor?: number; limit?: number}) =>
    api.get<ProductListResponse>('/products/me/favorites', {params}),

  updateStatus: (id: number | string, status: string) =>
    api.patch<Product>(`/products/${id}/status`, {status}),

  toggleFavorite: (id: number | string) =>
    api.post<{is_favorited: boolean; favorite_count: number}>(`/products/${id}/favorite`),

  getFavorite: (id: number | string) =>
    api.get<{is_favorited: boolean; favorite_count: number}>(`/products/${id}/favorite`),

  block: (id: number | string) =>
    api.post(`/products/${id}/block`),
};


export const reportsApi = {
  create: (data: {target_type: string; target_id: number; reason: string}) =>
    api.post('/reports', data),
};


export const postsApi = {
  list: (params?: {cursor?: number; limit?: number}) =>
    api.get<PostListResponse>('/posts', {params}),

  getById: (id: number) => api.get<PostDetail>(`/posts/${id}`),

  create: (data: {
    title: string;
    description?: string;
    topic?: string;
    image_urls?: string[];
  }) => api.post<PostDetail>('/posts', data),

  delete: (id: number) => api.delete(`/posts/${id}`),

  addComment: (postId: number, payload: string) =>
    api.post<Comment>(`/posts/${postId}/comments`, {payload}),

  deleteComment: (postId: number, commentId: number) =>
    api.delete(`/posts/${postId}/comments/${commentId}`),
};


export const chatsApi = {
  getMyRooms: () =>
    api.get<any[]>('/chats/rooms/me'),

  getRoom: (chatRoomId: string) => 
    api.get<ChatRoomDetail>(`/chats/${chatRoomId}`),

  leaveRoom: (chatRoomId: string) =>
    api.delete(`/chats/${chatRoomId}`),

  getMessages: (chatRoomId: string) =>
    api.get<Message[]>(`/chats/${chatRoomId}/messages`),

  sendMessage: (chatRoomId: string, payload: string) =>
    api.post(`/chats/${chatRoomId}/messages`, {payload}),

  createRoom: (productId: number) =>
    api.post<{room: ChatRoom, ticket: string}>('/chats/rooms', {product_id: productId}),
};


export const notificationsApi = {
  updateToken: (token: string) =>
    api.post('/notifications/token', {token}),
};

