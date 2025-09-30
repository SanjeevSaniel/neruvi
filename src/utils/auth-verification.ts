/**
 * Auth Verification Utilities
 *
 * Use these in the browser console to verify user authentication and permissions
 */

// Make these functions available globally for console testing
declare global {
  interface Window {
    authVerification: {
      checkUserRole: () => Promise<void>;
      checkPermissions: () => Promise<void>;
      checkAdminAccess: () => Promise<void>;
      testAllPermissions: () => Promise<void>;
      refreshAuth: () => Promise<void>;
    };
  }
}

export const authVerification = {
  /**
   * Check current user role from API
   */
  async checkUserRole() {
    try {
      console.log('🔍 Checking user role from API...');

      const response = await fetch('/api/users', {
        credentials: 'include'
      });

      if (!response.ok) {
        console.error(`❌ API Error: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        return;
      }

      const data = await response.json();
      console.log('✅ User data from API:', data);

      if (data.success && data.data) {
        const { role, email, displayName } = data.data;
        console.log(`👤 Current user: ${displayName || email}`);
        console.log(`🔑 Role: ${role}`);

        const accessLevel = {
          'admin': '🔴 FULL ADMIN ACCESS',
          'moderator': '🟡 MODERATOR ACCESS',
          'user': '🟢 USER ACCESS (NO ADMIN)'
        }[role] || '⚪ UNKNOWN ROLE';

        console.log(`🎯 Access Level: ${accessLevel}`);
      } else {
        console.error('❌ Invalid API response:', data);
      }
    } catch (error) {
      console.error('❌ Network error:', error);
    }
  },

  /**
   * Check user permissions from Zustand store
   */
  async checkPermissions() {
    try {
      console.log('🔍 Checking permissions from Zustand store...');

      // Import store dynamically
      const { useAuthStore } = await import('@/stores/auth-store');
      const store = useAuthStore.getState();

      console.log('📊 Store state:', {
        user: store.user,
        isLoading: store.isLoading,
        isInitialized: store.isInitialized,
        error: store.error,
        permissionError: store.permissionError
      });

      if (store.user) {
        console.log('✅ User in store:', store.user);
        console.log('🔑 Role checks:');
        console.log(`  - isAdmin(): ${store.isAdmin()}`);
        console.log(`  - isModerator(): ${store.isModerator()}`);
        console.log(`  - isUser(): ${store.isUser()}`);
        console.log(`  - canAccessAdmin(): ${store.canAccessAdmin()}`);

        console.log('🛡️ Key permissions:');
        console.log(`  - canViewUsers(): ${store.canViewUsers()}`);
        console.log(`  - canEditUsers(): ${store.canEditUsers()}`);
        console.log(`  - canViewAnalytics(): ${store.canViewAnalytics()}`);
        console.log(`  - canCreateAnnouncements(): ${store.canCreateAnnouncements()}`);
        console.log(`  - canModerateContent(): ${store.canModerateContent()}`);

        const permissions = store.getUserPermissions();
        console.log(`📋 Total permissions: ${permissions.length}`);
        console.log('📋 Permission list:', permissions.map(p => p.name));
      } else {
        console.log('❌ No user in store');
      }
    } catch (error) {
      console.error('❌ Error checking store:', error);
    }
  },

  /**
   * Test admin API access
   */
  async checkAdminAccess() {
    console.log('🔍 Testing admin API access...');

    const endpoints = [
      '/api/admin/users',
      '/api/admin/analytics/dashboard',
      '/api/admin/content',
      '/api/admin/announcements'
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`Testing ${endpoint}...`);
        const response = await fetch(endpoint, {
          credentials: 'include'
        });

        if (response.ok) {
          console.log(`✅ ${endpoint}: ACCESS GRANTED`);
        } else if (response.status === 403) {
          console.log(`❌ ${endpoint}: INSUFFICIENT PERMISSIONS`);
        } else {
          console.log(`⚠️ ${endpoint}: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error(`❌ ${endpoint}: Network error`, error);
      }
    }
  },

  /**
   * Test all permissions comprehensively
   */
  async testAllPermissions() {
    console.log('🔍 Running comprehensive permission test...');

    await this.checkUserRole();
    console.log('\n' + '='.repeat(50) + '\n');

    await this.checkPermissions();
    console.log('\n' + '='.repeat(50) + '\n');

    await this.checkAdminAccess();
    console.log('\n' + '='.repeat(50) + '\n');

    console.log('✅ Permission test completed!');
    console.log('\n📝 Summary:');
    console.log('  - If you see "INSUFFICIENT PERMISSIONS", visit /admin/setup');
    console.log('  - If you see "ACCESS GRANTED", your permissions are working');
    console.log('  - Check the role matches your expected access level');
  },

  /**
   * Refresh auth data
   */
  async refreshAuth() {
    try {
      console.log('🔄 Refreshing auth data...');

      const { useAuthStore } = await import('@/stores/auth-store');
      const store = useAuthStore.getState();

      await store.refreshUserData();
      console.log('✅ Auth data refreshed!');

      // Check the updated state
      await this.checkPermissions();
    } catch (error) {
      console.error('❌ Error refreshing auth:', error);
    }
  }
};

// Make verification functions available globally in browser console
if (typeof window !== 'undefined') {
  window.authVerification = authVerification;

  // Log helpful message
  console.log('🔧 Auth verification utilities loaded!');
  console.log('📋 Available commands:');
  console.log('  - authVerification.checkUserRole()');
  console.log('  - authVerification.checkPermissions()');
  console.log('  - authVerification.checkAdminAccess()');
  console.log('  - authVerification.testAllPermissions()');
  console.log('  - authVerification.refreshAuth()');
}