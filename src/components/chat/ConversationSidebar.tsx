import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { useConversationStore } from '@/store/conversationStore';

interface ConversationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConversationSidebar({
  isOpen,
  onClose,
}: ConversationSidebarProps) {
  const {
    conversations,
    currentConversationId,
    // createConversation,
    deleteConversation,
    setCurrentConversation,
    clearConversations,
  } = useConversationStore();

  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // const handleNewConversation = () => {
  //   const newId = createConversation();
  //   setCurrentConversation(newId);
  // };

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConversation(id);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className='fixed inset-0 bg-black/50 z-40'
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{
              duration: 0.35,
              ease: [0.25, 0.46, 0.45, 0.94],
              opacity: { duration: 0.2 },
            }}
            className='fixed left-0 top-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col'>
            {/* Header */}
            <div className='p-4 border-b border-slate-200 bg-gradient-to-r from-purple-600 to-violet-600'>
              <div className='flex items-center justify-between'>
                <h2 className='text-white font-semibold'>Conversations</h2>
                <button
                  onClick={onClose}
                  className='text-white hover:text-purple-200 transition-colors duration-200'>
                  <X className='w-5 h-5' />
                </button>
              </div>
            </div>

            {/* Conversations List */}
            <div className='flex-1 overflow-y-auto'>
              {conversations.length === 0 ? (
                <div className='p-4 text-center text-slate-500'>
                  <MessageSquare className='w-12 h-12 mx-auto mb-2 text-slate-300' />
                  <p className='text-sm'>No conversations yet</p>
                  <p className='text-xs text-slate-400 mt-1'>
                    Start a new chat to begin
                  </p>
                </div>
              ) : (
                <div className='p-2 space-y-1'>
                  {conversations
                    .sort(
                      (a, b) =>
                        new Date(b.updatedAt).getTime() -
                        new Date(a.updatedAt).getTime(),
                    )
                    .map((conversation) => (
                      <motion.div
                        key={conversation.id}
                        whileHover={{
                          x: 3,
                          transition: {
                            duration: 0.15,
                            ease: [0.25, 0.46, 0.45, 0.94],
                          },
                        }}
                        className={`relative p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
                          conversation.id === currentConversationId
                            ? 'bg-purple-50 border border-purple-200'
                            : 'hover:bg-slate-50'
                        }`}
                        onClick={() => {
                          setCurrentConversation(conversation.id);
                          onClose();
                        }}
                        onMouseEnter={() => setHoveredId(conversation.id)}
                        onMouseLeave={() => setHoveredId(null)}>
                        <div className='flex items-start justify-between'>
                          <div className='flex-1 min-w-0'>
                            <div className='flex items-center gap-2 mb-1'>
                              <h3 className='font-medium text-slate-800 truncate flex-1'>
                                {conversation.title}
                              </h3>
                              {conversation.selectedCourse && (
                                <span
                                  className={`
                                  text-xs px-2 py-0.5 rounded-full font-medium
                                  ${
                                    conversation.selectedCourse === 'nodejs'
                                      ? 'bg-green-100 text-green-700'
                                      : conversation.selectedCourse === 'python'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-purple-100 text-purple-700'
                                  }
                                `}>
                                  {conversation.selectedCourse === 'nodejs'
                                    ? 'Node.js'
                                    : conversation.selectedCourse === 'python'
                                    ? 'Python'
                                    : 'Both'}
                                </span>
                              )}
                            </div>
                            <p className='text-xs text-slate-500 mt-1'>
                              {formatDate(new Date(conversation.updatedAt))} •{' '}
                              {conversation.messages.length} messages
                            </p>
                            {conversation.messages.length > 1 && (
                              <p className='text-xs text-slate-400 mt-1 truncate'>
                                {conversation.messages[
                                  conversation.messages.length - 1
                                ].content.substring(0, 50)}
                                ...
                              </p>
                            )}
                          </div>

                          {/* Delete button */}
                          <AnimatePresence>
                            {hoveredId === conversation.id && (
                              <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{
                                  duration: 0.12,
                                  ease: [0.25, 0.46, 0.45, 0.94],
                                }}
                                onClick={(e) =>
                                  handleDeleteConversation(conversation.id, e)
                                }
                                className='p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors duration-200'>
                                <Trash2 className='w-4 h-4' />
                              </motion.button>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {conversations.length > 0 && (
              <div className='p-4 border-t border-slate-200'>
                <button
                  onClick={clearConversations}
                  className='w-full text-sm text-slate-500 hover:text-red-500 transition-colors'>
                  Clear All Conversations
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}