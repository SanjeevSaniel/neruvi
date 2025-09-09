/**
 * Threading Permissions and Role-Based Access Control
 * Controls who can access threading features based on user roles
 */

export type UserRole = 'user' | 'admin' | 'moderator';

export interface ThreadingPermissions {
  // Student-level permissions (read-only)
  canViewThreads: boolean;
  canNavigateThreads: boolean;
  canViewConversationFlow: boolean;
  canToggleThreadView: boolean; // Hidden toggle in sidebar
  
  // Moderator-level permissions
  canCreateBranches: boolean;
  canOrganizeConversations: boolean;
  canDeleteThreads: boolean;
  canRenameThreads: boolean;
  canModerateThreads: boolean;
  
  // Admin-level permissions
  canViewVisualization: boolean;
  canAccessAdvancedFeatures: boolean;
  canViewAllConversations: boolean;
  canExportThreadData: boolean;
  canViewAnalytics: boolean;
  canManageSystemControls: boolean;
}

/**
 * Get threading permissions based on user role
 */
export function getThreadingPermissions(role: UserRole): ThreadingPermissions {
  const basePermissions: ThreadingPermissions = {
    // Student-level permissions
    canViewThreads: false,
    canNavigateThreads: false,
    canViewConversationFlow: false,
    canToggleThreadView: false,
    
    // Moderator-level permissions
    canCreateBranches: false,
    canOrganizeConversations: false,
    canDeleteThreads: false,
    canRenameThreads: false,
    canModerateThreads: false,
    
    // Admin-level permissions
    canViewVisualization: false,
    canAccessAdvancedFeatures: false,
    canViewAllConversations: false,
    canExportThreadData: false,
    canViewAnalytics: false,
    canManageSystemControls: false,
  };

  switch (role) {
    case 'user':
      // Students: Read-only access with hidden toggle
      return {
        ...basePermissions,
        canViewThreads: true,
        canNavigateThreads: true,
        canViewConversationFlow: true,
        canToggleThreadView: true, // Hidden toggle in sidebar/panel
      };

    case 'moderator':
      // Moderators: Create branches, organize conversations
      return {
        ...basePermissions,
        // Student-level permissions
        canViewThreads: true,
        canNavigateThreads: true,
        canViewConversationFlow: true,
        canToggleThreadView: true,
        
        // Moderator-level permissions
        canCreateBranches: true,
        canOrganizeConversations: true,
        canDeleteThreads: true,
        canRenameThreads: true,
        canModerateThreads: true,
        
        // Limited admin features for moderators
        canViewVisualization: true,
        canViewAnalytics: true,
      };

    case 'admin':
      // Admins: Full thread management, analytics, system controls
      return {
        ...basePermissions,
        // All student permissions
        canViewThreads: true,
        canNavigateThreads: true,
        canViewConversationFlow: true,
        canToggleThreadView: true,
        
        // All moderator permissions
        canCreateBranches: true,
        canOrganizeConversations: true,
        canDeleteThreads: true,
        canRenameThreads: true,
        canModerateThreads: true,
        
        // Full admin permissions
        canViewVisualization: true,
        canAccessAdvancedFeatures: true,
        canViewAllConversations: true,
        canExportThreadData: true,
        canViewAnalytics: true,
        canManageSystemControls: true,
      };

    default:
      return basePermissions;
  }
}

/**
 * Check if user has specific threading permission
 */
export function hasThreadingPermission(
  role: UserRole, 
  permission: keyof ThreadingPermissions
): boolean {
  const permissions = getThreadingPermissions(role);
  return permissions[permission];
}

/**
 * Validate threading action based on user role
 */
export function validateThreadingAction(
  role: UserRole,
  action: 'VIEW_THREADS' | 'CREATE_BRANCH' | 'DELETE_THREAD' | 'VIEW_VISUALIZATION' | 'MODERATE' | 'EXPORT_DATA'
): { allowed: boolean; reason?: string } {
  const permissions = getThreadingPermissions(role);

  switch (action) {
    case 'VIEW_THREADS':
      return {
        allowed: permissions.canViewThreads,
        reason: permissions.canViewThreads ? undefined : 'Thread viewing not allowed for your role'
      };

    case 'CREATE_BRANCH':
      return {
        allowed: permissions.canCreateBranches,
        reason: permissions.canCreateBranches ? undefined : 'Thread branching requires moderator or admin privileges'
      };

    case 'DELETE_THREAD':
      return {
        allowed: permissions.canDeleteThreads,
        reason: permissions.canDeleteThreads ? undefined : 'Thread deletion requires moderator or admin privileges'
      };

    case 'VIEW_VISUALIZATION':
      return {
        allowed: permissions.canViewVisualization,
        reason: permissions.canViewVisualization ? undefined : 'Thread visualization requires moderator or admin privileges'
      };

    case 'MODERATE':
      return {
        allowed: permissions.canModerateThreads,
        reason: permissions.canModerateThreads ? undefined : 'Thread moderation requires moderator or admin privileges'
      };

    case 'EXPORT_DATA':
      return {
        allowed: permissions.canExportThreadData,
        reason: permissions.canExportThreadData ? undefined : 'Data export requires admin privileges'
      };

    default:
      return { allowed: false, reason: 'Unknown action' };
  }
}

/**
 * Threading feature configuration based on role
 */
export function getThreadingFeatureConfig(role: UserRole) {
  const permissions = getThreadingPermissions(role);

  return {
    // UI Features
    showThreadSidebar: permissions.canViewThreads,
    showBranchingButtons: permissions.canCreateBranches,
    showDeleteButtons: permissions.canDeleteThreads,
    showVisualization: permissions.canViewVisualization,
    showAdvancedControls: permissions.canAccessAdvancedFeatures,
    
    // Functionality limits
    maxBranchesPerConversation: role === 'admin' ? 50 : role === 'moderator' ? 20 : 0,
    maxThreadDepth: role === 'admin' ? 100 : role === 'moderator' ? 50 : 10,
    canAccessOtherUsersThreads: permissions.canViewAllConversations,
    
    // Analytics and reporting
    canViewDetailedAnalytics: permissions.canViewAnalytics,
    canExportConversationData: permissions.canExportThreadData,
  };
}