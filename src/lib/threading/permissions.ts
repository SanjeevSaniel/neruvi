/**
 * Threading Permissions and Role-Based Access Control
 * Controls who can access threading features based on user roles
 */

export type UserRole = 'user' | 'admin' | 'moderator';

export interface ThreadingPermissions {
  canViewThreads: boolean;
  canCreateBranches: boolean;
  canDeleteThreads: boolean;
  canRenameThreads: boolean;
  canViewVisualization: boolean;
  canAccessAdvancedFeatures: boolean;
  canViewAllConversations: boolean; // Admin feature
  canModerateThreads: boolean; // Moderator feature
  canExportThreadData: boolean;
  canViewAnalytics: boolean;
}

/**
 * Get threading permissions based on user role
 */
export function getThreadingPermissions(role: UserRole): ThreadingPermissions {
  const basePermissions: ThreadingPermissions = {
    canViewThreads: false,
    canCreateBranches: false,
    canDeleteThreads: false,
    canRenameThreads: false,
    canViewVisualization: false,
    canAccessAdvancedFeatures: false,
    canViewAllConversations: false,
    canModerateThreads: false,
    canExportThreadData: false,
    canViewAnalytics: false,
  };

  switch (role) {
    case 'user':
      return {
        ...basePermissions,
        canViewThreads: true, // Basic thread viewing for all users
        canCreateBranches: false, // Restrict branching to prevent confusion
        canDeleteThreads: false,
        canRenameThreads: false,
      };

    case 'moderator':
      return {
        ...basePermissions,
        canViewThreads: true,
        canCreateBranches: true,
        canDeleteThreads: true,
        canRenameThreads: true,
        canViewVisualization: true, // Moderators can see visualizations
        canAccessAdvancedFeatures: true,
        canModerateThreads: true,
        canViewAnalytics: true,
      };

    case 'admin':
      return {
        ...basePermissions,
        canViewThreads: true,
        canCreateBranches: true,
        canDeleteThreads: true,
        canRenameThreads: true,
        canViewVisualization: true, // Admins get full access
        canAccessAdvancedFeatures: true,
        canViewAllConversations: true, // Admin can see all user conversations
        canModerateThreads: true,
        canExportThreadData: true,
        canViewAnalytics: true,
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