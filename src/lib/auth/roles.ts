import { UserRole, User } from '@/lib/db/schema';

/**
 * Role-based access control utilities
 */

export const ROLES = {
  USER: 'user' as UserRole,
  ADMIN: 'admin' as UserRole,
  MODERATOR: 'moderator' as UserRole,
} as const;

/**
 * Role hierarchy - higher number = more permissions
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 1,
  moderator: 2,
  admin: 3,
};

/**
 * Check if user has a specific role
 */
export function hasRole(user: User | null, requiredRole: UserRole): boolean {
  if (!user || !user.isActive) return false;
  return user.role === requiredRole;
}

/**
 * Check if user has role or higher in hierarchy
 */
export function hasMinimumRole(user: User | null, minimumRole: UserRole): boolean {
  if (!user || !user.isActive) return false;
  
  const userLevel = ROLE_HIERARCHY[user.role];
  const requiredLevel = ROLE_HIERARCHY[minimumRole];
  
  return userLevel >= requiredLevel;
}

/**
 * Check if user is admin
 */
export function isAdmin(user: User | null): boolean {
  return hasRole(user, ROLES.ADMIN);
}

/**
 * Check if user is moderator or admin
 */
export function isModerator(user: User | null): boolean {
  return hasMinimumRole(user, ROLES.MODERATOR);
}

/**
 * Check if user can perform admin actions
 */
export function canManageUsers(user: User | null): boolean {
  return isAdmin(user);
}

/**
 * Check if user can moderate content
 */
export function canModerate(user: User | null): boolean {
  return hasMinimumRole(user, ROLES.MODERATOR);
}

/**
 * Get user role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames = {
    user: 'User',
    moderator: 'Moderator', 
    admin: 'Administrator',
  };
  
  return roleNames[role];
}

/**
 * Get available roles for role assignment
 */
export function getAssignableRoles(currentUserRole: UserRole): UserRole[] {
  const allRoles: UserRole[] = ['user', 'moderator', 'admin'];
  const currentUserLevel = ROLE_HIERARCHY[currentUserRole];
  
  // Users can only assign roles equal or lower to their own
  return allRoles.filter(role => ROLE_HIERARCHY[role] <= currentUserLevel);
}

/**
 * Role-based UI utilities
 */
export const RoleUI = {
  /**
   * Get role badge color
   */
  getRoleBadgeColor(role: UserRole): string {
    const colors = {
      user: 'bg-blue-100 text-blue-800',
      moderator: 'bg-yellow-100 text-yellow-800',
      admin: 'bg-red-100 text-red-800',
    };
    
    return colors[role];
  },

  /**
   * Get role icon
   */
  getRoleIcon(role: UserRole): string {
    const icons = {
      user: '👤',
      moderator: '🛡️',
      admin: '👑',
    };
    
    return icons[role];
  },
};

/**
 * Default admin email - update this in your environment
 */
export function getDefaultAdminEmail(): string {
  return process.env.DEFAULT_ADMIN_EMAIL || '';
}

/**
 * Check if email should be admin by default
 */
export function isDefaultAdmin(email: string): boolean {
  const adminEmail = getDefaultAdminEmail();
  return adminEmail && email.toLowerCase() === adminEmail.toLowerCase();
}

/**
 * Get initial role for new user
 */
export function getInitialUserRole(email: string): UserRole {
  // Check if this should be the default admin
  if (isDefaultAdmin(email)) {
    console.log(`🔑 Setting admin role for default admin: ${email}`);
    return ROLES.ADMIN;
  }
  
  // Default role for all other users
  return ROLES.USER;
}