import { MessageSquare, Clock, Archive, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useConversationStore } from '@/store/conversationStore';
import { formatDistanceToNow } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface ConversationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConversationSidebar({
  isOpen,
  onClose,
}: ConversationSidebarProps) {
  const router = useRouter();
  const {
    conversations,
    currentConversationId,
    setCurrentConversation,
    loadConversations,
  } = useConversationStore();

  const [isLoading, setIsLoading] = useState(true);
  const [loadingConversationId, setLoadingConversationId] = useState<string | null>(null);

  // Load conversations on component mount
  useEffect(() => {
    const initializeConversations = async () => {
      try {
        setIsLoading(true);
        await loadConversations();
      } catch (error) {
        console.error('Failed to load conversations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      initializeConversations();
    }
  }, [isOpen, loadConversations]);

  const handleConversationClick = async (conversation: any) => {
    // Prevent multiple conversations from being opened simultaneously
    if (loadingConversationId) return;

    try {
      setLoadingConversationId(conversation.id);
      const courseId = conversation.selectedCourse || 'nodejs';

      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));

      router.push(`/chat/courses/${courseId}/${conversation.id}`);

      // Keep loading state until navigation completes
      setTimeout(() => {
        setLoadingConversationId(null);
        onClose();
      }, 200);
    } catch (error) {
      console.error('Failed to open conversation:', error);
      setLoadingConversationId(null);
    }
  };

  const getCourseVariant = (course: string) => {
    switch (course) {
      case 'nodejs':
        return 'bg-green-100 text-green-700';
      case 'python':
        return 'bg-emerald-100 text-emerald-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 sm:max-w-80 p-0">
        <div className="flex flex-col h-full">
          {/* Compact Header */}
          <SheetHeader
            className="p-3 pb-2 border-b text-white"
            style={{
              background: 'linear-gradient(to right, rgba(78, 166, 116, 0.95), rgba(69, 144, 113, 0.98), rgba(69, 144, 113, 0.95))'
            }}
          >
            <SheetTitle className="text-left text-white font-medium text-sm">
              Conversations
            </SheetTitle>
            <SheetDescription className="text-left text-white/80 text-xs leading-tight">
              Continue where you left off
            </SheetDescription>
          </SheetHeader>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-20">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-3">
                  <MessageSquare className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">No conversations</h3>
                <p className="text-xs text-gray-500">
                  Start chatting to see history here
                </p>
              </div>
            ) : (
              <div className="overflow-y-auto h-full">
                <div className="p-2 space-y-1">
                  {conversations
                    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                    .map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => handleConversationClick(conversation)}
                        className={cn(
                          "group p-2.5 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-sm hover:border-green-200 relative",
                          conversation.id === currentConversationId
                            ? "bg-green-50 border-green-200 shadow-sm"
                            : "bg-white border-gray-100 hover:bg-green-50/30",
                          loadingConversationId === conversation.id && "opacity-75 pointer-events-none"
                        )}
                      >
                        {/* Loading overlay */}
                        {loadingConversationId === conversation.id && (
                          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-lg flex items-center justify-center z-10">
                            <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Opening...
                            </div>
                          </div>
                        )}

                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            {/* Title and Course inline */}
                            <div className="flex items-center gap-1.5 mb-1">
                              <h4 className="font-medium text-gray-900 truncate text-xs group-hover:text-green-700 transition-colors flex-1">
                                {conversation.title}
                              </h4>
                              {conversation.selectedCourse && (
                                <span className={cn(
                                  "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium",
                                  getCourseVariant(conversation.selectedCourse)
                                )}>
                                  {conversation.selectedCourse === 'nodejs' ? 'JS' : 'PY'}
                                </span>
                              )}
                            </div>

                            {/* Compact metadata */}
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                              <span className="flex items-center gap-0.5">
                                <MessageSquare className="w-2.5 h-2.5" />
                                {conversation.messages?.length || 0}
                              </span>
                              <span className="flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
                              </span>
                            </div>

                            {/* Compact message preview */}
                            {conversation.messages && conversation.messages.length > 0 && (
                              <p className="text-xs text-gray-400 truncate leading-tight">
                                {conversation.messages[conversation.messages.length - 1]?.content?.substring(0, 60) || 'No content'}
                                {conversation.messages[conversation.messages.length - 1]?.content?.length > 60 && '...'}
                              </p>
                            )}
                          </div>

                          {/* Archive indicator or loading state */}
                          <div className="flex-shrink-0 mt-0.5">
                            {loadingConversationId === conversation.id ? (
                              <Loader2 className="w-3 h-3 animate-spin text-green-600" />
                            ) : conversation.archived ? (
                              <Archive className="w-3 h-3 text-gray-400" />
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </SheetContent>
    </Sheet>
  );
}