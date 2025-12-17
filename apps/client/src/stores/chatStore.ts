/**
 * Chat Store - Zustand State Management
 *
 * Manages all chat-related state on the frontend:
 * - Conversations list
 * - Current conversation
 * - Messages in current conversation
 * - Message statuses (delivered, read, reactions)
 * - Typing indicators
 * - Presence information
 * - UI state (loading, errors)
 *
 * ============================
 * STATE DESIGN PATTERNS
 * ============================
 *
 * 1. Normalized State:
 *    Instead of nested objects, we use IDs and lookup maps
 *    This makes updates efficient and prevents duplication
 *
 *    Bad:  conversations = [{ id: 1, messages: [{...}, {...}] }]
 *    Good: conversations = [{ id: 1, messageIds: [1, 2] }]
 *          messagesById = { 1: {...}, 2: {...} }
 *
 * 2. Immutable Updates:
 *    Always create new objects/arrays instead of mutating
 *    This ensures React detects changes properly
 *
 * 3. Separation of Concerns:
 *    UI state (loading, errors) is separate from domain state (messages, users)
 *    This prevents coupling between UI concerns and business logic
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================
// TYPE DEFINITIONS
// ============================

interface Conversation {
  id: string;
  type: 'direct' | 'group';
  title?: string;
  description?: string;
  avatar_url?: string;
  created_by: string;
  is_active: boolean;
  last_message_at?: Date;
  participant_count: number;
  participants: Array<{
    user_id: string;
    username: string;
    role: 'admin' | 'moderator' | 'member';
    joined_at: Date;
  }>;
  lastMessageId?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_username: string;
  content_encrypted: string;
  message_type: 'text' | 'image' | 'file' | 'system' | 'voice';
  reply_to_id?: string;
  metadata?: Record<string, any>;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

interface MessageStatus {
  message_id: string;
  user_id: string;
  status_type: 'sent' | 'delivered' | 'read';
}

interface TypingUser {
  userId: string;
  username: string;
  conversationId: string;
  isTyping: boolean;
}

interface UserPresence {
  userId: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: Date;
}

interface ChatState {
  // Conversation state
  conversations: Conversation[];
  currentConversationId: string | null;
  conversationLoading: boolean;
  conversationError: string | null;

  // Message state
  // messagesById: normalized map for efficient lookups
  // messageIdsInConversation: array of message IDs in current conversation
  messagesById: Record<string, Message>;
  messageIdsInConversation: string[];
  messageLoading: boolean;
  messageError: string | null;

  // Message status state
  messageStatusesById: Record<string, MessageStatus[]>;

  // Presence state
  userPresenceById: Record<string, UserPresence>;

  // Typing indicators
  typingUsersInConversation: TypingUser[];

  // UI state
  optimisticMessageIds: Set<string>; // Messages sent but not yet confirmed
  isSendingMessage: boolean;
  sendError: string | null;

  // ============================
  // ACTIONS
  // ============================

  // Conversation actions
  setConversations: (conversations: Conversation[]) => void;
  setCurrentConversation: (conversationId: string) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversationId: string, updates: Partial<Conversation>) => void;

  // Message actions
  addMessage: (message: Message) => void;
  addMessages: (messages: Message[]) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (messageId: string) => void;
  clearMessagesForConversation: (conversationId: string) => void;

  // Message status actions
  updateMessageStatus: (messageId: string, status: MessageStatus) => void;
  addMessageReaction: (messageId: string, userId: string, emoji: string) => void;

  // Presence actions
  setUserPresence: (userId: string, presence: UserPresence) => void;
  setUserOnline: (userId: string, username: string) => void;
  setUserOffline: (userId: string) => void;

  // Typing actions
  addTypingUser: (user: TypingUser) => void;
  removeTypingUser: (userId: string, conversationId: string) => void;

  // Optimistic update actions
  addOptimisticMessage: (tempId: string, message: Message) => void;
  confirmMessageSent: (tempId: string, realId: string) => void;

  // Error handling
  setMessageError: (error: string | null) => void;
  setConversationError: (error: string | null) => void;
  setSendError: (error: string | null) => void;

  // Loading states
  setConversationLoading: (loading: boolean) => void;
  setMessageLoading: (loading: boolean) => void;
  setIsSendingMessage: (sending: boolean) => void;

  // Reset
  resetChatState: () => void;
}

// ============================
// INITIAL STATE
// ============================

const initialState = {
  conversations: [],
  currentConversationId: null,
  conversationLoading: false,
  conversationError: null,

  messagesById: {},
  messageIdsInConversation: [],
  messageLoading: false,
  messageError: null,

  messageStatusesById: {},
  userPresenceById: {},
  typingUsersInConversation: [],

  optimisticMessageIds: new Set(),
  isSendingMessage: false,
  sendError: null,
};

// ============================
// STORE CREATION
// ============================

export const useChatStore = create<ChatState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // ============================
      // CONVERSATION ACTIONS
      // ============================

      setConversations: (conversations: Conversation[]) => {
        set({ conversations });
      },

      setCurrentConversation: (conversationId: string) => {
        const { messageIdsInConversation } = get();
        // Clear old messages when switching conversations
        if (messageIdsInConversation.length > 0) {
          set({ messageIdsInConversation: [] });
        }
        set({ currentConversationId: conversationId });
      },

      addConversation: (conversation: Conversation) => {
        const { conversations } = get();
        // Avoid duplicates
        if (conversations.some((c) => c.id === conversation.id)) {
          return;
        }
        set({ conversations: [conversation, ...conversations] });
      },

      updateConversation: (conversationId: string, updates: Partial<Conversation>) => {
        const { conversations } = get();
        set({
          conversations: conversations.map((c) => (c.id === conversationId ? { ...c, ...updates } : c)),
        });
      },

      // ============================
      // MESSAGE ACTIONS
      // ============================

      addMessage: (message: Message) => {
        const { messagesById, messageIdsInConversation, currentConversationId } = get();

        // Only add if it's for the current conversation
        if (message.conversation_id !== currentConversationId) {
          return;
        }

        // Avoid duplicates
        if (messagesById[message.id]) {
          return;
        }

        set({
          messagesById: { ...messagesById, [message.id]: message },
          messageIdsInConversation: [...messageIdsInConversation, message.id],
        });
      },

      addMessages: (messages: Message[]) => {
        const { messagesById, messageIdsInConversation, currentConversationId } = get();

        const newMessages: Record<string, Message> = { ...messagesById };
        let newMessageIds = [...messageIdsInConversation];

        messages.forEach((msg) => {
          // Only add messages for current conversation
          if (msg.conversation_id !== currentConversationId) {
            return;
          }

          // Avoid duplicates
          if (!newMessages[msg.id]) {
            newMessages[msg.id] = msg;
            newMessageIds.push(msg.id);
          }
        });

        set({
          messagesById: newMessages,
          messageIdsInConversation: newMessageIds,
        });
      },

      updateMessage: (messageId: string, updates: Partial<Message>) => {
        const { messagesById } = get();

        if (!messagesById[messageId]) {
          return;
        }

        set({
          messagesById: {
            ...messagesById,
            [messageId]: { ...messagesById[messageId], ...updates },
          },
        });
      },

      deleteMessage: (messageId: string) => {
        const { messagesById, messageIdsInConversation } = get();

        if (!messagesById[messageId]) {
          return;
        }

        // Create new object without deleted message
        const newMessagesById = { ...messagesById };
        delete newMessagesById[messageId];

        set({
          messagesById: newMessagesById,
          messageIdsInConversation: messageIdsInConversation.filter((id) => id !== messageId),
        });
      },

      clearMessagesForConversation: (conversationId: string) => {
        const { messagesById, messageIdsInConversation } = get();

        // Remove all messages from this conversation
        const messageIdsToRemove = messageIdsInConversation.filter((id) => {
          return messagesById[id]?.conversation_id === conversationId;
        });

        const newMessagesById = { ...messagesById };
        messageIdsToRemove.forEach((id) => delete newMessagesById[id]);

        set({
          messagesById: newMessagesById,
          messageIdsInConversation: messageIdsInConversation.filter((id) => !messageIdsToRemove.includes(id)),
        });
      },

      // ============================
      // MESSAGE STATUS ACTIONS
      // ============================

      updateMessageStatus: (messageId: string, status: MessageStatus) => {
        const { messageStatusesById } = get();

        set({
          messageStatusesById: {
            ...messageStatusesById,
            [messageId]: [
              ...(messageStatusesById[messageId] || []).filter((s) => s.user_id !== status.user_id),
              status,
            ],
          },
        });
      },

      addMessageReaction: (messageId: string, userId: string, emoji: string) => {
        const { messageStatusesById } = get();
        const statuses = messageStatusesById[messageId] || [];

        // Find or create reaction status
        const reactionStatus = statuses.find((s) => s.user_id === userId && s.status_type === 'reaction');

        if (reactionStatus) {
          // Update existing reaction
          set({
            messageStatusesById: {
              ...messageStatusesById,
              [messageId]: statuses.map((s) =>
                s === reactionStatus ? { ...s, status_type: 'reaction' as const } : s
              ),
            },
          });
        } else {
          // Add new reaction
          set({
            messageStatusesById: {
              ...messageStatusesById,
              [messageId]: [
                ...statuses,
                { message_id: messageId, user_id: userId, status_type: 'reaction' as const },
              ],
            },
          });
        }
      },

      // ============================
      // PRESENCE ACTIONS
      // ============================

      setUserPresence: (userId: string, presence: UserPresence) => {
        const { userPresenceById } = get();

        set({
          userPresenceById: {
            ...userPresenceById,
            [userId]: presence,
          },
        });
      },

      setUserOnline: (userId: string, username: string) => {
        const { userPresenceById } = get();

        set({
          userPresenceById: {
            ...userPresenceById,
            [userId]: {
              userId,
              status: 'online',
            },
          },
        });
      },

      setUserOffline: (userId: string) => {
        const { userPresenceById } = get();

        set({
          userPresenceById: {
            ...userPresenceById,
            [userId]: {
              ...userPresenceById[userId],
              status: 'offline',
              lastSeen: new Date(),
            },
          },
        });
      },

      // ============================
      // TYPING ACTIONS
      // ============================

      addTypingUser: (user: TypingUser) => {
        const { typingUsersInConversation } = get();

        // Remove if already typing (update)
        const filtered = typingUsersInConversation.filter(
          (u) => !(u.userId === user.userId && u.conversationId === user.conversationId)
        );

        if (user.isTyping) {
          set({ typingUsersInConversation: [...filtered, user] });
        } else {
          set({ typingUsersInConversation: filtered });
        }
      },

      removeTypingUser: (userId: string, conversationId: string) => {
        const { typingUsersInConversation } = get();

        set({
          typingUsersInConversation: typingUsersInConversation.filter(
            (u) => !(u.userId === userId && u.conversationId === conversationId)
          ),
        });
      },

      // ============================
      // OPTIMISTIC UPDATE ACTIONS
      // ============================

      addOptimisticMessage: (tempId: string, message: Message) => {
        const { messagesById, messageIdsInConversation, optimisticMessageIds } = get();

        const optimistic = { ...message, id: tempId };

        set({
          messagesById: { ...messagesById, [tempId]: optimistic },
          messageIdsInConversation: [...messageIdsInConversation, tempId],
          optimisticMessageIds: new Set([...optimisticMessageIds, tempId]),
        });
      },

      confirmMessageSent: (tempId: string, realId: string) => {
        const { messagesById, messageIdsInConversation, optimisticMessageIds } = get();

        const tempMessage = messagesById[tempId];
        if (!tempMessage) return;

        // Replace temp ID with real ID
        const newMessagesById = { ...messagesById };
        newMessagesById[realId] = { ...tempMessage, id: realId };
        delete newMessagesById[tempId];

        const newMessageIds = messageIdsInConversation.map((id) => (id === tempId ? realId : id));

        const newOptimisticIds = new Set(optimisticMessageIds);
        newOptimisticIds.delete(tempId);

        set({
          messagesById: newMessagesById,
          messageIdsInConversation: newMessageIds,
          optimisticMessageIds: newOptimisticIds,
        });
      },

      // ============================
      // ERROR HANDLING
      // ============================

      setMessageError: (error: string | null) => {
        set({ messageError: error });
      },

      setConversationError: (error: string | null) => {
        set({ conversationError: error });
      },

      setSendError: (error: string | null) => {
        set({ sendError: error });
      },

      // ============================
      // LOADING STATES
      // ============================

      setConversationLoading: (loading: boolean) => {
        set({ conversationLoading: loading });
      },

      setMessageLoading: (loading: boolean) => {
        set({ messageLoading: loading });
      },

      setIsSendingMessage: (sending: boolean) => {
        set({ isSendingMessage: sending });
      },

      // ============================
      // RESET
      // ============================

      resetChatState: () => {
        set(initialState);
      },
    }),
    { name: 'ChatStore' }
  )
);

// ============================
// SELECTORS
// ============================

/**
 * Selectors are functions that extract specific slices of state
 * They help prevent unnecessary re-renders by allowing components
 * to only subscribe to the specific state they need
 */

export const selectCurrentConversationMessages = (state: ChatState) => {
  return state.messageIdsInConversation.map((id) => state.messagesById[id]).filter(Boolean);
};

export const selectTypingUsersForConversation = (state: ChatState, conversationId: string) => {
  return state.typingUsersInConversation.filter((u) => u.conversationId === conversationId);
};

export const selectUserPresenceStatus = (state: ChatState, userId: string) => {
  return state.userPresenceById[userId]?.status || 'offline';
};

export const selectMessageStatus = (state: ChatState, messageId: string) => {
  return state.messageStatusesById[messageId] || [];
};
