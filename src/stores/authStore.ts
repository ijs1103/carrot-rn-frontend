import {create} from 'zustand';
import {tokenStorage} from '../api/client';
import {authApi} from '../api/endpoints';
import {User} from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  initialize: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  signup: (data: {
    username: string;
    email?: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    try {
      const token = await tokenStorage.get();
      if (token) {
        const {data: user} = await authApi.getMe();
        set({user, isAuthenticated: true, isLoading: false});
      } else {
        set({isLoading: false});
      }
    } catch {
      await tokenStorage.remove();
      set({user: null, isAuthenticated: false, isLoading: false});
    }
  },

  login: async (username: string, password: string) => {
    const {data: tokenData} = await authApi.login(username, password);
    await tokenStorage.set(tokenData.access_token);
    const {data: user} = await authApi.getMe();
    set({user, isAuthenticated: true});
  },

  signup: async (data) => {
    await authApi.signup(data);
    
    await get().login(data.username, data.password);
  },

  logout: async () => {
    await tokenStorage.remove();
    set({user: null, isAuthenticated: false});
  },

  setUser: (user: User) => set({user}),
}));
