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
  
  // Actions
  createConversation: (title?: string, course?: 'nodejs' | 'python') => string;
  deleteConversation: (id: string) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateMessage: (conversationId: string, messageId: string, content: string) => void;
  setCurrentConversation: (id: string | null) => void;
  getCurrentConversation: () => Conversation | null;
  setCourseForConversation: (conversationId: string, course: 'nodejs' | 'python') => void;
  clearConversations: () => void;
  
  // Course-specific methods
  getOrCreateConversationForCourse: (course: 'nodejs' | 'python') => string;
  getCurrentConversationForCourse: (course: 'nodejs' | 'python') => Conversation | null;
  
  // SessionStorage persistence
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

const STORAGE_KEY = 'flowmind-conversations';
const CURRENT_CONVERSATION_KEY = 'flowmind-current-conversation';

// Helper functions for sessionStorage
const loadFromSessionStorage = (): { conversations: Conversation[], currentId: string | null } => {
  try {
    const conversationsData = sessionStorage.getItem(STORAGE_KEY);
    const currentId = sessionStorage.getItem(CURRENT_CONVERSATION_KEY);
    
    if (conversationsData) {
      const parsed = JSON.parse(conversationsData);
      // Convert date strings back to Date objects
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

export const useConversationStore = create<ConversationStore>()(
  subscribeWithSelector((set, get) => ({
    conversations: [],
    currentConversationId: null,

    createConversation: (title, course) => {
      const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      
      const courseNames = {
        nodejs: 'Node.js',
        python: 'Python'
      };
      
      const conversation: Conversation = {
        id,
        title: title || `${courseNames[course || 'nodejs']} Chat ${new Date().toLocaleDateString()}`,
        messages: [], // Start with empty messages to allow welcome screen to show
        createdAt: now,
        updatedAt: now,
        selectedCourse: course,
      };

      set((state) => ({
        conversations: [...state.conversations, conversation],
        currentConversationId: id,
      }));

      get().saveToStorage();
      return id;
    },

    deleteConversation: (id) => {
      set((state) => ({
        conversations: state.conversations.filter((conv) => conv.id !== id),
        currentConversationId: state.currentConversationId === id ? null : state.currentConversationId,
      }));
      get().saveToStorage();
    },

    updateConversation: (id, updates) => {
      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.id === id ? { ...conv, ...updates, updatedAt: new Date() } : conv
        ),
      }));
      get().saveToStorage();
    },

    addMessage: (conversationId, message) => {
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
      get().saveToStorage();
    },

    updateMessage: (conversationId, messageId, content) => {
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
      get().saveToStorage();
    },

    setCurrentConversation: (id) => {
      set({ currentConversationId: id });
      get().saveToStorage();
    },

    getCurrentConversation: () => {
      const state = get();
      return state.conversations.find((conv) => conv.id === state.currentConversationId) || null;
    },

    setCourseForConversation: (conversationId, course) => {
      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.id === conversationId ? { ...conv, selectedCourse: course, updatedAt: new Date() } : conv
        ),
      }));
      get().saveToStorage();
    },

    clearConversations: () => {
      set({ conversations: [], currentConversationId: null });
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(CURRENT_CONVERSATION_KEY);
    },

    // Course-specific methods
    getOrCreateConversationForCourse: (course) => {
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
        
        // Set as current and return the ID
        set({ currentConversationId: selectedConv.id });
        get().saveToStorage();
        return selectedConv.id;
      }
      
      // Create new conversation for this course only if none exists
      console.log('🆕 Creating new conversation for course:', course);
      return get().createConversation(undefined, course);
    },

    getCurrentConversationForCourse: (course) => {
      const state = get();
      const currentConv = state.conversations.find(conv => conv.id === state.currentConversationId);
      
      // Return current conversation only if it matches the course
      if (currentConv && currentConv.selectedCourse === course) {
        return currentConv;
      }
      
      return null;
    },

    loadFromStorage: () => {
      const { conversations, currentId } = loadFromSessionStorage();
      set({ conversations, currentConversationId: currentId });
    },

    saveToStorage: () => {
      const state = get();
      saveToSessionStorage(state.conversations, state.currentConversationId);
    },
  }))
);

// Subscribe to state changes and save automatically
useConversationStore.subscribe(
  (state) => state,
  () => {
    // Auto-save on any state change (with debouncing)
    const store = useConversationStore.getState();
    store.saveToStorage();
  }
);

// Initialize store on first load
if (typeof window !== 'undefined') {
  useConversationStore.getState().loadFromStorage();
}