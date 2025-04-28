import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, LoginCredentials, RegisterCredentials, User } from '@/types/auth';

// Mock authentication for demo purposes
// In a real app, this would connect to a backend service
const mockUsers: User[] = [
  {
    id: '1',
    email: 'demo@example.com',
    displayName: 'Demo User',
    photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  }
];

interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

// Create the store with persist middleware
export const useAuth = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const user = mockUsers.find(u => u.email === credentials.email);
          
          if (user && credentials.password === 'password') { // Simple mock password check
            set({ 
              user: {
                ...user,
                lastLogin: new Date().toISOString()
              },
              isLoading: false 
            });
          } else {
            throw new Error('Invalid email or password');
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An unknown error occurred', 
            isLoading: false 
          });
        }
      },

      register: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const existingUser = mockUsers.find(u => u.email === credentials.email);
          if (existingUser) {
            throw new Error('Email already in use');
          }
          
          const newUser: User = {
            id: String(mockUsers.length + 1),
            email: credentials.email,
            displayName: credentials.displayName,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
          };
          
          mockUsers.push(newUser);
          set({ user: newUser, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An unknown error occurred', 
            isLoading: false 
          });
        }
      },

      logout: () => {
        set({ user: null, error: null });
      },

      resetPassword: async (email) => {
        set({ isLoading: true, error: null });
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const user = mockUsers.find(u => u.email === email);
          if (!user) {
            throw new Error('No account found with this email');
          }
          
          // In a real app, this would send a password reset email
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An unknown error occurred', 
            isLoading: false 
          });
        }
      },

      updateProfile: async (data) => {
        set({ isLoading: true, error: null });
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          set(state => {
            if (!state.user) {
              throw new Error('User not authenticated');
            }
            
            return { 
              user: { ...state.user, ...data },
              isLoading: false 
            };
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An unknown error occurred', 
            isLoading: false 
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
    }
  )
);