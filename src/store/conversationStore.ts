import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Message } from '@/components/chat/types';

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  selectedCourse?: 'nodejs' | 'python';
}

interface ConversationStore {
  conversations: Conversation[];
  currentConversationId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  createConversation: (title?: string, course?: 'nodejs' | 'python') => Promise<string>;
  deleteConversation: (id: string) => Promise<void>;
  updateConversation: (id: string, updates: Partial<Conversation>) => Promise<void>;
  addMessage: (conversationId: string, message: Message) => Promise<void>;
  updateMessage: (conversationId: string, messageId: string, content: string) => void; // Keep local for streaming
  setCurrentConversation: (id: string | null) => void;
  getCurrentConversation: () => Conversation | null;
  setCourseForConversation: (conversationId: string, course: 'nodejs' | 'python') => void;
  clearConversations: () => void;
  
  // Course-specific methods
  getOrCreateConversationForCourse: (course: 'nodejs' | 'python') => Promise<string>;
  getCurrentConversationForCourse: (course: 'nodejs' | 'python') => Conversation | null;
  
  // Data management
  loadConversations: () => Promise<void>;
  migrateFromSessionStorage: () => Promise<void>;
  
  // Utility methods
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const STORAGE_KEY = 'flowmind-conversations';
const CURRENT_CONVERSATION_KEY = 'flowmind-current-conversation';
const MIGRATION_KEY = 'flowmind-database-migrated';

// Check if database is enabled
const isDatabaseEnabled = () => {
  return typeof window !== 'undefined' && 
         process.env.NEXT_PUBLIC_USE_DATABASE === 'true';
};

// Helper functions for sessionStorage (fallback)
const loadFromSessionStorage = (): { conversations: Conversation[], currentId: string | null } => {
  try {
    const conversationsData = sessionStorage.getItem(STORAGE_KEY);
    const currentId = sessionStorage.getItem(CURRENT_CONVERSATION_KEY);
    
    if (conversationsData) {
      const parsed = JSON.parse(conversationsData);
      const conversations = parsed.map((conv: any) => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        messages: conv.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
      return { conversations, currentId };
    }
  } catch (error) {
    console.error('Failed to load conversations from sessionStorage:', error);
  }
  return { conversations: [], currentId: null };
};

const saveToSessionStorage = (conversations: Conversation[], currentId: string | null) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    if (currentId) {
      sessionStorage.setItem(CURRENT_CONVERSATION_KEY, currentId);
    } else {
      sessionStorage.removeItem(CURRENT_CONVERSATION_KEY);
    }
  } catch (error) {
    console.error('Failed to save conversations to sessionStorage:', error);
  }
};

// API helper functions with authentication
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  try {
    // Get auth token from window.Clerk if available
    let authHeaders = {};
    if (typeof window !== 'undefined' && (window as any).Clerk?.session) {
      try {
        const token = await (window as any).Clerk.session.getToken();
        if (token) {
          authHeaders = { Authorization: `Bearer ${token}` };
        }
      } catch (error) {
        console.warn('Failed to get auth token:', error);
      }
    }

    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error);
    throw error;
  }
};

export const useConversationStore = create<ConversationStore>()(
  subscribeWithSelector((set, get) => ({
    conversations: [],
    currentConversationId: null,
    isLoading: false,
    error: null,

    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),

    createConversation: async (title, course) => {
      const state = get();
      state.setLoading(true);
      state.setError(null);

      try {
        if (isDatabaseEnabled()) {
          console.log('📡 Creating conversation via database API');
          const response = await apiCall('/api/conversations', {
            method: 'POST',
            body: JSON.stringify({
              title: title || `${course === 'nodejs' ? 'Node.js' : 'Python'} Chat ${new Date().toLocaleDateString()}`,
              selectedCourse: course || 'nodejs',
            }),
          });

          const conversation: Conversation = {
            ...response.conversation,
            createdAt: new Date(response.conversation.createdAt),
            updatedAt: new Date(response.conversation.updatedAt),
            messages: response.conversation.messages || [],
          };

          set((state) => ({
            conversations: [...state.conversations, conversation],
            currentConversationId: conversation.id,
          }));

          return conversation.id;
        } else {
          // Fallback to SessionStorage
          console.log('💾 Creating conversation via SessionStorage');
          const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const now = new Date();
          
          const conversation: Conversation = {
            id,
            title: title || `${course === 'nodejs' ? 'Node.js' : 'Python'} Chat ${new Date().toLocaleDateString()}`,
            messages: [],
            createdAt: now,
            updatedAt: now,
            selectedCourse: course || 'nodejs',
          };

          set((state) => ({
            conversations: [...state.conversations, conversation],
            currentConversationId: id,
          }));

          saveToSessionStorage(get().conversations, id);
          return id;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to create conversation';
        state.setError(errorMsg);
        throw error;
      } finally {
        state.setLoading(false);
      }
    },

    deleteConversation: async (id) => {
      const state = get();
      state.setLoading(true);
      state.setError(null);

      try {
        if (isDatabaseEnabled()) {
          console.log('📡 Deleting conversation via database API');
          await apiCall(`/api/conversations`, {
            method: 'DELETE',
            body: JSON.stringify({ conversationId: id }),
          });
        }

        set((state) => ({
          conversations: state.conversations.filter((conv) => conv.id !== id),
          currentConversationId: state.currentConversationId === id ? null : state.currentConversationId,
        }));

        if (!isDatabaseEnabled()) {
          saveToSessionStorage(get().conversations, get().currentConversationId);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to delete conversation';
        state.setError(errorMsg);
        throw error;
      } finally {
        state.setLoading(false);
      }
    },

    updateConversation: async (id, updates) => {
      const state = get();
      
      // Update locally immediately for better UX
      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.id === id ? { ...conv, ...updates, updatedAt: new Date() } : conv
        ),
      }));

      try {
        if (isDatabaseEnabled()) {
          console.log('📡 Updating conversation via database API');
          await apiCall('/api/conversations', {
            method: 'PUT',
            body: JSON.stringify({ conversationId: id, ...updates }),
          });
        } else {
          saveToSessionStorage(get().conversations, get().currentConversationId);
        }
      } catch (error) {
        console.error('Failed to update conversation:', error);
        // Could revert the optimistic update here if needed
      }
    },

    addMessage: async (conversationId, message) => {
      const state = get();
      
      // Add message locally immediately for better UX
      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.id === conversationId
            ? {
                ...conv,
                messages: [...conv.messages, message],
                updatedAt: new Date(),
              }
            : conv
        ),
      }));

      try {
        if (isDatabaseEnabled()) {
          console.log('📡 Adding message via database API');
          await apiCall('/api/messages', {
            method: 'POST',
            body: JSON.stringify({
              conversationId,
              message: {
                role: message.role,
                content: message.content,
                sources: message.sources,
              },
            }),
          });
        } else {
          saveToSessionStorage(get().conversations, get().currentConversationId);
        }
      } catch (error) {
        console.error('Failed to persist message:', error);
        // Message is already added locally, so user sees it
        // Consider showing a warning about sync failure
      }
    },

    updateMessage: (conversationId, messageId, content) => {
      // This is used for streaming updates, keep it local/fast
      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.id === conversationId
            ? {
                ...conv,
                messages: conv.messages.map((msg) =>
                  msg.id === messageId ? { ...msg, content } : msg
                ),
                updatedAt: new Date(),
              }
            : conv
        ),
      }));

      // Save to SessionStorage if not using database
      if (!isDatabaseEnabled()) {
        saveToSessionStorage(get().conversations, get().currentConversationId);
      }
      // Note: Database sync for streaming updates could be done with debouncing
    },

    setCurrentConversation: (id) => {
      set({ currentConversationId: id });
      if (!isDatabaseEnabled()) {
        sessionStorage.setItem(CURRENT_CONVERSATION_KEY, id || '');
      }
    },

    getCurrentConversation: () => {
      const state = get();
      return state.conversations.find((conv) => conv.id === state.currentConversationId) || null;
    },

    setCourseForConversation: (conversationId, course) => {
      get().updateConversation(conversationId, { selectedCourse: course });
    },

    clearConversations: () => {
      set({ conversations: [], currentConversationId: null });
      if (!isDatabaseEnabled()) {
        sessionStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(CURRENT_CONVERSATION_KEY);
      }
    },

    getOrCreateConversationForCourse: async (course) => {
      const state = get();
      
      // First, look for any existing conversation with the selected course (prioritize ones with messages)
      const conversationsForCourse = state.conversations.filter(
        conv => conv.selectedCourse === course
      );
      
      if (conversationsForCourse.length > 0) {
        // Sort by: conversations with messages first, then by most recent
        const sortedConversations = conversationsForCourse.sort((a, b) => {
          // Prioritize conversations with messages
          if (a.messages.length > 0 && b.messages.length === 0) return -1;
          if (a.messages.length === 0 && b.messages.length > 0) return 1;
          // Then sort by most recent
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
        
        const selectedConv = sortedConversations[0];
        console.log('📋 Using existing conversation for course:', {
          course,
          conversationId: selectedConv.id,
          hasMessages: selectedConv.messages.length > 0,
          title: selectedConv.title
        });
        
        set({ currentConversationId: selectedConv.id });
        return selectedConv.id;
      }
      
      // Create new conversation for this course only if none exists
      console.log('🆕 Creating new conversation for course:', course);
      return await state.createConversation(undefined, course);
    },

    getCurrentConversationForCourse: (course) => {
      const state = get();
      const currentConv = state.conversations.find(conv => conv.id === state.currentConversationId);
      
      if (currentConv && currentConv.selectedCourse === course) {
        return currentConv;
      }
      
      return null;
    },

    loadConversations: async () => {
      const state = get();
      state.setLoading(true);
      state.setError(null);

      try {
        if (isDatabaseEnabled()) {
          console.log('📡 Loading conversations from database');
          const response = await apiCall('/api/conversations');
          
          const conversations: Conversation[] = response.conversations.map((conv: any) => ({
            ...conv,
            createdAt: new Date(conv.createdAt),
            updatedAt: new Date(conv.updatedAt),
            messages: conv.messages || [],
          }));

          set({ conversations });
        } else {
          console.log('💾 Loading conversations from SessionStorage');
          const { conversations, currentId } = loadFromSessionStorage();
          set({ conversations, currentConversationId: currentId });
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to load conversations';
        state.setError(errorMsg);
        console.error('Failed to load conversations:', error);
        
        // Fallback to SessionStorage if database fails
        if (isDatabaseEnabled()) {
          console.log('📴 Database failed, falling back to SessionStorage');
          const { conversations, currentId } = loadFromSessionStorage();
          set({ conversations, currentConversationId: currentId });
        }
      } finally {
        state.setLoading(false);
      }
    },

    migrateFromSessionStorage: async () => {
      const state = get();
      
      // Check if migration already completed
      if (sessionStorage.getItem(MIGRATION_KEY) === 'true') {
        console.log('✅ Migration already completed');
        return;
      }

      if (!isDatabaseEnabled()) {
        console.log('📴 Database not enabled, skipping migration');
        return;
      }

      try {
        console.log('🔄 Starting SessionStorage to Database migration');
        state.setLoading(true);
        
        const { conversations } = loadFromSessionStorage();
        
        if (conversations.length === 0) {
          console.log('📭 No conversations to migrate');
          sessionStorage.setItem(MIGRATION_KEY, 'true');
          return;
        }

        // Call migration API
        const response = await apiCall('/api/migrate', {
          method: 'POST',
          body: JSON.stringify({ conversations }),
        });

        console.log(`✅ Migration completed: ${response.conversationsImported} conversations, ${response.messagesImported} messages`);
        
        // Mark migration as complete
        sessionStorage.setItem(MIGRATION_KEY, 'true');
        
        // Reload conversations from database
        await state.loadConversations();
        
      } catch (error) {
        console.error('❌ Migration failed:', error);
        state.setError('Migration failed, continuing with SessionStorage');
      } finally {
        state.setLoading(false);
      }
    },
  }))
);

// Subscribe to state changes and save automatically (only for SessionStorage mode)
useConversationStore.subscribe(
  (state) => state,
  (state) => {
    if (!isDatabaseEnabled()) {
      saveToSessionStorage(state.conversations, state.currentConversationId);
    }
  }
);

// Initialize store on first load
if (typeof window !== 'undefined') {
  const store = useConversationStore.getState();
  
  // Start with loading conversations
  store.loadConversations().then(() => {
    // After loading, attempt migration if needed
    store.migrateFromSessionStorage();
  });
}