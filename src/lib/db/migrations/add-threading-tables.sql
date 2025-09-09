-- Threading System Migration: Add tables for conversation threading and tracing
-- Execute this migration after the main schema is established

-- Conversation Threads Table
CREATE TABLE IF NOT EXISTS conversation_threads (
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT fk_conversation_threads_conversation 
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_conversation_threads_parent 
    FOREIGN KEY (branched_from_thread_id) REFERENCES conversation_threads(id) ON DELETE SET NULL
);

-- Message Traces Table - Tracks message lineage and relationships
CREATE TABLE IF NOT EXISTS message_traces (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  message_id TEXT NOT NULL UNIQUE,
  conversation_id TEXT NOT NULL,
  thread_id TEXT NOT NULL,
  parent_message_id TEXT,
  depth INTEGER DEFAULT 0,
  position INTEGER DEFAULT 0,
  lineage JSONB DEFAULT '[]'::jsonb,
  branch_count INTEGER DEFAULT 0,
  
  -- Branch point information
  is_branch_point BOOLEAN DEFAULT false,
  original_message_id TEXT,
  
  -- Message metadata flags
  is_regenerated_response BOOLEAN DEFAULT false,
  is_edited_message BOOLEAN DEFAULT false,
  is_alternative_response BOOLEAN DEFAULT false,
  
  -- User feedback
  user_feedback JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT fk_message_traces_conversation 
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_message_traces_thread 
    FOREIGN KEY (thread_id) REFERENCES conversation_threads(id) ON DELETE CASCADE,
  CONSTRAINT fk_message_traces_parent 
    FOREIGN KEY (parent_message_id) REFERENCES message_traces(message_id) ON DELETE SET NULL,
  CONSTRAINT fk_message_traces_message
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

-- Thread Actions Table - Audit log for threading operations
CREATE TABLE IF NOT EXISTS thread_actions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id TEXT NOT NULL,
  thread_id TEXT,
  message_id TEXT,
  action_type TEXT NOT NULL,
  action_data JSONB DEFAULT '{}'::jsonb,
  user_id TEXT NOT NULL,
  
  -- Undo support
  reversible BOOLEAN DEFAULT false,
  undo_data JSONB DEFAULT '{}'::jsonb,
  is_undone BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT fk_thread_actions_conversation 
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_thread_actions_thread 
    FOREIGN KEY (thread_id) REFERENCES conversation_threads(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_conversation_threads_conversation_id ON conversation_threads(conversation_id);
CREATE INDEX idx_conversation_threads_is_main_thread ON conversation_threads(is_main_thread);
CREATE INDEX idx_conversation_threads_is_active ON conversation_threads(is_active);
CREATE INDEX idx_conversation_threads_updated_at ON conversation_threads(updated_at);

CREATE INDEX idx_message_traces_message_id ON message_traces(message_id);
CREATE INDEX idx_message_traces_conversation_id ON message_traces(conversation_id);
CREATE INDEX idx_message_traces_thread_id ON message_traces(thread_id);
CREATE INDEX idx_message_traces_parent_message_id ON message_traces(parent_message_id);
CREATE INDEX idx_message_traces_depth ON message_traces(depth);
CREATE INDEX idx_message_traces_is_branch_point ON message_traces(is_branch_point);

CREATE INDEX idx_thread_actions_conversation_id ON thread_actions(conversation_id);
CREATE INDEX idx_thread_actions_thread_id ON thread_actions(thread_id);
CREATE INDEX idx_thread_actions_user_id ON thread_actions(user_id);
CREATE INDEX idx_thread_actions_created_at ON thread_actions(created_at);
CREATE INDEX idx_thread_actions_action_type ON thread_actions(action_type);

-- Create updated_at triggers for conversation_threads
CREATE OR REPLACE FUNCTION update_conversation_threads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_conversation_threads_updated_at
  BEFORE UPDATE ON conversation_threads
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_threads_updated_at();

-- Create updated_at triggers for message_traces  
CREATE OR REPLACE FUNCTION update_message_traces_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_message_traces_updated_at
  BEFORE UPDATE ON message_traces
  FOR EACH ROW
  EXECUTE FUNCTION update_message_traces_updated_at();