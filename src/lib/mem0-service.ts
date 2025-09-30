import { MemoryClient } from 'mem0ai';

/**
 * Mem0 Service - Personalized Learning Memory Layer
 *
 * Provides:
 * - User learning context tracking
 * - Topic comprehension monitoring
 * - Personalized response adjustment
 * - Study pattern recognition
 */

export interface LearningMemory {
  topics: string[];
  struggledWith: string[];
  masteredTopics: string[];
  learningStyle: 'visual' | 'practical' | 'theoretical' | 'mixed';
  preferredCourse: 'nodejs' | 'python' | 'both';
  lastActiveTopics: string[];
  comprehensionLevel: {
    [topic: string]: 'beginner' | 'intermediate' | 'advanced';
  };
}

export interface ConversationContext {
  userId: string;
  conversationId: string;
  course: 'nodejs' | 'python';
  query: string;
  response?: string;
  topics?: string[];
  timestamp: Date;
}

class Mem0Service {
  private client: MemoryClient | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const apiKey = process.env.MEM0_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ MEM0_API_KEY not configured - memory features disabled');
      return;
    }

    try {
      this.client = new MemoryClient({ apiKey });
      this.initialized = true;
      console.log('✅ Mem0 initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Mem0:', error);
      this.client = null;
    }
  }

  isEnabled(): boolean {
    return this.initialized && this.client !== null;
  }

  /**
   * Store conversation context for learning personalization
   */
  async storeConversation(context: ConversationContext): Promise<void> {
    if (!this.isEnabled()) return;

    try {
      const messages = [
        {
          role: 'user',
          content: context.query
        }
      ];

      if (context.response) {
        messages.push({
          role: 'assistant',
          content: context.response
        });
      }

      await this.client!.add(messages, {
        user_id: context.userId,
        metadata: {
          conversation_id: context.conversationId,
          course: context.course,
          topics: context.topics || [],
          timestamp: context.timestamp.toISOString()
        }
      });

      console.log(`💾 Stored conversation memory for user ${context.userId}`);
    } catch (error) {
      console.error('❌ Error storing conversation:', error);
    }
  }

  /**
   * Retrieve relevant memories for context enrichment
   */
  async getRelevantMemories(userId: string, query: string, limit = 5): Promise<any[]> {
    if (!this.isEnabled()) return [];

    try {
      const memories = await this.client!.search(query, {
        user_id: userId,
        limit
      });

      console.log(`🧠 Retrieved ${memories?.length || 0} relevant memories`);
      return memories || [];
    } catch (error) {
      console.error('❌ Error retrieving memories:', error);
      return [];
    }
  }

  /**
   * Get user's learning profile
   */
  async getUserLearningProfile(userId: string): Promise<LearningMemory | null> {
    if (!this.isEnabled()) return null;

    try {
      const memories = await this.client!.getAll({
        user_id: userId
      });

      if (!memories || memories.length === 0) {
        return this.createDefaultProfile();
      }

      // Analyze memories to build learning profile
      return this.analyzeLearningPattern(memories);
    } catch (error) {
      console.error('❌ Error getting learning profile:', error);
      return null;
    }
  }

  /**
   * Update user's comprehension level for a topic
   */
  async updateTopicComprehension(
    userId: string,
    topic: string,
    level: 'beginner' | 'intermediate' | 'advanced',
    struggledWith?: boolean
  ): Promise<void> {
    if (!this.isEnabled()) return;

    try {
      const updateMessage = struggledWith
        ? `User struggled with ${topic} but is learning`
        : `User demonstrated ${level} understanding of ${topic}`;

      await this.client!.add([
        {
          role: 'system',
          content: updateMessage
        }
      ], {
        user_id: userId,
        metadata: {
          type: 'comprehension_update',
          topic,
          level,
          struggledWith: struggledWith || false,
          timestamp: new Date().toISOString()
        }
      });

      console.log(`📈 Updated comprehension: ${topic} -> ${level}`);
    } catch (error) {
      console.error('❌ Error updating comprehension:', error);
    }
  }

  /**
   * Get personalized context for query
   */
  async getPersonalizedContext(userId: string, query: string, course: string): Promise<string> {
    if (!this.isEnabled()) return '';

    try {
      const memories = await this.getRelevantMemories(userId, query, 3);
      const profile = await this.getUserLearningProfile(userId);

      if (!memories.length && !profile) return '';

      let context = '\n\n--- User Learning Context ---\n';

      if (profile) {
        context += `Learning Style: ${profile.learningStyle}\n`;
        if (profile.struggledWith.length > 0) {
          context += `Previously struggled with: ${profile.struggledWith.slice(0, 3).join(', ')}\n`;
        }
        if (profile.masteredTopics.length > 0) {
          context += `Has mastered: ${profile.masteredTopics.slice(0, 3).join(', ')}\n`;
        }
      }

      if (memories.length > 0) {
        context += `\nRecent related learning:\n`;
        memories.slice(0, 2).forEach((mem: any, idx: number) => {
          context += `${idx + 1}. ${mem.memory || mem.content}\n`;
        });
      }

      context += '--- End Context ---\n\n';
      context += 'Adjust your explanation based on the user\'s learning history and style.\n';

      return context;
    } catch (error) {
      console.error('❌ Error getting personalized context:', error);
      return '';
    }
  }

  /**
   * Clear user's memory (GDPR compliance)
   */
  async clearUserMemory(userId: string): Promise<void> {
    if (!this.isEnabled()) return;

    try {
      await this.client!.deleteAll({ user_id: userId });
      console.log(`🗑️ Cleared all memories for user ${userId}`);
    } catch (error) {
      console.error('❌ Error clearing memory:', error);
    }
  }

  // Private helper methods

  private createDefaultProfile(): LearningMemory {
    return {
      topics: [],
      struggledWith: [],
      masteredTopics: [],
      learningStyle: 'mixed',
      preferredCourse: 'nodejs',
      lastActiveTopics: [],
      comprehensionLevel: {}
    };
  }

  private analyzeLearningPattern(memories: any[]): LearningMemory {
    const profile = this.createDefaultProfile();

    // Analyze memories to extract patterns
    const topicCounts = new Map<string, number>();
    const struggledTopics = new Set<string>();
    const masteredTopics = new Set<string>();

    memories.forEach((memory: any) => {
      const metadata = memory.metadata || {};

      // Track topics
      if (metadata.topics && Array.isArray(metadata.topics)) {
        metadata.topics.forEach((topic: string) => {
          topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
        });
      }

      // Identify struggled topics
      if (metadata.struggledWith) {
        struggledTopics.add(metadata.topic);
      }

      // Identify mastered topics (mentioned 5+ times with advanced level)
      if (metadata.level === 'advanced' && metadata.topic) {
        const count = topicCounts.get(metadata.topic) || 0;
        if (count >= 5) {
          masteredTopics.add(metadata.topic);
        }
      }

      // Determine preferred course
      if (metadata.course) {
        profile.preferredCourse = metadata.course;
      }
    });

    profile.topics = Array.from(topicCounts.keys())
      .sort((a, b) => (topicCounts.get(b) || 0) - (topicCounts.get(a) || 0));

    profile.struggledWith = Array.from(struggledTopics);
    profile.masteredTopics = Array.from(masteredTopics);
    profile.lastActiveTopics = profile.topics.slice(0, 5);

    return profile;
  }
}

// Singleton instance
export const mem0Service = new Mem0Service();