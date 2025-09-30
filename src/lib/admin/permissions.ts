export type UserRole = 'user' | 'moderator' | 'admin';

export interface Permission {
  name: string;
  description: string;
  category: string;
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
}

// Define all available permissions
export const PERMISSIONS = {
  // User Management
  USER_VIEW: { name: 'user.view', description: 'View user profiles and data', category: 'User Management' },
  USER_EDIT: { name: 'user.edit', description: 'Edit user profiles and settings', category: 'User Management' },
  USER_DELETE: { name: 'user.delete', description: 'Delete user accounts', category: 'User Management' },
  USER_ROLE_CHANGE: { name: 'user.role.change', description: 'Change user roles', category: 'User Management' },

  // Moderation
  MODERATION_WARN: { name: 'moderation.warn', description: 'Issue warnings to users', category: 'Moderation' },
  MODERATION_TIMEBAN: { name: 'moderation.timeban', description: 'Issue temporary bans', category: 'Moderation' },
  MODERATION_BAN: { name: 'moderation.ban', description: 'Issue permanent bans', category: 'Moderation' },
  MODERATION_UNBAN: { name: 'moderation.unban', description: 'Remove bans from users', category: 'Moderation' },
  MODERATION_VIEW_HISTORY: { name: 'moderation.history.view', description: 'View moderation history', category: 'Moderation' },

  // Content Management
  CONTENT_VIEW_REPORTS: { name: 'content.reports.view', description: 'View content reports', category: 'Content Management' },
  CONTENT_RESOLVE_REPORTS: { name: 'content.reports.resolve', description: 'Resolve content reports', category: 'Content Management' },
  CONTENT_DELETE: { name: 'content.delete', description: 'Delete content', category: 'Content Management' },
  CONTENT_MODERATE: { name: 'content.moderate', description: 'Moderate user content', category: 'Content Management' },

  // Course Management
  COURSE_ACCESS_GRANT: { name: 'course.access.grant', description: 'Grant course access to users', category: 'Course Management' },
  COURSE_ACCESS_REVOKE: { name: 'course.access.revoke', description: 'Revoke course access from users', category: 'Course Management' },
  COURSE_CONTENT_MANAGE: { name: 'course.content.manage', description: 'Manage course content', category: 'Course Management' },

  // Analytics
  ANALYTICS_VIEW_USER: { name: 'analytics.user.view', description: 'View user analytics', category: 'Analytics' },
  ANALYTICS_VIEW_PLATFORM: { name: 'analytics.platform.view', description: 'View platform analytics', category: 'Analytics' },
  ANALYTICS_EXPORT: { name: 'analytics.export', description: 'Export analytics data', category: 'Analytics' },

  // Communication
  COMMUNICATION_ANNOUNCEMENT: { name: 'communication.announcement', description: 'Create announcements', category: 'Communication' },
  COMMUNICATION_MESSAGE_USER: { name: 'communication.message.user', description: 'Send messages to users', category: 'Communication' },
  COMMUNICATION_BROADCAST: { name: 'communication.broadcast', description: 'Send broadcast messages', category: 'Communication' },

  // System Administration
  SYSTEM_SETTINGS: { name: 'system.settings', description: 'Manage system settings', category: 'System Administration' },
  SYSTEM_BACKUP: { name: 'system.backup', description: 'Manage system backups', category: 'System Administration' },
  SYSTEM_LOGS: { name: 'system.logs', description: 'View system logs', category: 'System Administration' },
  SYSTEM_MAINTENANCE: { name: 'system.maintenance', description: 'Perform maintenance operations', category: 'System Administration' },

  // Bulk Operations
  BULK_USER_ACTIONS: { name: 'bulk.user.actions', description: 'Perform bulk user actions', category: 'Bulk Operations' },
  BULK_MODERATION: { name: 'bulk.moderation', description: 'Perform bulk moderation actions', category: 'Bulk Operations' },
  BULK_COMMUNICATION: { name: 'bulk.communication', description: 'Send bulk communications', category: 'Bulk Operations' },
} as const;

// Define role-based permissions
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  user: [
    // Users have minimal permissions - mostly read-only access to their own data
  ],

  moderator: [
    // User Management (Limited)
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_EDIT,

    // Moderation
    PERMISSIONS.MODERATION_WARN,
    PERMISSIONS.MODERATION_TIMEBAN,
    PERMISSIONS.MODERATION_UNBAN,
    PERMISSIONS.MODERATION_VIEW_HISTORY,

    // Content Management
    PERMISSIONS.CONTENT_VIEW_REPORTS,
    PERMISSIONS.CONTENT_RESOLVE_REPORTS,
    PERMISSIONS.CONTENT_DELETE,
    PERMISSIONS.CONTENT_MODERATE,

    // Course Management (Limited)
    PERMISSIONS.COURSE_ACCESS_GRANT,
    PERMISSIONS.COURSE_ACCESS_REVOKE,

    // Analytics (Limited)
    PERMISSIONS.ANALYTICS_VIEW_USER,

    // Communication (Limited)
    PERMISSIONS.COMMUNICATION_MESSAGE_USER,
    PERMISSIONS.COMMUNICATION_ANNOUNCEMENT,
  ],

  admin: [
    // All permissions
    ...Object.values(PERMISSIONS)
  ],
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  return rolePermissions.some(p => p.name === permission.name);
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(userRole: UserRole): Permission[] {
  return ROLE_PERMISSIONS[userRole] || [];
}

/**
 * Get permissions grouped by category for a role
 */
export function getGroupedPermissions(userRole: UserRole): Record<string, Permission[]> {
  const permissions = getRolePermissions(userRole);
  const grouped: Record<string, Permission[]> = {};

  permissions.forEach(permission => {
    if (!grouped[permission.category]) {
      grouped[permission.category] = [];
    }
    grouped[permission.category].push(permission);
  });

  return grouped;
}

/**
 * Check if user can perform action on target user
 */
export function canModerateUser(moderatorRole: UserRole, targetRole: UserRole): boolean {
  // Admins can moderate anyone
  if (moderatorRole === 'admin') return true;

  // Moderators can moderate users but not other moderators or admins
  if (moderatorRole === 'moderator' && targetRole === 'user') return true;

  // Users cannot moderate anyone
  return false;
}

/**
 * Get maximum role that a user can assign
 */
export function getMaxAssignableRole(userRole: UserRole): UserRole {
  switch (userRole) {
    case 'admin':
      return 'admin'; // Admins can assign any role
    case 'moderator':
      return 'user'; // Moderators can only assign user role
    default:
      return 'user'; // Users cannot assign roles
  }
}

/**
 * Permission middleware for API routes
 */
export function requirePermission(permission: Permission) {
  return (userRole: UserRole) => {
    if (!hasPermission(userRole, permission)) {
      throw new Error(`Access denied. Required permission: ${permission.name}`);
    }
    return true;
  };
}

/**
 * Role hierarchy check
 */
export function getRoleHierarchy(): Record<UserRole, number> {
  return {
    user: 1,
    moderator: 2,
    admin: 3
  };
}

export function isHigherRole(role1: UserRole, role2: UserRole): boolean {
  const hierarchy = getRoleHierarchy();
  return hierarchy[role1] > hierarchy[role2];
}

export function canAccessRole(userRole: UserRole, targetRole: UserRole): boolean {
  return isHigherRole(userRole, targetRole) || userRole === targetRole;
}