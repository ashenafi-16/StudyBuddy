// Enhanced TypeScript types for the chat system
export interface UserBasic {
  id: number;
  email: string;
  full_name: string;
  username: string;
  profile_pic_url?: string;
  role?: string;
}

export interface GroupBasic {
  id: number;
  group_name: string;
}

export type MessageType = 'text' | 'image' | 'file' | 'system';
export type ConversationType = 'individual' | 'group';

export interface ReplyToInfo {
  message_id: number;
  sender: string;
  content: string;
}

export interface FileInfo {
  name: string;
  url: string;
  size: number;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender: UserBasic;
  sender_name?: string;
  message_type: "text" | "file" | "image" | "system";
  content: string;
  file_attachment?: string | null;
  thumbnail?: string;
  timestamp: string;
  is_read: boolean;
  is_edited: boolean;
  edited_at?: string | null;
  reply_to?: number | null;
  reply_to_info?: ReplyToInfo;
  file_info?: {
    name: string;
    url: string;
    size: number;
  } | null;
}

export interface LastMessage {
  content: string;
  timestamp: string;
  sender: UserBasic;
  message_type: MessageType;
}

export interface Conversation {
  id: number;
  conversation_type: ConversationType;
  group?: GroupBasic;
  group_name?: string;
  other_participant: UserBasic[];
  unread_count: number;
  updated_at: string;
  last_message?: LastMessage;
  created_at?: string;
}

// Request types
export interface SendMessageRequest {
  conversation_id?: number;
  recipient_id?: number;
  content: string;
  message_type?: MessageType;
  reply_to?: number;
  file?: File;
}

export interface StartIndividualChatRequest {
  recipient_id: number;
}

export interface EditMessageRequest {
  content: string;
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'chat_message' | 'typing' | 'read_receipt' | 'user_status';
  message?: Message;
  user_id?: number;
  conversation_id?: number;
  is_typing?: boolean;
  is_online?: boolean;
}

// Typing indicator
export interface TypingIndicator {
  user_id: number;
  user_name: string;
  conversation_id: number;
}

// Message reaction (for future implementation)
export interface MessageReaction {
  id: number;
  message_id: number;
  user: UserBasic;
  emoji: string;
  created_at: string;
}

// UI state types
export interface ChatState {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
  typingUsers: TypingIndicator[];
}

export interface MessageGroup {
  date: string;
  messages: Message[];
}