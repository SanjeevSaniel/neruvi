'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { UserButton } from '@clerk/nextjs';
import {
  Users,
  Shield,
  MoreHorizontal,
  BarChart3,
  Search,
  RefreshCw,
  Plus,
  Edit3,
  Check,
  X,
  Activity,
  AlertTriangle,
  Megaphone,
  FileText,
  Database,
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Type definitions
interface User {
  user: {
    id: string;
    email: string;
    displayName: string;
    role: 'user' | 'moderator' | 'admin';
    isActive: boolean;
    createdAt: string;
    imageUrl?: string;
  };
  profile?: {
    status: 'active' | 'suspended' | 'banned' | 'pending';
  };
  totalConversations: number;
  totalMessages: number;
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalConversations: number;
  totalMessages: number;
  moderationActions?: number;
}

interface ModerationAction {
  id: string;
  action: string;
  targetUser: {
    id: string;
    email: string;
    displayName?: string;
  };
  moderator: {
    id: string;
    email: string;
    displayName?: string;
  };
  timestamp: string;
  reason?: string;
  createdAt: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    email: string;
    displayName?: string;
  };
  priority: 'low' | 'medium' | 'high';
  isPinned: boolean;
  createdAt: string;
}

interface UserUpdateData {
  role?: string;
  status?: string;
  displayName?: string;
}

// Editable User Row Component
const EditableUserRow = ({
  user,
  index,
  onUpdate,
  currentUserRole,
  onSelectUser,
}: {
  user: User;
  index: number;
  onUpdate: (userId: string, updates: UserUpdateData) => Promise<void>;
  currentUserRole?: string;
  canEditRoles?: boolean;
  onSelectUser?: (user: User) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    displayName: user.user.displayName || '',
    role: user.user.role,
    status: user.profile?.status || 'active',
  });

  const canEditThisUser = (() => {
    if (currentUserRole === 'admin') {
      return true;
    }
    if (currentUserRole === 'moderator') {
      return user.user.role === 'user';
    }
    return false;
  })();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(user.user.id, editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error('Failed to update user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      displayName: user.user.displayName || '',
      role: user.user.role,
      status: user.profile?.status || 'active',
    });
    setIsEditing(false);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'moderator':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'suspended':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'banned':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <TableRow className='hover:bg-muted/50'>
      <TableCell className='w-16'>
        <div className='w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center'>
          <span className='text-xs font-semibold text-blue-700'>{index}</span>
        </div>
      </TableCell>

      <TableCell>
        <div className='flex items-center space-x-3'>
          <Avatar>
            <AvatarImage
              src={user.user.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(editData.displayName || user.user.email || 'User')}&background=random&color=fff`}
            />
            <AvatarFallback className='bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold'>
              {(editData.displayName || user.user.email)?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className='min-w-0 flex-1'>
            {isEditing ? (
              <Input
                value={editData.displayName}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    displayName: e.target.value,
                  }))
                }
                className='h-7 text-sm border-gray-200 text-gray-900 bg-white'
                placeholder='Display name'
              />
            ) : (
              <div>
                <p className='text-sm font-medium text-gray-900 truncate'>
                  {user.user.displayName || 'Unnamed User'}
                </p>
                <p className='text-xs text-muted-foreground truncate'>
                  {user.user.email}
                </p>
              </div>
            )}
          </div>
        </div>
      </TableCell>

      <TableCell>
        {isEditing ? (
          <Select
            value={editData.role}
            onValueChange={(value: 'user' | 'moderator' | 'admin') =>
              setEditData((prev) => ({ ...prev, role: value }))
            }>
            <SelectTrigger className='w-24 h-7 text-xs'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='user'>User</SelectItem>
              {/* Only admins can assign moderator/admin roles */}
              {currentUserRole === 'admin' && (
                <>
                  <SelectItem value='moderator'>Moderator</SelectItem>
                  <SelectItem value='admin'>Admin</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        ) : (
          <Badge
            className={`text-xs border ${getRoleBadgeColor(user.user.role)}`}>
            {user.user.role}
          </Badge>
        )}
      </TableCell>

      <TableCell>
        {isEditing ? (
          <Select
            value={editData.status}
            onValueChange={(
              value: 'active' | 'suspended' | 'banned' | 'pending',
            ) => setEditData((prev) => ({ ...prev, status: value }))}>
            <SelectTrigger className='w-20 h-7 text-xs'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='active'>Active</SelectItem>
              <SelectItem value='suspended'>Suspended</SelectItem>
              <SelectItem value='banned'>Banned</SelectItem>
              <SelectItem value='pending'>Pending</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Badge
            className={`text-xs border ${getStatusBadgeColor(
              user.profile?.status || 'active',
            )}`}>
            {user.profile?.status || 'active'}
          </Badge>
        )}
      </TableCell>

      <TableCell>
        <div className='text-xs text-muted-foreground'>
          <div>{user.totalConversations} conversations</div>
          <div>{user.totalMessages} messages</div>
        </div>
      </TableCell>

      <TableCell className='text-xs text-muted-foreground'>
        {new Date(user.user.createdAt).toLocaleDateString()}
      </TableCell>

      <TableCell className='text-right'>
        <div className='flex items-center justify-end space-x-1'>
          {isEditing ? (
            <>
              <Button
                size='sm'
                variant='ghost'
                onClick={handleSave}
                disabled={isSaving}
                className='h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'>
                {isSaving ? (
                  <RefreshCw className='w-3 h-3 animate-spin' />
                ) : (
                  <Check className='w-3 h-3' />
                )}
              </Button>
              <Button
                size='sm'
                variant='ghost'
                onClick={handleCancel}
                className='h-7 px-2 text-xs text-gray-600 hover:text-gray-700 hover:bg-gray-50'>
                <X className='w-3 h-3' />
              </Button>
            </>
          ) : (
            <>
              {canEditThisUser ? (
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={() => setIsEditing(true)}
                  className='h-7 w-7 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50'
                  title={`Edit ${user.user.displayName || user.user.email}`}>
                  <Edit3 className='w-3 h-3' />
                </Button>
              ) : (
                <Button
                  size='sm'
                  variant='ghost'
                  disabled
                  className='h-7 w-7 p-0 text-gray-400 cursor-not-allowed'
                  title='Insufficient permissions to edit this user'>
                  <Edit3 className='w-3 h-3' />
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size='sm'
                    variant='ghost'
                    className='h-7 w-7 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50'
                    title='More actions'>
                    <MoreHorizontal className='w-3 h-3' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align='end'
                  className='w-48'>
                  <DropdownMenuItem
                    onClick={() => {
                      navigator.clipboard.writeText(user.user.email);
                      toast.success('Email copied to clipboard');
                    }}>
                    Copy Email
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      navigator.clipboard.writeText(user.user.id);
                      toast.success('User ID copied to clipboard');
                    }}>
                    Copy User ID
                  </DropdownMenuItem>
                  {canEditThisUser && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setIsEditing(true)}
                        className='text-blue-600'>
                        <Edit3 className='w-3 h-3 mr-2' />
                        Edit User
                      </DropdownMenuItem>
                      {currentUserRole === 'admin' &&
                        user.user.role !== 'admin' && (
                          <DropdownMenuItem
                            className='text-red-600'
                            onClick={() => {
                              if (
                                confirm(
                                  `Are you sure you want to suspend ${
                                    user.user.displayName || user.user.email
                                  }?`,
                                )
                              ) {
                                onUpdate(user.user.id, { status: 'suspended' });
                              }
                            }}>
                            Suspend User
                          </DropdownMenuItem>
                        )}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

const ModernAdminDashboard = () => {
  useUser();
  const {
    userRole,
    canAccessAdmin,
    isAdmin,
    isLoading: roleLoading,
  } = useUserRole();

  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [moderationActions, setModerationActions] = useState<
    ModerationAction[]
  >([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExplicitRefresh, setIsExplicitRefresh] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersRes, statsRes, moderationRes, announcementsRes] =
        await Promise.all([
          fetch('/api/admin/users'),
          fetch('/api/admin/analytics/dashboard'),
          fetch('/api/admin/moderation').catch(
            () => ({ ok: false } as Response),
          ),
          fetch('/api/admin/announcements').catch(
            () => ({ ok: false } as Response),
          ),
        ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.data?.users || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }

      if (moderationRes && moderationRes.ok) {
        const moderationData = await moderationRes.json();
        setModerationActions(moderationData.data || []);
      }

      if (announcementsRes && announcementsRes.ok) {
        const announcementsData = await announcementsRes.json();
        setAnnouncements(announcementsData.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch dashboard data');
      toast.dismiss('refresh');
    } finally {
      setLoading(false);
      toast.dismiss('refresh');
      if (isExplicitRefresh) {
        toast.success('Dashboard data updated');
        setIsExplicitRefresh(false);
      }
    }
  }, [isExplicitRefresh]);

  useEffect(() => {
    if (canAccessAdmin) {
      fetchData();
    }
  }, [canAccessAdmin, fetchData]);

  // Set initial tab based on user role (only on mount)
  const [hasSetInitialTab, setHasSetInitialTab] = useState(false);
  useEffect(() => {
    if (userRole === 'admin' && !hasSetInitialTab) {
      setActiveTab('overview');
      setHasSetInitialTab(true);
    }
  }, [userRole, hasSetInitialTab]);

  const handleUserUpdate = async (userId: string, updates: UserUpdateData) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: userId,
          action: 'updateUser',
          ...updates,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      await fetchData();
      toast.success('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
      throw error;
    }
  };

  const canAccessSystemTab = isAdmin;
  const canAccessModerationTab = isAdmin || userRole === 'moderator';
  const canAccessAnnouncementsTab = isAdmin || userRole === 'moderator';
  const canEditUserRoles = isAdmin;

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase().trim();

    // Debug logging
    if (searchLower) {
      console.log('🔍 Search filter:', {
        searchTerm: searchLower,
        email: user.user.email,
        displayName: user.user.displayName,
        emailMatch: user.user.email && user.user.email.toLowerCase().includes(searchLower),
        nameMatch: user.user.displayName && user.user.displayName.toLowerCase().includes(searchLower),
      });
    }

    const matchesSearch =
      !searchLower ||
      (user.user.email && user.user.email.toLowerCase().includes(searchLower)) ||
      (user.user.displayName && user.user.displayName.toLowerCase().includes(searchLower)) ||
      (user.user.id && user.user.id.toLowerCase().includes(searchLower));
    const matchesRole = filterRole === 'all' || user.user.role === filterRole;
    const matchesStatus =
      filterStatus === 'all' ||
      (user.profile?.status || 'active') === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (roleLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <RefreshCw className='w-6 h-6 animate-spin text-emerald-600' />
      </div>
    );
  }

  if (!canAccessAdmin) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <Shield className='w-16 h-16 text-gray-400 mx-auto mb-4' />
          <h2 className='text-xl font-semibold text-gray-900 mb-2'>
            Admin Access Required
          </h2>
          <p className='text-gray-600'>
            You need admin permissions to access this dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100'>
        <div className='px-6 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <div className='flex items-center space-x-2'>
                <Shield className='w-5 h-5 text-emerald-600' />
                <h1 className='text-xl font-semibold text-gray-900'>
                  {userRole === 'admin' ? 'Admin Dashboard' : 'Moderator Dashboard'}
                </h1>
              </div>
            </div>
            <div className='flex items-center space-x-3'>
              <Badge
                variant='secondary'
                className='text-xs'>
                {userRole?.toUpperCase()}
              </Badge>
              <Button
                variant='outline'
                size='sm'
                onClick={() => {
                  setIsExplicitRefresh(true);
                  fetchData();
                  toast.loading('Refreshing data...', { id: 'refresh' });
                }}
                disabled={loading}
                className='h-8 px-3 text-xs bg-white hover:bg-gray-50 border-gray-200 text-gray-700 hover:text-gray-900 transition-colors'>
                <RefreshCw
                  className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'w-8 h-8',
                    userButtonPopoverCard: 'shadow-lg border',
                    userButtonPopoverActionButton: 'hover:bg-gray-50',
                  },
                }}
                showName={false}
                afterSignOutUrl="/"
              />
            </div>
          </div>
        </div>
      </div>

      <div className='p-6'>
        {/* Stats Cards */}
        {stats && (
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='bg-white rounded-xl p-4 shadow-sm'>
              <div className='flex items-center space-x-3'>
                <div className='p-2 bg-blue-50 rounded-lg'>
                  <Users className='w-4 h-4 text-blue-600' />
                </div>
                <div>
                  <p className='text-2xl font-semibold text-gray-900'>
                    {stats.totalUsers}
                  </p>
                  <p className='text-xs text-gray-600'>Total Users</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className='bg-white rounded-xl p-4 shadow-sm'>
              <div className='flex items-center space-x-3'>
                <div className='p-2 bg-emerald-50 rounded-lg'>
                  <Users className='w-4 h-4 text-emerald-600' />
                </div>
                <div>
                  <p className='text-2xl font-semibold text-gray-900'>
                    {stats.activeUsers}
                  </p>
                  <p className='text-xs text-gray-600'>Active Users</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className='bg-white rounded-xl p-4 shadow-sm'>
              <div className='flex items-center space-x-3'>
                <div className='p-2 bg-purple-50 rounded-lg'>
                  <BarChart3 className='w-4 h-4 text-purple-600' />
                </div>
                <div>
                  <p className='text-2xl font-semibold text-gray-900'>
                    {stats.totalConversations}
                  </p>
                  <p className='text-xs text-gray-600'>Conversations</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className='bg-white rounded-xl p-4 shadow-sm'>
              <div className='flex items-center space-x-3'>
                <div className='p-2 bg-orange-50 rounded-lg'>
                  <BarChart3 className='w-4 h-4 text-orange-600' />
                </div>
                <div>
                  <p className='text-2xl font-semibold text-gray-900'>
                    {stats.totalMessages}
                  </p>
                  <p className='text-xs text-gray-600'>Messages</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Tabbed Layout */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className='w-full'>
          <div className='sticky top-[73px] z-50 bg-white/95 backdrop-blur-md py-3 mb-4 border-b border-gray-200'>
            <TabsList className='bg-white shadow-sm h-10'>
              {userRole === 'admin' && (
                <TabsTrigger
                  value='overview'
                  className='flex items-center space-x-2'>
                  <BarChart3 className='w-4 h-4' />
                  <span>Overview</span>
                </TabsTrigger>
              )}
              <TabsTrigger
                value='users'
                className='flex items-center space-x-2'>
                <Users className='w-4 h-4' />
                <span>Users</span>
              </TabsTrigger>
              {canAccessModerationTab && (
                <TabsTrigger
                  value='moderation'
                  className='flex items-center space-x-2'>
                  <Shield className='w-4 h-4' />
                  <span>Moderation</span>
                </TabsTrigger>
              )}
              {canAccessAnnouncementsTab && (
                <TabsTrigger
                  value='announcements'
                  className='flex items-center space-x-2'>
                  <Megaphone className='w-4 h-4' />
                  <span>Announcements</span>
                </TabsTrigger>
              )}
              {canAccessSystemTab && (
                <TabsTrigger
                  value='system'
                  className='flex items-center space-x-2'>
                  <Database className='w-4 h-4' />
                  <span>System</span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent
            value='overview'
            className='space-y-4'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
              <Card>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-base'>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {moderationActions.slice(0, 5).map((action) => (
                    <div
                      key={action.id}
                      className='flex items-center space-x-3 p-2 bg-gray-50 rounded-lg'>
                      <div className='w-8 h-8 rounded-full bg-red-100 flex items-center justify-center'>
                        <AlertTriangle className='w-4 h-4 text-red-600' />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium text-gray-900 truncate'>
                          {action.action} action on{' '}
                          {action.targetUser?.displayName ||
                            action.targetUser?.email}
                        </p>
                        <p className='text-xs text-gray-500'>
                          {new Date(action.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {moderationActions.length === 0 && (
                    <p className='text-gray-500 text-sm text-center py-4'>
                      No recent moderation actions
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-base'>System Health</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-gray-600'>Total Users</span>
                    <span className='text-sm font-medium text-gray-900'>
                      {stats?.totalUsers || 0}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-gray-600'>
                      Active Users (7 days)
                    </span>
                    <span className='text-sm font-medium text-emerald-600'>
                      {stats?.activeUsers || 0}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-gray-600'>
                      Total Messages
                    </span>
                    <span className='text-sm font-medium text-gray-900'>
                      {stats?.totalMessages || 0}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-gray-600'>
                      Moderation Actions (7 days)
                    </span>
                    <span className='text-sm font-medium text-gray-900'>
                      {stats?.moderationActions || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value='users'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className='bg-white rounded-xl shadow-sm'>
              <div className='bg-white rounded-t-xl border-b border-gray-200'>
                <div className='p-4'>
                  <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0'>
                    <h2 className='text-lg font-semibold text-gray-900'>
                      Users Management
                    </h2>
                    <div className='flex items-center space-x-2'>
                      <div className='relative'>
                        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                        <Input
                          placeholder='Search users...'
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className='pl-10 h-8 w-48 text-sm bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'
                        />
                      </div>

                      <Select
                        value={filterRole}
                        onValueChange={setFilterRole}>
                        <SelectTrigger className='w-28 h-8 text-xs bg-white border-gray-200 text-gray-900'>
                          <SelectValue placeholder='All Roles' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='all'>All Roles</SelectItem>
                          <SelectItem value='user'>User</SelectItem>
                          <SelectItem value='moderator'>Moderator</SelectItem>
                          <SelectItem value='admin'>Admin</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={filterStatus}
                        onValueChange={setFilterStatus}>
                        <SelectTrigger className='w-28 h-8 text-xs bg-white border-gray-200 text-gray-900'>
                          <SelectValue placeholder='All Status' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='all'>All Status</SelectItem>
                          <SelectItem value='active'>Active</SelectItem>
                          <SelectItem value='suspended'>Suspended</SelectItem>
                          <SelectItem value='banned'>Banned</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-16'>#</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className='p-8 text-center text-muted-foreground'>
                        <RefreshCw className='w-5 h-5 animate-spin mx-auto mb-2' />
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className='p-8 text-center text-muted-foreground'>
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user, index) => (
                      <EditableUserRow
                        key={user.user.id}
                        user={user}
                        index={index + 1}
                        onUpdate={handleUserUpdate}
                        currentUserRole={userRole || undefined}
                        canEditRoles={canEditUserRoles}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </motion.div>
          </TabsContent>

          {/* Moderation Tab */}
          {canAccessModerationTab && (
            <TabsContent
              value='moderation'
              className='space-y-4'>
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                <Card>
                  <CardHeader className='pb-3'>
                    <CardTitle className='text-base flex items-center space-x-2'>
                      <Shield className='w-4 h-4' />
                      <span>Recent Moderation Actions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    {loading ? (
                      <div className='flex items-center justify-center py-8'>
                        <RefreshCw className='w-5 h-5 animate-spin text-gray-400' />
                      </div>
                    ) : moderationActions.length === 0 ? (
                      <p className='text-gray-500 text-sm text-center py-4'>
                        No moderation actions yet
                      </p>
                    ) : (
                      moderationActions.slice(0, 10).map((action) => (
                        <div
                          key={action.id}
                          className='flex items-center space-x-3 p-3 bg-gray-50 rounded-lg'>
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              action.action === 'ban' ||
                              action.action === 'timeban'
                                ? 'bg-red-100'
                                : action.action === 'unban'
                                ? 'bg-green-100'
                                : action.action === 'warn'
                                ? 'bg-yellow-100'
                                : 'bg-blue-100'
                            }`}>
                            <AlertTriangle
                              className={`w-4 h-4 ${
                                action.action === 'ban' ||
                                action.action === 'timeban'
                                  ? 'text-red-600'
                                  : action.action === 'unban'
                                  ? 'text-green-600'
                                  : action.action === 'warn'
                                  ? 'text-yellow-600'
                                  : 'text-blue-600'
                              }`}
                            />
                          </div>
                          <div className='flex-1 min-w-0'>
                            <p className='text-sm font-medium text-gray-900 truncate capitalize'>
                              {action.action} -{' '}
                              {action.targetUser?.displayName ||
                                action.targetUser?.email}
                            </p>
                            <p className='text-xs text-gray-500 truncate'>
                              {action.reason}
                            </p>
                            <p className='text-xs text-gray-400'>
                              by{' '}
                              {action.moderator?.displayName ||
                                action.moderator?.email}{' '}
                              •{' '}
                              {new Date(action.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className='pb-3'>
                    <CardTitle className='text-base flex items-center space-x-2'>
                      <FileText className='w-4 h-4' />
                      <span>Content Reports</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <div className='text-center py-4'>
                      <FileText className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                      <p className='text-gray-500 text-sm'>
                        Content reporting system available
                      </p>
                      <p className='text-xs text-gray-400'>
                        Reports will be displayed here
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* Announcements Tab */}
          {canAccessAnnouncementsTab && (
            <TabsContent
              value='announcements'
              className='space-y-4'>
              <Card>
                <CardHeader className='pb-3 flex flex-row items-center justify-between'>
                  <CardTitle className='text-base flex items-center space-x-2'>
                    <Megaphone className='w-4 h-4' />
                    <span>Active Announcements</span>
                  </CardTitle>
                  <Button
                    size='sm'
                    className='h-8'>
                    <Plus className='w-3 h-3 mr-1' />
                    New
                  </Button>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {loading ? (
                    <div className='flex items-center justify-center py-8'>
                      <RefreshCw className='w-5 h-5 animate-spin text-gray-400' />
                    </div>
                  ) : announcements.length === 0 ? (
                    <div className='text-center py-8'>
                      <Megaphone className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                      <p className='text-gray-500 text-sm'>
                        No active announcements
                      </p>
                      <p className='text-xs text-gray-400'>
                        Create announcements to communicate with users
                      </p>
                    </div>
                  ) : (
                    announcements.map((announcement) => (
                      <div
                        key={announcement.id}
                        className='border rounded-lg p-4 space-y-2'>
                        <div className='flex items-start justify-between'>
                          <div className='flex-1'>
                            <div className='flex items-center space-x-2 mb-1'>
                              <h3 className='font-medium text-gray-900'>
                                {announcement.title}
                              </h3>
                              {announcement.isPinned && (
                                <Badge
                                  variant='secondary'
                                  className='text-xs'>
                                  Pinned
                                </Badge>
                              )}
                              <Badge
                                variant='outline'
                                className={`text-xs ${
                                  announcement.priority === 'high'
                                    ? 'border-red-200 text-red-700'
                                    : announcement.priority === 'medium'
                                    ? 'border-yellow-200 text-yellow-700'
                                    : 'border-gray-200 text-gray-700'
                                }`}>
                                {announcement.priority}
                              </Badge>
                            </div>
                            <p className='text-sm text-gray-600 mb-2'>
                              {announcement.content}
                            </p>
                            <p className='text-xs text-gray-400'>
                              by{' '}
                              {announcement.author?.displayName ||
                                announcement.author?.email}{' '}
                              •{' '}
                              {new Date(
                                announcement.createdAt,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* System Tab */}
          {canAccessSystemTab && (
            <TabsContent
              value='system'
              className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <Card>
                  <CardHeader className='pb-3'>
                    <CardTitle className='text-base flex items-center space-x-2'>
                      <Database className='w-4 h-4' />
                      <span>Database Status</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='flex justify-between items-center'>
                      <span className='text-sm text-gray-600'>
                        Connection Status
                      </span>
                      <Badge className='bg-green-50 text-green-700 border-green-200'>
                        Connected
                      </Badge>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-sm text-gray-600'>Total Users</span>
                      <span className='text-sm font-medium text-gray-900'>
                        {stats?.totalUsers || 0}
                      </span>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-sm text-gray-600'>
                        Total Conversations
                      </span>
                      <span className='text-sm font-medium text-gray-900'>
                        {stats?.totalConversations || 0}
                      </span>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-sm text-gray-600'>
                        Total Messages
                      </span>
                      <span className='text-sm font-medium text-gray-900'>
                        {stats?.totalMessages || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className='pb-3'>
                    <CardTitle className='text-base flex items-center space-x-2'>
                      <Activity className='w-4 h-4' />
                      <span>System Metrics</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='flex justify-between items-center'>
                      <span className='text-sm text-gray-600'>
                        Active Users (7 days)
                      </span>
                      <span className='text-sm font-medium text-emerald-600'>
                        {stats?.activeUsers || 0}
                      </span>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-sm text-gray-600'>
                        Moderation Actions (7 days)
                      </span>
                      <span className='text-sm font-medium text-gray-900'>
                        {stats?.moderationActions || 0}
                      </span>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-sm text-gray-600'>Environment</span>
                      <Badge
                        variant='outline'
                        className='text-xs'>
                        {process.env.NODE_ENV || 'development'}
                      </Badge>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-sm text-gray-600'>
                        Last Updated
                      </span>
                      <span className='text-xs text-gray-400'>
                        {new Date().toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      <Toaster
        position='top-right'
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#363636',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
};

export default ModernAdminDashboard;
