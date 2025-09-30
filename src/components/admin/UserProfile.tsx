'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  User,
  Mail,
  Calendar,
  Shield,
  MessageSquare,
  Activity,
  Edit3
} from 'lucide-react';

interface UserProfileProps {
  user: {
    id: string;
    email: string;
    displayName: string;
    role: 'user' | 'moderator' | 'admin';
    isActive: boolean;
    createdAt: string;
  };
  profile?: {
    status: 'active' | 'suspended' | 'banned' | 'pending';
  };
  totalConversations: number;
  totalMessages: number;
  onEdit?: () => void;
}

export function UserProfile({
  user,
  profile,
  totalConversations,
  totalMessages,
  onEdit
}: UserProfileProps) {
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
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">User Profile</CardTitle>
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-8 w-8 p-0"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Avatar and basic info */}
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>
              {(user.displayName || user.email)?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {user.displayName || 'Unnamed User'}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {user.email}
            </p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge className={`text-xs border ${getRoleBadgeColor(user.role)}`}>
                <Shield className="w-3 h-3 mr-1" />
                {user.role}
              </Badge>
              <Badge className={`text-xs border ${getStatusBadgeColor(profile?.status || 'active')}`}>
                <Activity className="w-3 h-3 mr-1" />
                {profile?.status || 'active'}
              </Badge>
            </div>
          </div>
        </div>

        {/* User details */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">User ID</p>
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.id}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Mail className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Calendar className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Joined</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <MessageSquare className="w-4 h-4 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Activity</p>
              <div className="text-sm font-medium text-gray-900">
                <div>{totalConversations} conversations</div>
                <div>{totalMessages} messages</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}