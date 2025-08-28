# FlowMind Threading System

## Overview

The FlowMind Threading System provides comprehensive conversation threading and tracing capabilities, enabling users to branch conversations, track message lineage, and visualize conversation flows. This system implements role-based access control with different feature sets for users, moderators, and administrators.

## Architecture

### Core Components

#### 1. **Threading Engine** (`src/lib/threading/engine.ts`)
The core logic engine that manages conversation threads, branching, and message tracing.

**Key Features:**
- Thread initialization and management
- Conversation branching from any message
- Message regeneration with alternative responses
- Lineage tracking for complete conversation history
- Configurable limits (max threads, max depth)

**Methods:**
```typescript
initializeConversation(conversationId: string, firstMessageId?: string): Promise<string>
createBranch(sourceMessageId: string, branchName: string): Promise<string>
switchThread(threadId: string): Promise<void>
regenerateMessage(messageId: string): Promise<string>
createMessageTrace(messageId: string, threadId: string, parentMessageId: string | null): Promise<MessageTrace>
```

#### 2. **Database Service** (`src/lib/threading/database-service.ts`)
Handles persistence of threading data with proper error handling and transaction support.

**Database Tables:**
- `conversation_threads`: Thread metadata and relationships
- `message_traces`: Message lineage and branching information  
- `thread_actions`: Audit log for all threading operations

**Key Operations:**
```typescript
createThread(thread: Omit<ConversationThread, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>
getConversationThreads(conversationId: string): Promise<ConversationThread[]>
createMessageTrace(trace: Omit<MessageTrace, 'createdAt' | 'updatedAt'>): Promise<void>
logThreadAction(conversationId: string, actionType: string, actionData: any, userId: string): Promise<void>
```

#### 3. **Threading Store** (`src/store/threadingStore.ts`)
Zustand-based state management for threading functionality with real-time updates.

**State Management:**
```typescript
interface ThreadingState {
  currentThreadId: string | null;
  threads: ConversationThread[];
  traces: Map<string, MessageTrace>;
  showThreadSidebar: boolean;
  showThreadVisualization: boolean;
  selectedThreadId: string | null;
}
```

### UI Components

#### 1. **Thread Sidebar** (`src/components/threading/ThreadSidebar.tsx`)
Interactive sidebar showing all conversation threads with management controls.

**Features:**
- Hierarchical thread display
- Thread renaming and archiving
- Branch creation from messages
- Thread switching with visual indicators
- Message count and timestamp information

#### 2. **Thread Visualization** (`src/components/threading/ThreadVisualization.tsx`)  
Interactive graph visualization of conversation structure and message relationships.

**Features:**
- Node-based conversation flow display
- Interactive message nodes with actions
- Connection lines showing message relationships
- Color-coded threads and branch points
- Zoom and pan navigation
- Branch creation modal

#### 3. **Admin Dashboard** (`src/components/admin/AdminDashboard.tsx`)
Comprehensive management interface for administrators and moderators.

**Features:**
- Threading system analytics
- User activity monitoring
- Data export functionality
- Permission management
- Thread moderation tools

### Role-Based Access Control

The system implements three-tier access control through `src/lib/threading/permissions.ts`:

#### **User Role**
- View their own conversation threads
- Basic thread navigation
- Read-only access to thread information

```typescript
canViewThreads: true,
canCreateBranches: false,
canDeleteThreads: false,
canRenameThreads: false,
canViewVisualization: false
```

#### **Moderator Role**  
- Full thread management capabilities
- Create and manage branches
- Access to thread visualizations
- Thread moderation tools
- Analytics dashboard

```typescript
canViewThreads: true,
canCreateBranches: true,
canDeleteThreads: true,
canRenameThreads: true,
canViewVisualization: true,
canAccessAdvancedFeatures: true,
canModerateThreads: true
```

#### **Admin Role**
- Complete system access
- View all user conversations
- Data export capabilities
- System configuration
- Full analytics suite

```typescript
// All moderator permissions plus:
canViewAllConversations: true,
canExportThreadData: true,
canViewAnalytics: true
```

### Data Models

#### **ConversationThread**
```typescript
interface ConversationThread {
  id: string;
  conversationId: string;
  name: string;
  description?: string;
  rootMessageId: string;
  currentMessageId: string;
  messageCount: number;
  isMainThread: boolean;
  isActive: boolean;
  branchedFrom?: {
    threadId: string;
    messageId: string;
    timestamp: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

#### **MessageTrace**
```typescript
interface MessageTrace {
  messageId: string;
  conversationId: string;
  threadId: string;
  parentMessageId: string | null;
  childMessageIds: string[];
  branchPoint?: {
    originalMessageId: string;
    branchReason: string;
    branchTimestamp: Date;
  };
  lineage: string[];
  depth: number;
  metadata: {
    regenerated: boolean;
    editedFrom?: string;
    alternativeResponse: boolean;
    userFeedback?: 'positive' | 'negative' | 'neutral';
  };
}
```

#### **ThreadAction** (Audit Log)
```typescript
interface ThreadAction {
  id: string;
  conversationId: string;
  threadId?: string;
  messageId?: string;
  actionType: string;
  actionData: Record<string, unknown>;
  userId: string;
  reversible: boolean;
  undoData?: Record<string, unknown>;
  createdAt: Date;
}
```

## Integration with Chat System

### Enhanced Chat Interface
The threading system is seamlessly integrated into `src/components/chat/ChatInterface.tsx`:

1. **Automatic Threading**: Every new conversation gets a main thread created automatically
2. **Message Tracing**: Each message is traced for complete lineage tracking
3. **Role-Based UI**: Threading controls appear based on user permissions
4. **Real-Time Updates**: Thread state synchronizes with conversation changes

### Threading Controls
For admin/moderator users, the chat interface includes:
- Thread sidebar toggle
- Visualization mode switch
- Current thread indicator
- Thread count display

```typescript
{canViewThreads && (
  <div className='threading-controls'>
    <button onClick={() => setShowThreadSidebar(!showThreadSidebar)}>
      <GitBranch /> Threads ({threads.length})
    </button>
    {canViewVisualization && (
      <button onClick={() => setShowThreadVisualization(!showThreadVisualization)}>
        <BarChart3 /> Visualization
      </button>
    )}
  </div>
)}
```

## Database Schema

### Migration Script
The threading system requires additional database tables created via `src/lib/db/migrations/add-threading-tables.sql`:

```sql
-- Conversation Threads Table
CREATE TABLE conversation_threads (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  root_message_id TEXT,
  current_message_id TEXT,
  message_count INTEGER DEFAULT 0,
  is_main_thread BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  branched_from_thread_id TEXT,
  branched_from_message_id TEXT,
  branch_reason TEXT,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message Traces Table  
CREATE TABLE message_traces (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  message_id TEXT NOT NULL UNIQUE,
  conversation_id TEXT NOT NULL,
  thread_id TEXT NOT NULL,
  parent_message_id TEXT,
  depth INTEGER DEFAULT 0,
  position INTEGER DEFAULT 0,
  lineage JSONB DEFAULT '[]'::jsonb,
  branch_count INTEGER DEFAULT 0,
  is_branch_point BOOLEAN DEFAULT false,
  original_message_id TEXT,
  is_regenerated_response BOOLEAN DEFAULT false,
  is_edited_message BOOLEAN DEFAULT false,
  is_alternative_response BOOLEAN DEFAULT false,
  user_feedback JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Thread Actions Table (Audit Log)
CREATE TABLE thread_actions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id TEXT NOT NULL,
  thread_id TEXT,
  message_id TEXT,
  action_type TEXT NOT NULL,
  action_data JSONB DEFAULT '{}'::jsonb,
  user_id TEXT NOT NULL,
  reversible BOOLEAN DEFAULT false,
  undo_data JSONB DEFAULT '{}'::jsonb,
  is_undone BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Indexes for Performance
```sql
-- Optimized indexes for common queries
CREATE INDEX idx_conversation_threads_conversation_id ON conversation_threads(conversation_id);
CREATE INDEX idx_message_traces_thread_id ON message_traces(thread_id);
CREATE INDEX idx_message_traces_parent_message_id ON message_traces(parent_message_id);
CREATE INDEX idx_thread_actions_conversation_id ON thread_actions(conversation_id);
```

## Usage Examples

### Basic Thread Operations

#### Initialize Threading for New Conversation
```typescript
const { initializeConversationThreading } = useThreadingStore();

// Initialize when first message is sent
await initializeConversationThreading(conversationId, firstMessageId);
```

#### Create Branch from Message
```typescript
const { createBranch } = useThreadingStore();

// Create alternative conversation path
const newThreadId = await createBranch(sourceMessageId, 'Alternative Discussion');
```

#### Switch Between Threads
```typescript
const { switchThread } = useThreadingStore();

// Switch to different conversation branch
await switchThread(targetThreadId);
```

### Advanced Features

#### Message Regeneration
```typescript
const { regenerateMessage } = useThreadingStore();

// Generate alternative AI response
const newMessageId = await regenerateMessage(originalMessageId);
```

#### Thread Analytics
```typescript
const { getThreadStatistics } = useThreadingEngine();

const stats = getThreadStatistics(threadId);
// Returns: { messageCount, maxDepth, branchPoints, alternatives, regenerations }
```

### Permission Checks
```typescript
import { hasThreadingPermission, UserRole } from '@/lib/threading/permissions';

const userRole: UserRole = 'moderator';
const canCreateBranch = hasThreadingPermission(userRole, 'canCreateBranches');

if (canCreateBranch) {
  // Show branch creation UI
}
```

## Configuration

### Threading Engine Configuration
```typescript
const config: ThreadingConfig = {
  maxThreadsPerConversation: 10,
  maxDepthPerThread: 50,
  autoArchiveInactiveThreads: true,
  visualizationEnabled: true,
  branchingEnabled: true,
};

const engine = new ThreadingEngine(config);
```

### Feature Limits by Role
```typescript
const limits = getThreadingFeatureConfig(userRole);
// Returns:
// {
//   maxBranchesPerConversation: role === 'admin' ? 50 : role === 'moderator' ? 20 : 0,
//   maxThreadDepth: role === 'admin' ? 100 : role === 'moderator' ? 50 : 10,
//   canAccessOtherUsersThreads: permissions.canViewAllConversations,
//   canViewDetailedAnalytics: permissions.canViewAnalytics
// }
```

## Performance Considerations

### Optimizations Implemented

1. **Efficient Queries**: Optimized database indexes for common threading operations
2. **Lazy Loading**: Thread data loaded only when needed
3. **Caching**: In-memory caching of frequently accessed thread data
4. **Batch Operations**: Multiple thread operations batched for efficiency
5. **Background Processing**: Non-critical operations processed asynchronously

### Memory Management
- Thread state properly cleaned up when conversations are closed
- Large conversation trees use pagination for visualization
- Message traces use efficient Map data structures for fast lookups

### Database Performance
```sql
-- Example optimized query for loading thread hierarchy
SELECT t.*, mt.depth, mt.lineage 
FROM conversation_threads t
LEFT JOIN message_traces mt ON t.root_message_id = mt.message_id
WHERE t.conversation_id = ? 
ORDER BY t.priority DESC, t.updated_at DESC;
```

## Future Enhancements

### Planned Features
1. **Thread Merging**: Combine multiple threads back into main conversation
2. **Advanced Analytics**: ML-powered conversation flow analysis
3. **Export Formats**: Support for PDF, Word, and other export formats
4. **Real-time Collaboration**: Multiple users working on same thread
5. **Thread Templates**: Pre-defined thread structures for common use cases
6. **Mobile Optimization**: Enhanced mobile UI for threading features

### API Extensions
```typescript
// Future API methods
mergeThreads(sourceThreadIds: string[], targetThreadId: string): Promise<void>
exportThreadToFormat(threadId: string, format: 'pdf' | 'docx' | 'json'): Promise<Blob>
getThreadAnalytics(threadId: string, timeRange: DateRange): Promise<ThreadAnalytics>
createThreadTemplate(template: ThreadTemplate): Promise<string>
```

## Troubleshooting

### Common Issues

1. **Thread Not Loading**: Check user permissions and database connectivity
2. **Branch Creation Failed**: Verify thread limits haven't been exceeded  
3. **Visualization Not Showing**: Ensure user has moderator/admin role
4. **Missing Message Traces**: Check that message tracing is enabled

### Debug Tools
```typescript
// Enable threading debug logging
localStorage.setItem('threading-debug', 'true');

// Check threading state
console.log('Threading State:', useThreadingStore.getState());

// Verify permissions
console.log('User Permissions:', getThreadingPermissions(userRole));
```

### Performance Monitoring
```typescript
// Monitor threading performance
const startTime = performance.now();
await createBranch(messageId, branchName);
console.log(`Branch creation took: ${performance.now() - startTime}ms`);
```

This threading system provides a robust foundation for advanced conversation management while maintaining excellent performance and user experience across all permission levels.