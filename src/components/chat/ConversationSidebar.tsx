import { MessageSquare, Clock, Archive, Loader2, Trash2, ChevronDown, AlertTriangle } from 'lucide-react';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
    deleteConversation,
  } = useConversationStore();

  const [isLoading, setIsLoading] = useState(true);
  const [loadingConversationId, setLoadingConversationId] = useState<string | null>(null);
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  const [expandedAccordions, setExpandedAccordions] = useState<string[]>([]);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    isOpen: boolean;
    conversationId: string | null;
    conversationTitle: string;
  }>({
    isOpen: false,
    conversationId: null,
    conversationTitle: '',
  });

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
    if (loadingConversationId || deletingConversationId) return;

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

  const handleDeleteClick = (conversationId: string, conversationTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deletingConversationId || loadingConversationId) return;

    setDeleteConfirmDialog({
      isOpen: true,
      conversationId,
      conversationTitle,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmDialog.conversationId) return;

    try {
      setDeletingConversationId(deleteConfirmDialog.conversationId);
      await deleteConversation(deleteConfirmDialog.conversationId);

      // Close dialog
      setDeleteConfirmDialog({
        isOpen: false,
        conversationId: null,
        conversationTitle: '',
      });
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    } finally {
      setDeletingConversationId(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmDialog({
      isOpen: false,
      conversationId: null,
      conversationTitle: '',
    });
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

  const getCourseName = (course: string) => {
    switch (course) {
      case 'nodejs':
        return 'Node.js';
      case 'python':
        return 'Python';
      default:
        return 'General';
    }
  };

  // Group conversations by course
  const groupedConversations = conversations.reduce((acc, conversation) => {
    const course = conversation.selectedCourse || 'nodejs';
    if (!acc[course]) {
      acc[course] = [];
    }
    acc[course].push(conversation);
    return acc;
  }, {} as Record<string, typeof conversations>);

  // Sort conversations within each group by updatedAt
  Object.keys(groupedConversations).forEach(course => {
    groupedConversations[course].sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  });

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
                <Accordion
                  type="multiple"
                  value={expandedAccordions}
                  onValueChange={setExpandedAccordions}
                  className="px-2 py-1 space-y-2"
                >
                  {Object.entries(groupedConversations).map(([course, courseConversations]) => (
                    <AccordionItem
                      key={course}
                      value={course}
                      className="border-none bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <AccordionTrigger className="py-2 px-3 hover:no-underline rounded-lg">
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                          <div className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium border",
                            course === 'nodejs'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          )}>
                            {courseConversations.length}
                          </div>
                          <span className="text-gray-800">{getCourseName(course)}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2 pt-1 px-3">
                        <div className="space-y-1.5">
                          {courseConversations.map((conversation, index) => (
                            <div
                              key={conversation.id}
                              onClick={() => handleConversationClick(conversation)}
                              className={cn(
                                "group p-2 rounded-md transition-all duration-300 cursor-pointer relative",
                                conversation.id === currentConversationId
                                  ? "bg-gradient-to-r from-green-50 to-emerald-50 shadow-sm ring-1 ring-green-200"
                                  : "bg-gray-50/50 hover:bg-gradient-to-r hover:from-green-50/50 hover:to-emerald-50/50 hover:shadow-sm",
                                (loadingConversationId === conversation.id || deletingConversationId === conversation.id) && "opacity-75 pointer-events-none",
                                deletingConversationId === conversation.id && "animate-pulse scale-95"
                              )}
                            >
                              {/* Loading overlay */}
                              {loadingConversationId === conversation.id && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-md flex items-center justify-center z-10">
                                  <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Opening...
                                  </div>
                                </div>
                              )}

                              {/* Deleting overlay */}
                              {deletingConversationId === conversation.id && (
                                <div className="absolute inset-0 bg-red-50/90 backdrop-blur-[2px] rounded-md flex items-center justify-center z-10 border border-red-200">
                                  <div className="flex items-center gap-2 text-xs text-red-600 font-medium bg-white/80 px-2 py-1 rounded-full shadow-sm">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Deleting...
                                  </div>
                                </div>
                              )}

                              <div className="flex items-start gap-2.5">
                                {/* Beautiful Number - Smaller Size */}
                                <div className={cn(
                                  "w-4 h-4 rounded-full flex items-center justify-center text-xs font-medium text-white flex-shrink-0 mt-1",
                                  course === 'nodejs' ? 'bg-green-500' : 'bg-emerald-500'
                                )}>
                                  {index + 1}
                                </div>

                                <div className="flex-1 min-w-0">
                                  {/* Title */}
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <h4 className="font-medium text-gray-900 truncate text-xs group-hover:text-green-700 transition-colors flex-1">
                                      {conversation.title}
                                    </h4>
                                  </div>

                                  {/* Compact metadata */}
                                  <div className="flex items-center gap-3 text-xs mb-1">
                                    <span className="flex items-center gap-0.5 text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                                      <MessageSquare className="w-2.5 h-2.5" />
                                      <span className="font-medium">{conversation.messages?.length || 0}</span>
                                    </span>
                                    <span className="flex items-center gap-0.5 text-gray-400">
                                      <Clock className="w-2.5 h-2.5" />
                                      <span className="text-gray-500">
                                        {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
                                      </span>
                                    </span>
                                  </div>

                                  {/* Compact message preview */}
                                  {conversation.messages && conversation.messages.length > 0 && (
                                    <p className="text-xs text-gray-400 truncate leading-tight">
                                      {conversation.messages[conversation.messages.length - 1]?.content?.substring(0, 55) || 'No content'}
                                      {conversation.messages[conversation.messages.length - 1]?.content?.length > 55 && '...'}
                                    </p>
                                  )}
                                </div>

                                {/* Actions */}
                                <div className="flex-shrink-0 mt-0.5 flex items-center gap-1">
                                  {deletingConversationId === conversation.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin text-red-600" />
                                  ) : (
                                    <button
                                      onClick={(e) => handleDeleteClick(conversation.id, conversation.title, e)}
                                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all duration-200"
                                      title="Delete conversation"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}

                                  {conversation.archived && (
                                    <Archive className="w-3 h-3 text-gray-400" />
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
          </div>
        </div>
      </SheetContent>

      {/* Confirmation Dialog */}
      <Dialog open={deleteConfirmDialog.isOpen} onOpenChange={handleCancelDelete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Conversation
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to delete this conversation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 p-3 bg-gray-50 rounded-lg border-l-4 border-red-200">
            <p className="text-sm font-medium text-gray-800 truncate">
              "{deleteConfirmDialog.conversationTitle}"
            </p>
            <p className="text-xs text-gray-500 mt-1">
              All messages and data will be permanently deleted.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <button
              onClick={handleCancelDelete}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              disabled={!!deletingConversationId}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={!!deletingConversationId}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {deletingConversationId === deleteConfirmDialog.conversationId ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}