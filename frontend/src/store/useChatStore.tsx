import { create } from "zustand";
import toast from "react-hot-toast";
import api from "../services/api";
import { WS_BASE } from "../api/apiClient";

export interface User {
  id: number;
  full_name?: string;
  username?: string;
  email: string;
  profile_pic_url?: string;
}

export interface Message {
  id: number | string;
  content: string;
  message_type: "text" | "file" | "image";
  file_attachment: string | null;
  file_info?: {
    name: string;
    size: number;
  };
  timestamp: string;
  sender: User;
  conversation_id?: number;
  is_read?: boolean;
  reply_to?: number | null;
  reply_to_info?: {
    message_id: number;
    sender: string;
    content: string;
  } | null;
}

export interface Contact {
  id: number;
  full_name: string;
  unread_count: number;
  updated_at: string;
  type: "individual" | "group";
  members?: User[],
  group_name?: string;
  total_members?: number;
  group_profile_pic?: string
}

interface SendMessageInput {
  text?: string;
  file?: File | null;
  currentUser: User;
}

interface ChatStoreState {
  allContacts: Contact[];
  chats: Contact[];
  messages: Message[];
  activeTab: string;

  onlineUsers: Set<number>;
  typingUsers: Set<number>;

  selectedUser: Contact | null;
  socket: WebSocket | null;

  replyToMessage: Message | null;
  
  isUsersLoading: boolean;
  isMessagesLoading: boolean;
  isSoundEnabled: boolean;
  
  setUserOnline: (userId: number) => void;
  setUserOffline: (userId: number) => void;

  setUserTyping: (userId: number) => void;
  clearUserTyping: (userId: number) => void;

  toggleSound: () => void;
  setActiveTab: (tab: string) => void;
  setSelectedUser: (user: Contact | null) => void;
  sendTyping: () => void;
  setReplyTo: (message: Message | null) => void;
  clearReplyTo: () => void;

  getAllGroupContacts: () => Promise<void>;
  getAllIndividualContacts: () => Promise<void>;
  getMessageByConvId: (convId?: number) => Promise<void>;
  connectPresenceSocket: (token: string) => void;
  sendMessage: (data: SendMessageInput) => Promise<void>;
  handleWebSocketMessage: (message: Message) => void;
}
export const useChatStore = create<ChatStoreState>((set, get) => ({
  allContacts: [],
  chats: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  onlineUsers: new Set(),
  typingUsers: new Set(),
  socket: null,
  replyToMessage: null,

  connectPresenceSocket: (token: string) => {
    if (!token) return;

    const ws = new WebSocket(
      `${WS_BASE}/ws/online/?token=${token}`
    );

    ws.onopen = () => {
      console.log("[PRESENCE WS] Connected");
      set({socket: ws});
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("data; ", data)
     
      if (Array.isArray(data.users)) {
        set({ onlineUsers: new Set<number>(data.users) });
      }

      if (data.type === "online") {
        get().setUserOnline(data.user_id);
      }

      if (data.type === "offline") {
        get().setUserOffline(data.user_id);
      }
      console.log("data --- type; ", data.type)
      if (data.type === "typing") {
        console.log("Typing received:", data.user_id);

        get().setUserTyping(data.user_id);
        setTimeout(() => {
          get().clearUserTyping(data.user_id);
        }, 3000);
      }
    };

    ws.onclose = () => {
      console.warn("[PRESENCE WS] Disconnected — reconnecting...");
      setTimeout(() => get().connectPresenceSocket(token), 2000);
    };

    ws.onerror = () => {
      ws.close();
    };
  },
   

  setUserOnline: (userId) =>
    set(state => {
      const updated = new Set(state.onlineUsers);
      updated.add(userId);
      return { onlineUsers: updated };
    }),

  setUserOffline: (userId) =>
    set(state => {
      const updated = new Set(state.onlineUsers);
      updated.delete(userId);
      return { onlineUsers: updated };
    }),

  setUserTyping: (userId) =>
    set(state => {
      const updated = new Set(state.typingUsers);
      updated.add(userId);
      console.log("Typing users now:", Array.from(updated));

      return { typingUsers: updated };
    }),

  clearUserTyping: (userId) =>
    set(state => {
      const updated = new Set(state.typingUsers);
      updated.delete(userId);
      return { typingUsers: updated };
    }),

  isSoundEnabled:
    JSON.parse(localStorage.getItem("isSoundEnabled") ?? "false") === true,

  toggleSound: () => {
    const newState = !get().isSoundEnabled;
    localStorage.setItem("isSoundEnabled", JSON.stringify(newState));
    set({ isSoundEnabled: newState });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setReplyTo: (message) => set({ replyToMessage: message }),
  clearReplyTo: () => set({ replyToMessage: null }),
  setSelectedUser: (user) => {
    set(state => ({
      selectedUser: user,
      replyToMessage: null,
      chats: state.chats.map(chat => 
        chat.id === user?.id ? {...chat, unread_count: 0}: chat
      )
    }));
    // load messages for converstion
    if (user?.id) get().getMessageByConvId(user.id);
  },

  // Fetch group contacts
  getAllGroupContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await api.get("/conversations/group_list/");
      set({ allContacts: res.data || [] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load groups");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // Fetch individual contacts
  getAllIndividualContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await api.get("/conversations/individual_list/");
      set({ chats: res.data || [] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load chats");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // Fetch messages for a conversation
  getMessageByConvId: async (convId) => {
    const selected = get().selectedUser;
    const id = convId ?? selected?.id;
    if (!id) return;

    set({ isMessagesLoading: true });

    try {
      const res = await api.get("/messages/", {
        params: { conversation_id: id },
      });

      set({ messages: res.data || [] });
    } catch (err) {
      toast.error("Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendTyping: () => {
    const socket = get().socket;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    socket.send(
      JSON.stringify({
        type: "typing",
      })
    );
  },

  sendMessage: async ({ text = "", file, currentUser }) => {
    const { selectedUser, replyToMessage } = get();
    if (!selectedUser) {
      toast.error("No conversation selected");
      return;
    }

    const tempId = `temp-${Date.now()}`;

    try {
      const formData = new FormData();
      formData.append("conversation_id", String(selectedUser.id));
      formData.append("content", text);

      if (replyToMessage) {
        formData.append("reply_to", String(replyToMessage.id));
      }

      let messageType: "text" | "file" | "image" = "text";
      if (file) {
        const filename = file.name.toLowerCase();
        const isImage = /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(filename);
        messageType = isImage ? "image" : "file";
        formData.append("file_upload", file);
      }
      formData.append("message_type", messageType);

      // Optimistic message
      const optimisticMessage: Message = {
        id: tempId,
        content: text,
        message_type: messageType,
        file_attachment: file ? URL.createObjectURL(file) : null,
        timestamp: new Date().toISOString(),
        sender: currentUser,
        reply_to: replyToMessage ? Number(replyToMessage.id) : null,
        reply_to_info: replyToMessage ? {
          message_id: Number(replyToMessage.id),
          sender: replyToMessage.sender?.full_name || replyToMessage.sender?.email || 'Unknown',
          content: replyToMessage.content?.substring(0, 50) || '',
        } : null,
      };
      set(state => ({
        messages: [...state.messages, optimisticMessage],
        replyToMessage: null,
      }));

      // Send to backend — the WebSocket broadcast will deliver the real
      // message with full sender data and replace the optimistic one.
      const res = await api.post("/messages/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // If the WebSocket already replaced this temp message, do nothing.
      // Otherwise, update the temp ID to the real server ID so the
      // WebSocket duplicate check can find it.
      if (res.data?.id) {
        set(state => ({
          messages: state.messages.map(m =>
            m.id === tempId
              ? { ...m, id: res.data.id }
              : m
          ),
        }));
      }

    } catch (err: any) {
      console.error(err);
      // Remove the optimistic message on failure
      set(state => ({
        messages: state.messages.filter(m => m.id !== tempId),
      }));
      toast.error(err?.response?.data?.message || "Failed to send message");
    }
  },


  // WebSocket message handler - called when receiving real-time messages
  handleWebSocketMessage: (message: Message) => {
    set((state) => {
      // Skip if message with this ID already exists (already replaced by HTTP or duplicate WS)
      if (state.messages.some((m) => m.id === message.id)) return state;

      // Check if there's a matching temp message (optimistic) from the same sender
      // Replace only the FIRST matching one to avoid losing messages on rapid sends
      let replacedOne = false;
      const updatedMessages = state.messages.map((m) => {
        if (
          !replacedOne &&
          typeof m.id === 'string' &&
          String(m.id).startsWith('temp-') &&
          m.sender?.id === message.sender?.id &&
          m.content === message.content
        ) {
          replacedOne = true;
          return message; // Replace temp with the real message
        }
        return m;
      });

      // If no temp message was replaced, this is a message from another user — append it
      if (!replacedOne) {
        updatedMessages.push(message);
      }

      return {
        messages: updatedMessages,
        chats: state.chats.map((chat) =>
          chat.id === message.conversation_id &&
          state.selectedUser?.id !== chat.id
            ? { ...chat, unread_count: chat.unread_count + 1 }
            : chat
        ),
      };
    });
  },
}));