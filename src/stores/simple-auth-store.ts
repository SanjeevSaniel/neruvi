import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/lib/db/schema';

export interface UserUsage {
  messageCount: number;
  limit: number;
  resetTime: Date;
  remaining: number;
}

export interface UserStats {
  totalConversations: number;
}

interface SimpleAuthState {
  // User data
  user: User | null;
  usage: UserUsage | null;
  stats: UserStats | null;

  // Loading states
  isLoading: boolean;
  isInitialized: boolean;

  // Error states
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setUsage: (usage: UserUsage | null) => void;
  setStats: (stats: UserStats | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;

  // User data fetching
  fetchUserData: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  syncUserData: (clerkUserId: string, email: string, displayName?: string, imageUrl?: string) => Promise<void>;

  // Simple role checking
  isAdmin: () => boolean;
  isModerator: () => boolean;
  isUser: () => boolean;
  canAccessAdmin: () => boolean;
  hasRole: (role: UserRole) => boolean;
  hasMinimumRole: (role: UserRole) => boolean;

  // Reset state
  reset: () => void;
}

// Role hierarchy for permission checking
const ROLE_LEVELS = {
  user: 1,
  moderator: 2,
  admin: 3,
} as const;

export const useSimpleAuthStore = create<SimpleAuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      usage: null,
      stats: null,
      isLoading: false,
      isInitialized: false,
      error: null,

      // Basic setters
      setUser: (user) => {
        set({ user });
      },
      setUsage: (usage) => set({ usage }),
      setStats: (stats) => set({ stats }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setInitialized: (isInitialized) => set({ isInitialized }),

      // Fetch user data from API
      fetchUserData: async () => {
        const state = get();
        if (state.isLoading) return;

        console.log('🔄 Fetching user data...');
        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/users', {
            credentials: 'include'
          });

          console.log('📡 User API response status:', response.status);

          if (!response.ok) {
            if (response.status === 401) {
              console.log('❌ User not authenticated');
              set({
                user: null,
                usage: null,
                stats: null,
                isLoading: false,
                error: null,
                isInitialized: true
              });
              return;
            }
            throw new Error(`Failed to fetch user data: ${response.status}`);
          }

          const data = await response.json();
          console.log('📡 User API response data:', data);

          if (data.success && data.data) {
            const { usage, stats, ...userData } = data.data;
            console.log('✅ User data fetched successfully:', {
              email: userData.email,
              role: userData.role,
              isAdmin: userData.role === 'admin'
            });

            set({
              user: userData,
              usage: usage ? {
                ...usage,
                resetTime: new Date(usage.resetTime)
              } : null,
              stats: stats || null,
              isLoading: false,
              error: null,
              isInitialized: true
            });
          } else {
            throw new Error(data.error || 'Failed to load user data');
          }
        } catch (error) {
          console.error('❌ Error fetching user data:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            isInitialized: false
          });
        }
      },

      // Refresh user data (force refresh)
      refreshUserData: async () => {
        console.log('🔄 Refreshing user data...');
        set({ isInitialized: false });
        await get().fetchUserData();
      },

      // Sync user data using client-side information
      syncUserData: async (clerkUserId: string, email: string, displayName?: string, imageUrl?: string) => {
        const state = get();
        if (state.isLoading) return;

        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/users/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              clerkUserId,
              email,
              displayName: displayName || '',
              imageUrl: imageUrl || ''
            }),
            credentials: 'include'
          });

          console.log('📡 Sync API response status:', response.status);

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to sync user data: ${response.status} - ${errorData.error}`);
          }

          const data = await response.json();
          console.log('📡 Sync API response data:', data);

          if (data.success && data.data) {
            const { usage, stats, ...userData } = data.data;
            console.log('✅ User data synced successfully:', {
              email: userData.email,
              role: userData.role,
              isAdmin: userData.role === 'admin'
            });

            set({
              user: userData,
              usage: usage ? {
                ...usage,
                resetTime: new Date(usage.resetTime)
              } : null,
              stats: stats || null,
              isLoading: false,
              error: null,
              isInitialized: true
            });
          } else {
            throw new Error(data.error || 'Failed to sync user data');
          }
        } catch (error) {
          console.error('❌ Error syncing user data:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            isInitialized: false
          });
        }
      },

      // Simple role checking methods
      isAdmin: () => {
        const { user } = get();
        const isAdmin = user?.role === 'admin' && user?.isActive;
        console.log('🔍 isAdmin check:', { userRole: user?.role, isActive: user?.isActive, result: isAdmin });
        return isAdmin;
      },

      isModerator: () => {
        const { user } = get();
        const isModerator = user?.role === 'moderator' && user?.isActive;
        console.log('🔍 isModerator check:', { userRole: user?.role, isActive: user?.isActive, result: isModerator });
        return isModerator;
      },

      isUser: () => {
        const { user } = get();
        return user?.role === 'user' && user?.isActive;
      },

      canAccessAdmin: () => {
        const { user } = get();
        const canAccess = user && user.isActive && (user.role === 'admin' || user.role === 'moderator');
        console.log('🔍 canAccessAdmin check:', {
          userRole: user?.role,
          isActive: user?.isActive,
          result: !!canAccess
        });
        return !!canAccess;
      },

      hasRole: (role: UserRole) => {
        const { user } = get();
        return user?.role === role && user?.isActive;
      },

      hasMinimumRole: (role: UserRole) => {
        const { user } = get();
        if (!user || !user.isActive) return false;

        const userLevel = ROLE_LEVELS[user.role];
        const requiredLevel = ROLE_LEVELS[role];

        return userLevel >= requiredLevel;
      },

      // Reset state (useful for logout)
      reset: () => {
        console.log('🔄 Resetting auth store');
        set({
          user: null,
          usage: null,
          stats: null,
          isLoading: false,
          isInitialized: false,
          error: null
        });
      }
    }),
    {
      name: 'simple-auth-store',
      partialize: (state) => ({
        user: state.user,
        usage: state.usage,
        stats: state.stats,
        isInitialized: state.isInitialized
      })
    }
  )
);

// Helper hooks for common use cases
export const useUser = () => useSimpleAuthStore((state) => state.user);
export const useUserRole = () => useSimpleAuthStore((state) => state.user?.role || null);
export const useIsAdmin = () => useSimpleAuthStore((state) => state.isAdmin());
export const useIsModerator = () => useSimpleAuthStore((state) => state.isModerator());
export const useCanAccessAdmin = () => useSimpleAuthStore((state) => state.canAccessAdmin());
export const useHasRole = (role: UserRole) => useSimpleAuthStore((state) => state.hasRole(role));
export const useHasMinimumRole = (role: UserRole) => useSimpleAuthStore((state) => state.hasMinimumRole(role));

// Auth state hooks
export const useAuthLoading = () => useSimpleAuthStore((state) => state.isLoading);
export const useAuthError = () => useSimpleAuthStore((state) => state.error);
export const useAuthInitialized = () => useSimpleAuthStore((state) => state.isInitialized);