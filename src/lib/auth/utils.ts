import type { User, UserRole } from '@/lib/db/schema';
import { hasMinimumRole, isAdmin, isModerator } from './roles';

/**
 * Simple utilities for role-based UI and logic
 */

/**
 * Quick role check functions - return boolean
 */
export const RoleCheck = {
  isUser: (user: User | null): boolean => !!user && user.isActive,
  isModerator: (user: User | null): boolean => isModerator(user),
  isAdmin: (user: User | null): boolean => isAdmin(user),
  hasRole: (user: User | null, role: UserRole): boolean => hasMinimumRole(user, role),
} as const;

/**
 * Role-based conditional rendering
 */
export function RoleGate({
  user,
  role,
  children,
  fallback = null,
}: {
  user: User | null;
  role: UserRole;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  if (hasMinimumRole(user, role)) {
    return children;
  }
  return fallback;
}

/**
 * Admin-only component wrapper
 */
export function AdminGate({
  user,
  children,
  fallback = null,
}: {
  user: User | null;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return <RoleGate user={user} role="admin" children={children} fallback={fallback} />;
}

/**
 * Moderator-only component wrapper
 */
export function ModeratorGate({
  user,
  children,
  fallback = null,
}: {
  user: User | null;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return <RoleGate user={user} role="moderator" children={children} fallback={fallback} />;
}

/**
 * Simple role badge component
 */
export function RoleBadge({ role, className = '' }: { role: UserRole; className?: string }) {
  const configs = {
    user: { label: 'User', color: 'bg-blue-100 text-blue-800', icon: '👤' },
    moderator: { label: 'Moderator', color: 'bg-yellow-100 text-yellow-800', icon: '🛡️' },
    admin: { label: 'Admin', color: 'bg-red-100 text-red-800', icon: '👑' },
  };

  const config = configs[role];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color} ${className}`}>
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}

/**
 * Permission helper for complex conditions
 */
export class PermissionHelper {
  constructor(private user: User | null) {}

  get isAuthenticated(): boolean {
    return !!this.user && this.user.isActive;
  }

  get isAdmin(): boolean {
    return isAdmin(this.user);
  }

  get isModerator(): boolean {
    return isModerator(this.user);
  }

  get isUser(): boolean {
    return this.isAuthenticated;
  }

  hasRole(role: UserRole): boolean {
    return hasMinimumRole(this.user, role);
  }

  canManageUsers(): boolean {
    return this.isAdmin;
  }

  canModerate(): boolean {
    return this.isModerator;
  }

  canAccessAdminPanel(): boolean {
    return this.isAdmin;
  }

  canAccessModeratorTools(): boolean {
    return this.isModerator;
  }
}

/**
 * Create permission helper instance
 */
export function usePermissions(user: User | null) {
  return new PermissionHelper(user);
}

/**
 * Role-based navigation items filter
 */
export function filterNavByRole<T extends { requiredRole?: UserRole }>(
  items: T[],
  user: User | null
): T[] {
  return items.filter(item => {
    if (!item.requiredRole) return true;
    return hasMinimumRole(user, item.requiredRole);
  });
}