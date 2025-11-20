import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Message } from '@/components/chat/types';

// Type definitions for API responses
interface ConversationData {
  id: string;
  title: string;
  selectedCourse?: 'nodejs' | 'python';
  createdAt: string;
  updatedAt: string;
  messages: MessageData[];
}

interface MessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: unknown[];
}

interface ClerkWindow {
  Clerk?: {
    session?: {
      getToken: () => Promise<string>;
    };
  };
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Window extends ClerkWindow {}
}

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
  createTempConversation: (title?: string, course?: 'nodejs' | 'python', id?: string) => string;
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

  // Navigation helper for new URL structure
  navigateToConversation: (conversationId: string, course: 'nodejs' | 'python') => void;
  
  // Data management
  loadConversations: () => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;
  getAllConversations: () => Promise<void>;
  migrateFromSessionStorage: () => Promise<void>;
  
  // Utility methods
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const STORAGE_KEY = 'flowmind-conversations';
const CURRENT_CONVERSATION_KEY = 'flowmind-current-conversation';
const MIGRATION_KEY = 'flowmind-database-migrated';

// Fast conversation ID generation for smooth UI flow
const generateOptimizedConversationId = (course: 'nodejs' | 'python'): string => {
  const timestamp = Date.now().toString(36); // Base36 encoding for shorter IDs
  const randomPart = Math.random().toString(36).substring(2, 8); // 6 character random
  return `${course}-${timestamp}-${randomPart}`;
};

// Check if database is enabled
const isDatabaseEnabled = () => {
  const enabled = typeof window !== 'undefined' &&
                  process.env.NEXT_PUBLIC_USE_DATABASE === 'true';
  console.log('🔍 Database enabled check:', {
    isClient: typeof window !== 'undefined',
    envValue: process.env.NEXT_PUBLIC_USE_DATABASE,
    isDatabaseEnabled: enabled
  });
  return enabled;
};

// Helper functions for sessionStorage (fallback)
const loadFromSessionStorage = (): { conversations: Conversation[], currentId: string | null } => {
  try {
    const conversationsData = sessionStorage.getItem(STORAGE_KEY);
    const currentId = sessionStorage.getItem(CURRENT_CONVERSATION_KEY);
    
    if (conversationsData) {
      const parsed = JSON.parse(conversationsData);
      const conversations = parsed.map((conv: ConversationData) => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        messages: conv.messages.map((msg: MessageData) => ({
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
    if (typeof window !== 'undefined' && window.Clerk?.session) {
      try {
        const token = await window.Clerk.session.getToken();
        if (token) {
          authHeaders = { Authorization: `Bearer ${token}` };
          console.log('🔑 Auth token retrieved successfully for API call');
        } else {
          console.warn('⚠️ No auth token available from Clerk session');
        }
      } catch (error) {
        console.warn('❌ Failed to get auth token:', error);
        // If we can't get auth token and database is enabled, this will likely fail
        if (isDatabaseEnabled()) {
          throw new Error('Authentication required but token unavailable');
        }
      }
    } else {
      console.warn('⚠️ Clerk session not available');
      if (isDatabaseEnabled()) {
        throw new Error('Authentication required but Clerk session not initialized');
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
      // Handle 503 (Database not enabled) - fall back to sessionStorage
      if (response.status === 503) {
        console.warn('⚠️ Database not enabled (503), falling back to sessionStorage');
        return { success: false, useSessionStorage: true };
      }

      // Handle 401 (Unauthorized) - user not authenticated
      if (response.status === 401) {
        console.warn('⚠️ User not authenticated (401)');
        return { success: false, unauthorized: true };
      }

      let errorDetails = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorBody = await response.text();
        errorDetails += ` - ${errorBody}`;
      } catch {
        // Ignore error reading response body
      }
      throw new Error(errorDetails);
    }

    return await response.json();
  } catch (error) {
    // Only log non-404 errors as errors; 404s are expected for new conversations
    if (error instanceof Error && !error.message.includes('404')) {
      console.error(`❌ API call failed: ${endpoint}`, error);
      console.error('📋 Error details:', error.message);
    }
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

    createTempConversation: (title, course, id) => {
      // Create conversation in memory only - no database persistence until first message
      const conversationId = id || generateOptimizedConversationId(course || 'nodejs');
      const now = new Date();

      const conversation: Conversation = {
        id: conversationId,
        title: title || `${course === 'nodejs' ? 'Node.js' : 'Python'} Chat`,
        messages: [],
        createdAt: now,
        updatedAt: now,
        selectedCourse: course || 'nodejs',
      };

      console.log('🔄 Creating temporary conversation (not persisted until first message):', {
        id: conversationId,
        title: conversation.title,
        course: conversation.selectedCourse
      });

      set((state) => ({
        conversations: [...state.conversations, conversation],
        currentConversationId: conversationId,
      }));

      // Save to SessionStorage for immediate UI consistency
      if (!isDatabaseEnabled()) {
        saveToSessionStorage(get().conversations, conversationId);
      }

      return conversationId;
    },

    createConversation: async (title, course) => {
      const state = get();
      state.setLoading(true);
      state.setError(null);

      try {
        if (isDatabaseEnabled()) {
          console.log('📡 Creating conversation via database API');
          const requestPayload = {
            title: title || `${course === 'nodejs' ? 'Node.js' : 'Python'} Chat ${new Date().toLocaleDateString()}`,
            selectedCourse: course || 'nodejs',
          };
          
          console.log('🔍 Conversation creation payload:', requestPayload);
          
          const response = await apiCall('/api/conversations', {
            method: 'POST',
            body: JSON.stringify(requestPayload),
          });

          console.log('🔍 Conversation creation response:', response);

          const conversation: Conversation = {
            ...response.data,
            createdAt: new Date(response.data.createdAt),
            updatedAt: new Date(response.data.updatedAt),
            messages: response.data.messages || [],
          };

          console.log('🔍 Created conversation object:', {
            id: conversation.id,
            title: conversation.title,
            selectedCourse: conversation.selectedCourse,
            hasId: !!conversation.id,
          });

          set((state) => ({
            conversations: [...state.conversations, conversation],
            currentConversationId: conversation.id,
          }));

          console.log('✅ Conversation created successfully with ID:', conversation.id);
          return conversation.id;
        } else {
          // Fallback to SessionStorage
          console.log('💾 Creating conversation via SessionStorage');
          const id = generateOptimizedConversationId(course || 'nodejs');
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
      get().setLoading(true);
      get().setError(null);

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
        get().setError(errorMsg);
        throw error;
      } finally {
        get().setLoading(false);
      }
    },

    updateConversation: async (id, updates) => {
      
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
      console.log('🔍 Store Debug - addMessage called with:', {
        conversationId,
        messageRole: message.role,
        messageContent: message.content?.substring(0, 100),
        hasConversationId: !!conversationId,
        hasMessage: !!message,
        hasRole: !!message.role,
        hasContent: !!message.content,
        timestamp: message.timestamp,
        timestampType: typeof message.timestamp,
        timestampString: message.timestamp?.toString(),
      });

      // Check if this is the first message in a temporary conversation
      const state = get();
      const currentConversation = state.conversations.find(conv => conv.id === conversationId);
      const isFirstMessage = currentConversation && currentConversation.messages.length === 0;

      if (isFirstMessage && isDatabaseEnabled()) {
        console.log('🆕 First message - persisting temporary conversation to database:', conversationId);
        try {
          // Create the conversation in the database with the same ID from the temporary conversation
          const requestPayload = {
            id: conversationId, // Use the existing conversationId
            title: currentConversation.title,
            selectedCourse: currentConversation.selectedCourse,
          };

          await apiCall('/api/conversations', {
            method: 'POST',
            body: JSON.stringify(requestPayload),
          });

          console.log('✅ Temporary conversation persisted to database with ID:', conversationId);
        } catch (error) {
          console.error('❌ Failed to persist conversation to database:', error);
          // Continue with local storage - don't block the user
        }
      }

      // Ensure message has timestamp
      const messageWithTimestamp = {
        ...message,
        timestamp: message.timestamp || new Date(),
      };

      console.log('🔍 Message with timestamp:', {
        hasTimestamp: !!messageWithTimestamp.timestamp,
        timestamp: messageWithTimestamp.timestamp,
        timestampType: typeof messageWithTimestamp.timestamp,
      });
      
      // Add message locally immediately for better UX with 5-message limit
      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.id === conversationId
            ? {
                ...conv,
                messages: (() => {
                  const newMessages = [...conv.messages, messageWithTimestamp];
                  // Keep only the most recent 5 messages
                  if (newMessages.length > 5) {
                    console.log(`📝 Limiting conversation to 5 messages (was ${newMessages.length})`);
                    return newMessages.slice(-5); // Keep last 5 messages
                  }
                  return newMessages;
                })(),
                // Update title to first user message (like Claude app)
                title: (() => {
                  // Only update title if this is the first user message
                  if (messageWithTimestamp.role === 'user' && conv.messages.length === 0) {
                    const truncatedMessage = messageWithTimestamp.content.length > 50 
                      ? messageWithTimestamp.content.substring(0, 50) + '...'
                      : messageWithTimestamp.content;
                    console.log(`📝 Setting conversation title to first message: "${truncatedMessage}"`);
                    return truncatedMessage;
                  }
                  return conv.title; // Keep existing title
                })(),
                updatedAt: new Date(),
              }
            : conv
        ),
      }));

      try {
        if (isDatabaseEnabled()) {
          console.log('📡 Adding message via database API');
          
          // Validate before creating payload
          if (!conversationId) {
            throw new Error('❌ conversationId is required but not provided');
          }
          if (!messageWithTimestamp.role) {
            throw new Error('❌ message.role is required but not provided');
          }
          if (!messageWithTimestamp.content || !messageWithTimestamp.content.trim()) {
            console.error('❌ message.content validation failed:', {
              content: messageWithTimestamp.content,
              contentType: typeof messageWithTimestamp.content,
              contentValue: JSON.stringify(messageWithTimestamp.content),
              trimmedContent: messageWithTimestamp.content?.trim(),
              entireMessage: JSON.stringify(messageWithTimestamp),
            });
            throw new Error('❌ message.content is required but not provided');
          }
          
          const payload = {
            conversationId,
            role: messageWithTimestamp.role,
            content: messageWithTimestamp.content,
            sources: messageWithTimestamp.sources,
            timestamp: messageWithTimestamp.timestamp,
            processingTimeMs: 0, // Default for user messages
          };
          
          console.log('🔍 API Payload:', payload);
          console.log('🔍 Payload validation:', {
            hasConversationId: !!payload.conversationId,
            hasRole: !!payload.role,
            hasContent: !!payload.content,
            conversationIdType: typeof payload.conversationId,
            roleType: typeof payload.role,
            contentType: typeof payload.content,
          });
          
          await apiCall('/api/messages', {
            method: 'POST',
            body: JSON.stringify(payload),
          });
          
          // Update conversation title if this is the first user message
          if (messageWithTimestamp.role === 'user') {
            const currentConversation = get().conversations.find(c => c.id === conversationId);
            if (currentConversation && currentConversation.messages.length === 1) { // Only this message exists
              const newTitle = messageWithTimestamp.content.length > 50 
                ? messageWithTimestamp.content.substring(0, 50) + '...'
                : messageWithTimestamp.content;
              
              console.log('📝 Updating conversation title in database:', newTitle);
              try {
                await apiCall('/api/conversations', {
                  method: 'PUT',
                  body: JSON.stringify({ 
                    conversationId,
                    title: newTitle
                  }),
                });
              } catch (titleError) {
                console.error('❌ Failed to update conversation title:', titleError);
                // Non-critical error, don't throw
              }
            }
          }
        } else {
          saveToSessionStorage(get().conversations, get().currentConversationId);
        }
      } catch (error) {
        console.error('❌ Failed to persist message to database:', error);
        if (error instanceof Error) {
          console.error('Error details:', error.message);
        }
        // Message is already added locally, so user sees it
        // TODO: Consider showing a warning about sync failure in UI
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
      console.log('🔄 Setting current conversation:', {
        newId: id,
        previousId: get().currentConversationId,
        conversationExists: !!get().conversations.find(c => c.id === id),
        totalConversations: get().conversations.length
      });
      
      set({ currentConversationId: id });
      if (!isDatabaseEnabled()) {
        sessionStorage.setItem(CURRENT_CONVERSATION_KEY, id || '');
      }
    },

    getCurrentConversation: () => {
      const state = get();
      const found = state.conversations.find((conv) => conv.id === state.currentConversationId);
      
      console.log('🔍 Getting current conversation:', {
        currentConversationId: state.currentConversationId,
        foundConversation: !!found,
        conversationDetails: found ? {
          id: found.id,
          title: found.title,
          messageCount: found.messages?.length || 0,
          selectedCourse: found.selectedCourse
        } : null,
        allConversationIds: state.conversations.map(c => c.id)
      });
      
      return found || null;
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

    navigateToConversation: (conversationId, course) => {
      if (typeof window !== 'undefined') {
        // Use the new simplified URL structure
        window.location.href = `/${course}/${conversationId}`;
      }
    },

    loadConversation: async (conversationId: string) => {
      const state = get();

      try {
        if (isDatabaseEnabled()) {
          // Check if conversation already exists in store with messages
          const existingConversation = state.conversations.find(c => c.id === conversationId);
          if (existingConversation && existingConversation.messages.length > 0) {
            console.log('✅ Using cached conversation:', conversationId);
            state.setCurrentConversation(conversationId);
            return;
          }

          console.log('📡 Loading conversation from database:', conversationId);
          state.setLoading(true);

          // Load messages for this specific conversation
          const response = await apiCall(`/api/messages?conversationId=${conversationId}`);

          if (response.success && response.data) {
            const messages: Message[] = response.data.map((msg: MessageData) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              sources: msg.sources || [],
              timestamp: new Date(msg.timestamp),
            }));

            // Update or add conversation with loaded messages
            set((state) => {
              const updatedConversations = state.conversations.map((conv) => {
                if (conv.id === conversationId) {
                  return {
                    ...conv,
                    messages,
                    title: response.conversation?.title || conv.title,
                    selectedCourse: response.conversation?.selectedCourse || conv.selectedCourse,
                  };
                }
                return conv;
              });

              // If conversation doesn't exist in store, add it
              if (!updatedConversations.find(c => c.id === conversationId) && response.conversation) {
                updatedConversations.push({
                  id: conversationId,
                  title: response.conversation.title,
                  messages,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  selectedCourse: response.conversation.selectedCourse,
                });
              }

              return {
                conversations: updatedConversations,
                currentConversationId: conversationId,
              };
            });

            console.log('✅ Conversation loaded:', conversationId, `(${messages.length} messages)`);
          }
        } else {
          // Fallback to session storage
          const savedConversations = loadFromSessionStorage();
          const conversation = savedConversations.conversations.find(c => c.id === conversationId);
          if (conversation) {
            state.setCurrentConversation(conversationId);
          }
        }
      } catch (error: unknown) {
        // If conversation not found (404), don't treat it as an error - let caller handle it
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('404') || errorMessage.includes('not found')) {
          console.log('ℹ️ Conversation not found in database:', conversationId);
          throw error; // Re-throw so ChatInterface can create a temp conversation
        } else {
          console.error('❌ Failed to load conversation:', error);
          state.setError('Failed to load conversation');
        }
      } finally {
        state.setLoading(false);
      }
    },

    loadConversations: async () => {
      const state = get();
      state.setLoading(true);
      state.setError(null);

      try {
        if (isDatabaseEnabled()) {
          console.log('📡 Loading conversations from database');

          // Wait for Clerk to be ready before making API calls
          if (typeof window !== 'undefined') {
            let attempts = 0;
            const maxAttempts = 10;

            while (!window.Clerk?.session && attempts < maxAttempts) {
              console.log(`⏳ Waiting for Clerk session... (attempt ${attempts + 1}/${maxAttempts})`);
              await new Promise(resolve => setTimeout(resolve, 100));
              attempts++;
            }

            if (!window.Clerk?.session) {
              console.warn('⚠️ Clerk session not ready after waiting, falling back to SessionStorage');
              const { conversations, currentId } = loadFromSessionStorage();
              set({ conversations, currentConversationId: currentId });
              return;
            }
          }

          const response = await apiCall('/api/conversations');

          // Check if we should fallback to sessionStorage
          if (response.useSessionStorage || response.unauthorized) {
            console.warn('⚠️ Falling back to SessionStorage due to:', response.useSessionStorage ? 'Database not enabled' : 'Unauthorized');
            const { conversations, currentId } = loadFromSessionStorage();
            set({ conversations, currentConversationId: currentId });
            return;
          }

          console.log('📡 Database API response:', {
            success: response.success,
            dataKeys: Object.keys(response.data || {}),
            conversationsLength: response.data?.conversations?.length || 0,
            rawData: response.data
          });

          const conversations: Conversation[] = (response.data?.conversations || []).map((conv: ConversationData) => {
            console.log('🔍 Store loading conversation:', {
              conversationId: conv.id,
              messageCount: (conv.messages || []).length,
              messages: (conv.messages || []).map(msg => ({
                id: msg.id,
                role: msg.role,
                rawTimestamp: msg.timestamp,
                timestampType: typeof msg.timestamp
              }))
            });
            
            return {
              ...conv,
              createdAt: new Date(conv.createdAt),
              updatedAt: new Date(conv.updatedAt),
              messages: (conv.messages || []).map((msg: MessageData) => {
                const convertedTimestamp = new Date(msg.timestamp);
                console.log('🕐 Store timestamp conversion:', {
                  messageId: msg.id,
                  rawTimestamp: msg.timestamp,
                  convertedTimestamp,
                  isValidDate: !isNaN(convertedTimestamp.getTime())
                });
                
                return {
                  ...msg,
                  timestamp: convertedTimestamp
                };
              }),
            };
          });

          // Set the most recent conversation as current if none is selected
          const currentState = get();
          const currentId = currentState.currentConversationId || 
            (conversations.length > 0 ? conversations[0].id : null);

          console.log('📡 Database loaded conversations:', {
            count: conversations.length,
            settingCurrentId: currentId,
            conversationTitles: conversations.map(c => c.title),
            messagesCounts: conversations.map(c => ({ title: c.title, messages: c.messages?.length || 0 })),
            detailedMessages: conversations.map(c => ({
              title: c.title,
              messages: c.messages?.map(m => ({ role: m.role, content: m.content.substring(0, 50), id: m.id })) || []
            }))
          });

          set({ 
            conversations,
            currentConversationId: currentId
          });
          
          console.log('✅ Conversations set in store:', {
            storeConversationCount: get().conversations.length,
            currentConversationId: get().currentConversationId,
            firstConversation: get().conversations[0] ? {
              id: get().conversations[0].id,
              title: get().conversations[0].title,
              messageCount: get().conversations[0].messages?.length || 0
            } : null
          });
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

    getAllConversations: async () => {
      // Alias for loadConversations - used by admin dashboard
      return get().loadConversations();
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