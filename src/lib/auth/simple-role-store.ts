import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'user' | 'moderator' | 'admin';

interface RoleStore {
  // State
  userEmail: string | null;
  userRole: UserRole | null;
  isLoading: boolean;
  lastFetched: number | null;

  // Actions
  setUserRole: (email: string, role: UserRole) => void;
  setLoading: (loading: boolean) => void;
  clearRole: () => void;

  // Role checks
  isAdmin: () => boolean;
  isModerator: () => boolean;
  canAccessAdmin: () => boolean;

  // Fetch role from API
  fetchUserRole: () => Promise<void>;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useRoleStore = create<RoleStore>()(
  persist(
    (set, get) => ({
      userEmail: null,
      userRole: null,
      isLoading: false,
      lastFetched: null,

      setUserRole: (email: string, role: UserRole) => {
        console.log('🔑 Setting user role:', { email, role });
        set({
          userEmail: email,
          userRole: role,
          lastFetched: Date.now(),
          isLoading: false
        });
      },

      setLoading: (isLoading: boolean) => set({ isLoading }),

      clearRole: () => {
        console.log('🔄 Clearing user role');
        set({
          userEmail: null,
          userRole: null,
          isLoading: false,
          lastFetched: null
        });
      },

      isAdmin: () => {
        const { userRole } = get();
        return userRole === 'admin';
      },

      isModerator: () => {
        const { userRole } = get();
        return userRole === 'moderator';
      },

      canAccessAdmin: () => {
        const { userRole } = get();
        return userRole === 'admin' || userRole === 'moderator';
      },

      fetchUserRole: async () => {
        const { lastFetched, isLoading } = get();

        // Skip if already loading or recently fetched
        if (isLoading || (lastFetched && Date.now() - lastFetched < CACHE_DURATION)) {
          return;
        }

        set({ isLoading: true });

        try {
          console.log('🔍 Fetching user role from API...');
          const response = await fetch('/api/users', {
            credentials: 'include'
          });

          if (!response.ok) {
            if (response.status === 401) {
              console.log('❌ Not authenticated, clearing role');
              get().clearRole();
              return;
            }
            throw new Error(`API error: ${response.status}`);
          }

          const data = await response.json();

          if (data.success && data.data) {
            const { email, role } = data.data;
            console.log('✅ Got user role from API:', { email, role });
            get().setUserRole(email, role);
          } else {
            throw new Error('Invalid API response');
          }

        } catch (error) {
          console.error('❌ Error fetching user role:', error);
          set({ isLoading: false });
        }
      }
    }),
    {
      name: 'user-role-store',
      partialize: (state) => ({
        userEmail: state.userEmail,
        userRole: state.userRole,
        lastFetched: state.lastFetched
      })
    }
  )
);

// Simple hooks for easy use
export const useUserRole = () => useRoleStore(state => state.userRole);
export const useIsAdmin = () => useRoleStore(state => state.isAdmin());
export const useIsModerator = () => useRoleStore(state => state.isModerator());
export const useCanAccessAdmin = () => useRoleStore(state => state.canAccessAdmin());
export const useRoleLoading = () => useRoleStore(state => state.isLoading);