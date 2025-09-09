/**
 * Admin Dashboard Component
 * Provides comprehensive threading management and analytics for administrators
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  GitBranch, 
  MessageSquare, 
  Users, 
  Activity,
  Settings,
  Database,
  Shield,
  Eye,
  Download,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Clock,
  Archive
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useThreadingStore } from '@/store/threadingStore';
import { useConversationStore } from '@/store/conversationStore';
import { hasThreadingPermission, UserRole, getThreadingPermissions } from '@/lib/threading/permissions';
import ThreadVisualization from '@/components/threading/ThreadVisualization';
import ThreadSidebar from '@/components/threading/ThreadSidebar';

interface ThreadStats {
  totalThreads: number;
  activeThreads: number;
  totalMessages: number;
  branchPoints: number;
  averageDepth: number;
  mostActiveThread: string;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: Date;
    userId: string;
  }>;
}

interface ConversationAnalytics {
  totalConversations: number;
  activeUsers: number;
  messagesPerDay: number;
  averageResponseTime: number;
  popularTopics: Array<{ topic: string; count: number }>;
}

export default function AdminDashboard() {
  const { user } = useUser();
  const { conversations, getAllConversations } = useConversationStore();
  const {
    threads,
    traces,
    currentThreadId,
    showThreadVisualization,
    setShowThreadVisualization,
    loadConversationThreads,
    refreshThreadData,
  } = useThreadingStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'threads' | 'analytics' | 'settings'>('overview');
  const [threadStats, setThreadStats] = useState<ThreadStats | null>(null);
  const [conversationAnalytics, setConversationAnalytics] = useState<ConversationAnalytics | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check permissions
  const userRole: UserRole = user?.publicMetadata?.role === 'admin' ? 'admin' 
    : user?.publicMetadata?.role === 'moderator' ? 'moderator' : 'user';
  const permissions = getThreadingPermissions(userRole);
  
  const canViewAnalytics = hasThreadingPermission(userRole, 'canViewAnalytics');
  const canExportData = hasThreadingPermission(userRole, 'canExportThreadData');
  const canModerate = hasThreadingPermission(userRole, 'canModerateThreads');
  const canViewAllConversations = hasThreadingPermission(userRole, 'canViewAllConversations');

  // Redirect non-admin/moderator users
  if (!permissions.canAccessAdvancedFeatures) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h1>
          <p className="text-slate-600">You don't have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  // Load data
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        // Load conversations if user has permission
        if (canViewAllConversations) {
          await getAllConversations();
        }

        // Calculate thread statistics
        if (threads.length > 0) {
          const activeThreadsCount = threads.filter(t => t.isActive).length;
          const totalMessages = threads.reduce((sum, t) => sum + t.messageCount, 0);
          const branchPointsCount = Array.from(traces.values()).filter(t => t.branchPoint).length;
          const averageDepth = Array.from(traces.values()).reduce((sum, t) => sum + t.depth, 0) / traces.size;
          const mostActive = threads.reduce((max, t) => t.messageCount > max.messageCount ? t : max, threads[0]);

          setThreadStats({
            totalThreads: threads.length,
            activeThreads: activeThreadsCount,
            totalMessages,
            branchPoints: branchPointsCount,
            averageDepth: Math.round(averageDepth * 10) / 10,
            mostActiveThread: mostActive?.name || 'None',
            recentActivity: [] // Would be populated from database
          });
        }

        // Calculate conversation analytics
        if (conversations.length > 0) {
          setConversationAnalytics({
            totalConversations: conversations.length,
            activeUsers: new Set(conversations.map(c => c.userId)).size,
            messagesPerDay: Math.round(conversations.reduce((sum, c) => sum + c.messages.length, 0) / 7), // Rough estimate
            averageResponseTime: 2500, // Would calculate from actual response times
            popularTopics: [
              { topic: 'Node.js', count: conversations.filter(c => c.selectedCourse === 'nodejs').length },
              { topic: 'Python', count: conversations.filter(c => c.selectedCourse === 'python').length },
            ]
          });
        }
      } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [threads, traces, conversations, canViewAllConversations, getAllConversations]);

  const handleExportData = async () => {
    if (!canExportData) return;

    try {
      const exportData = {
        threads: threads,
        traces: Array.from(traces.entries()),
        conversations: conversations,
        exportDate: new Date(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flowmind-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('❌ Error exporting data:', error);
    }
  };

  const StatCard = ({ icon: Icon, title, value, description, color = 'blue' }: {
    icon: any;
    title: string;
    value: string | number;
    description?: string;
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  }) => {
    const colorClasses = {
      blue: 'bg-blue-500 text-blue-100',
      green: 'bg-green-500 text-green-100',
      purple: 'bg-purple-500 text-purple-100',
      orange: 'bg-orange-500 text-orange-100',
      red: 'bg-red-500 text-red-100',
    };

    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center">
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-slate-600">{title}</h3>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            {description && <p className="text-sm text-slate-500">{description}</p>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-600">Manage threading system and analytics</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {canExportData && (
              <button
                onClick={handleExportData}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export Data</span>
              </button>
            )}
            
            <button
              onClick={refreshThreadData}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-8 mt-6">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'threads', label: 'Thread Management', icon: GitBranch },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex items-center space-x-2 pb-4 border-b-2 transition-colors
                ${activeTab === tab.id
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
                }
              `}
            >
              <tab.icon className="w-4 h-4" />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    icon={GitBranch}
                    title="Active Threads"
                    value={threadStats?.activeThreads || 0}
                    description={`${threadStats?.totalThreads || 0} total`}
                    color="purple"
                  />
                  <StatCard
                    icon={MessageSquare}
                    title="Total Messages"
                    value={threadStats?.totalMessages || 0}
                    description={`${threadStats?.averageDepth || 0} avg depth`}
                    color="blue"
                  />
                  <StatCard
                    icon={Users}
                    title="Active Users"
                    value={conversationAnalytics?.activeUsers || 0}
                    description="Last 7 days"
                    color="green"
                  />
                  <StatCard
                    icon={Activity}
                    title="Branch Points"
                    value={threadStats?.branchPoints || 0}
                    description="Total branching events"
                    color="orange"
                  />
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h2>
                  <div className="space-y-3">
                    {threadStats?.recentActivity?.length ? (
                      threadStats.recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full" />
                          <div className="flex-1">
                            <p className="text-sm text-slate-900">{activity.description}</p>
                            <p className="text-xs text-slate-500">{activity.timestamp.toLocaleString()}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 text-center py-8">No recent activity</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'threads' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-900">Thread Management</h2>
                  <button
                    onClick={() => setShowThreadVisualization(!showThreadVisualization)}
                    className={`
                      flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors
                      ${showThreadVisualization
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }
                    `}
                  >
                    <Eye className="w-4 h-4" />
                    <span>{showThreadVisualization ? 'Hide' : 'Show'} Visualization</span>
                  </button>
                </div>

                {showThreadVisualization ? (
                  <div className="bg-white rounded-lg border border-slate-200 h-96">
                    <ThreadVisualization
                      threads={threads}
                      traces={traces}
                      currentThreadId={currentThreadId || ''}
                      onThreadSwitch={async (threadId: string) => {
                        console.log('Switch to thread:', threadId);
                      }}
                      onCreateBranch={async (messageId: string, branchName: string) => {
                        console.log('Create branch:', { messageId, branchName });
                      }}
                      onRegenerateMessage={async (messageId: string) => {
                        console.log('Regenerate message:', messageId);
                      }}
                      onDeleteThread={async (threadId: string) => {
                        console.log('Delete thread:', threadId);
                      }}
                      messages={[]} // Would need actual messages
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Conversation Selection */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                      <h3 className="font-semibold text-slate-900 mb-4">Conversations</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {conversations.map(conversation => (
                          <button
                            key={conversation.id}
                            onClick={() => {
                              setSelectedConversationId(conversation.id);
                              loadConversationThreads(conversation.id);
                            }}
                            className={`
                              w-full text-left p-3 rounded-lg transition-colors
                              ${selectedConversationId === conversation.id
                                ? 'bg-purple-100 text-purple-700'
                                : 'hover:bg-slate-50'
                              }
                            `}
                          >
                            <div className="text-sm font-medium">
                              {conversation.selectedCourse} Conversation
                            </div>
                            <div className="text-xs text-slate-500">
                              {conversation.messages.length} messages
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Thread List */}
                    <div className="lg:col-span-2">
                      <ThreadSidebar
                        threads={threads}
                        currentThreadId={currentThreadId || ''}
                        onThreadSwitch={async (threadId: string) => {
                          console.log('Switch to thread:', threadId);
                        }}
                        onCreateBranch={async (messageId: string, branchName: string) => {
                          console.log('Create branch:', { messageId, branchName });
                        }}
                        onDeleteThread={async (threadId: string) => {
                          console.log('Delete thread:', threadId);
                        }}
                        onRenameThread={async (threadId: string, newName: string) => {
                          console.log('Rename thread:', { threadId, newName });
                        }}
                        onToggleThreadVisibility={async (threadId: string) => {
                          console.log('Toggle visibility:', threadId);
                        }}
                        className="h-96"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'analytics' && canViewAnalytics && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-slate-900">Analytics & Insights</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Popular Topics */}
                  <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-900 mb-4">Popular Topics</h3>
                    <div className="space-y-3">
                      {conversationAnalytics?.popularTopics?.map(topic => (
                        <div key={topic.topic} className="flex items-center justify-between">
                          <span className="text-slate-700">{topic.topic}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 h-2 bg-slate-200 rounded-full">
                              <div 
                                className="h-full bg-purple-500 rounded-full"
                                style={{ 
                                  width: `${(topic.count / Math.max(...(conversationAnalytics?.popularTopics?.map(t => t.count) || [1]))) * 100}%` 
                                }}
                              />
                            </div>
                            <span className="text-sm text-slate-600">{topic.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-900 mb-4">Performance</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-slate-600">Avg Response Time</span>
                          <span className="text-sm font-medium">{conversationAnalytics?.averageResponseTime || 0}ms</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full">
                          <div className="w-3/4 h-full bg-green-500 rounded-full" />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-slate-600">Messages per Day</span>
                          <span className="text-sm font-medium">{conversationAnalytics?.messagesPerDay || 0}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full">
                          <div className="w-4/5 h-full bg-blue-500 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-slate-900">Threading System Settings</h2>
                
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Permission Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <span className="font-medium text-slate-900">Thread Visualization</span>
                        <p className="text-sm text-slate-600">Allow moderators and admins to view thread visualizations</p>
                      </div>
                      <div className="text-green-600 font-medium">Enabled</div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <span className="font-medium text-slate-900">Data Export</span>
                        <p className="text-sm text-slate-600">Allow administrators to export conversation data</p>
                      </div>
                      <div className="text-green-600 font-medium">Enabled</div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <span className="font-medium text-slate-900">User Thread Access</span>
                        <p className="text-sm text-slate-600">Basic users can view their own threads</p>
                      </div>
                      <div className="text-green-600 font-medium">Enabled</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}