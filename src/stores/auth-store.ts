import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserRole, Permission } from '@/lib/admin/permissions';
import { hasPermission, getRolePermissions, PERMISSIONS } from '@/lib/admin/permissions';

export interface User {
  id: string;
  clerkId: string;
  email: string;
  displayName?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface UserUsage {
  messageCount: number;
  limit: number;
  resetTime: Date;
  remaining: number;
}

export interface UserStats {
  totalConversations: number;
}

interface AuthState {
  // User data
  user: User | null;
  usage: UserUsage | null;
  stats: UserStats | null;

  // Loading states
  isLoading: boolean;
  isInitialized: boolean;

  // Error states
  error: string | null;
  permissionError: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setUsage: (usage: UserUsage | null) => void;
  setStats: (stats: UserStats | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPermissionError: (hasError: boolean) => void;
  setInitialized: (initialized: boolean) => void;

  // User data fetching
  fetchUserData: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  syncUserData: (clerkUserId: string, email: string, displayName?: string) => Promise<void>;

  // Permission checking
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  getUserPermissions: () => Permission[];

  // Role checking
  isAdmin: () => boolean;
  isModerator: () => boolean;
  isUser: () => boolean;
  canAccessAdmin: () => boolean;

  // Admin capabilities
  canViewUsers: () => boolean;
  canEditUsers: () => boolean;
  canDeleteUsers: () => boolean;
  canChangeUserRoles: () => boolean;
  canViewAnalytics: () => boolean;
  canViewPlatformAnalytics: () => boolean;
  canCreateAnnouncements: () => boolean;
  canModerateContent: () => boolean;
  canViewReports: () => boolean;
  canResolveReports: () => boolean;

  // Reset state
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      usage: null,
      stats: null,
      isLoading: false,
      isInitialized: false,
      error: null,
      permissionError: false,

      // Basic setters
      setUser: (user) => set({ user }),
      setUsage: (usage) => set({ usage }),
      setStats: (stats) => set({ stats }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setPermissionError: (permissionError) => set({ permissionError }),
      setInitialized: (isInitialized) => set({ isInitialized }),

      // Fetch user data from API
      fetchUserData: async () => {
        const state = get();
        console.log('fetchUserData called, current state:', {
          isLoading: state.isLoading,
          isInitialized: state.isInitialized,
          hasUser: !!state.user
        });

        if (state.isLoading) {
          console.log('Already loading, skipping request');
          return; // Prevent concurrent requests
        }

        console.log('Starting user data fetch...');
        set({ isLoading: true, error: null, permissionError: false });

        try {
          console.log('Calling /api/users...');
          const response = await fetch('/api/users', {
            credentials: 'include'
          });

          console.log('API response status:', response.status);

          if (!response.ok) {
            if (response.status === 401) {
              console.log('User not authenticated');
              // User is not authenticated
              set({
                user: null,
                usage: null,
                stats: null,
                isLoading: false,
                error: 'Not authenticated',
                isInitialized: true
              });
              return;
            }
            throw new Error(`Failed to fetch user data: ${response.status}`);
          }

          const data = await response.json();
          console.log('API response data:', data);

          if (data.success && data.data) {
            const { usage, stats, ...userData } = data.data;
            console.log('Setting user data in store:', userData);

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
            console.log('User data fetch completed successfully');
          } else {
            throw new Error(data.error || 'Failed to load user data');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            isInitialized: false  // Don't mark as initialized on error - let AuthProvider handle retries
          });
        }
      },

      // Refresh user data (force refresh)
      refreshUserData: async () => {
        set({ isInitialized: false });
        await get().fetchUserData();
      },

      // Sync user data using client-side information (fallback when server auth fails)
      syncUserData: async (clerkUserId: string, email: string, displayName?: string) => {
        const state = get();
        console.log('syncUserData called with:', { clerkUserId, email, displayName });

        if (state.isLoading) {
          console.log('Already loading, skipping sync request');
          return;
        }

        console.log('Starting user data sync...');
        set({ isLoading: true, error: null, permissionError: false });

        try {
          console.log('Calling /api/users/sync...');
          const response = await fetch('/api/users/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              clerkUserId,
              email,
              displayName: displayName || ''
            }),
            credentials: 'include'
          });

          console.log('Sync API response status:', response.status);

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to sync user data: ${response.status} - ${errorData.error}`);
          }

          const data = await response.json();
          console.log('Sync API response data:', data);

          if (data.success && data.data) {
            const { usage, stats, ...userData } = data.data;
            console.log('Setting synced user data in store:', {
              userData,
              userRole: userData.role,
              hasRole: !!userData.role
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

            // Verify the store state after setting
            const newState = get();
            console.log('User data sync completed successfully. Final store state:', {
              hasUser: !!newState.user,
              userRole: newState.user?.role,
              canAccessAdmin: newState.canAccessAdmin(),
              isAdmin: newState.isAdmin()
            });
          } else {
            throw new Error(data.error || 'Failed to sync user data');
          }
        } catch (error) {
          console.error('Error syncing user data:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            isInitialized: false  // Don't mark as initialized on error - let AuthProvider handle retries
          });
        }
      },

      // Permission checking methods
      hasPermission: (permission: Permission) => {
        const { user } = get();
        if (!user) return false;
        return hasPermission(user.role, permission);
      },

      hasAnyPermission: (permissions: Permission[]) => {
        const { user } = get();
        if (!user) return false;
        return permissions.some(permission => hasPermission(user.role, permission));
      },

      hasAllPermissions: (permissions: Permission[]) => {
        const { user } = get();
        if (!user) return false;
        return permissions.every(permission => hasPermission(user.role, permission));
      },

      getUserPermissions: () => {
        const { user } = get();
        if (!user) return [];
        return getRolePermissions(user.role);
      },

      // Role checking methods
      isAdmin: () => {
        const { user } = get();
        return user?.role === 'admin';
      },

      isModerator: () => {
        const { user } = get();
        return user?.role === 'moderator';
      },

      isUser: () => {
        const { user } = get();
        return user?.role === 'user';
      },

      canAccessAdmin: () => {
        const { user } = get();
        return user?.role === 'admin' || user?.role === 'moderator';
      },

      // Specific capability checks
      canViewUsers: () => get().hasPermission(PERMISSIONS.USER_VIEW),
      canEditUsers: () => get().hasPermission(PERMISSIONS.USER_EDIT),
      canDeleteUsers: () => get().hasPermission(PERMISSIONS.USER_DELETE),
      canChangeUserRoles: () => get().hasPermission(PERMISSIONS.USER_ROLE_CHANGE),
      canViewAnalytics: () => get().hasPermission(PERMISSIONS.ANALYTICS_VIEW_USER),
      canViewPlatformAnalytics: () => get().hasPermission(PERMISSIONS.ANALYTICS_VIEW_PLATFORM),
      canCreateAnnouncements: () => get().hasPermission(PERMISSIONS.COMMUNICATION_ANNOUNCEMENT),
      canModerateContent: () => get().hasPermission(PERMISSIONS.CONTENT_MODERATE),
      canViewReports: () => get().hasPermission(PERMISSIONS.CONTENT_VIEW_REPORTS),
      canResolveReports: () => get().hasPermission(PERMISSIONS.CONTENT_RESOLVE_REPORTS),

      // Reset state (useful for logout)
      reset: () => set({
        user: null,
        usage: null,
        stats: null,
        isLoading: false,
        isInitialized: false,
        error: null,
        permissionError: false
      })
    }),
    {
      name: 'auth-store', // name for localStorage key
      partialize: (state) => ({
        // Only persist user data, not loading/error states
        user: state.user,
        usage: state.usage,
        stats: state.stats,
        isInitialized: state.isInitialized
      })
    }
  )
);

// Helper hooks for common use cases
export const useUser = () => useAuthStore((state) => state.user);
export const useUserRole = () => useAuthStore((state) => state.user?.role || 'user');
export const useIsAdmin = () => useAuthStore((state) => state.isAdmin());
export const useIsModerator = () => useAuthStore((state) => state.isModerator());
export const useCanAccessAdmin = () => useAuthStore((state) => state.canAccessAdmin());
export const useUserPermissions = () => useAuthStore((state) => state.getUserPermissions());

// Permission checking hooks
export const useHasPermission = (permission: Permission) =>
  useAuthStore((state) => state.hasPermission(permission));

export const useCanViewUsers = () => useAuthStore((state) => state.canViewUsers());
export const useCanEditUsers = () => useAuthStore((state) => state.canEditUsers());
export const useCanViewAnalytics = () => useAuthStore((state) => state.canViewPlatformAnalytics());
export const useCanCreateAnnouncements = () => useAuthStore((state) => state.canCreateAnnouncements());
export const useCanModerateContent = () => useAuthStore((state) => state.canModerateContent());

// Auth state hooks
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useAuthInitialized = () => useAuthStore((state) => state.isInitialized);