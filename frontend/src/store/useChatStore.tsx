import { create } from "zustand";
import toast from "react-hot-toast";
import api from "../services/api";

export interface User {
  id: number;
  full_name?: string;
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

  connectPresenceSocket: (token: string) => {
    if (!token) return;

    const ws = new WebSocket(
      `ws://127.0.0.1:8000/ws/online/?token=${token}`
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
  setSelectedUser: (user) => {
    set(state => ({
      selectedUser: user, 
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
    const { selectedUser } = get();
    if (!selectedUser) {
      toast.error("No conversation selected");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("conversation_id", String(selectedUser.id));
      formData.append("content", text);

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
        id: `temp-${Date.now()}`,
        content: text,
        message_type: messageType,
        file_attachment: file ? URL.createObjectURL(file) : null,
        timestamp: new Date().toISOString(),
        sender: currentUser, // use currentUser here
      };
      set(state => ({
        messages: [...state.messages, optimisticMessage],
      }));

      // Send to backend
      await api.post("/messages/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to send message");
    }
  },


  // WebSocket message handler - called when receiving real-time messages
  handleWebSocketMessage: (message) => {
    set((state) => {
      if (state.messages.some((m) => m.id === message.id)) return state;

      return {
        messages: [...state.messages, message],
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


// import { create } from "zustand";
// import toast from "react-hot-toast";
// import api from "../services/api";

// export interface User {
//   id: number;
//   full_name: string;
//   email: string;
// }

// export interface Message {
//   id: number;
//   content: string;
//   message_type: "text" | "file" | "image";
//   file_attachment: string | null;
//   timestamp: string;
//   sender: User;
// }

// export interface Contact {
//   id: number;
//   full_name: string;
//   unread_count: number;
//   updated_at: string;
//   type: "individual" | "group";
// }

// interface SendMessageInput {
//   text?: string;
//   file?: File | null;
//   currentUser: User;
// }

// interface ChatStoreState {
//   allContacts: Contact[];
//   chats: Contact[];
//   messages: Message[];
//   activeTab: string;
//   selectedUser: Contact | null;
//   isUsersLoading: boolean;
//   isMessagesLoading: boolean;
//   isSoundEnabled: boolean;

//   toggleSound: () => void;
//   setActiveTab: (tab: string) => void;
//   setSelectedUser: (user: Contact | null) => void;

//   getAllGroupContacts: () => Promise<void>;
//   getAllIndividualContacts: () => Promise<void>;
//   getMessageByConvId: (convId?: number) => Promise<void>;

//   sendMessage: (data: SendMessageInput) => Promise<void>;
//   handleWebSocketMessage: (message: Message) => void;
// }

// export const useChatStore = create<ChatStoreState>((set, get) => ({
//   allContacts: [],
//   chats: [],
//   messages: [],
//   activeTab: "chats",
//   selectedUser: null,
//   isUsersLoading: false,
//   isMessagesLoading: false,

//   isSoundEnabled:
//     JSON.parse(localStorage.getItem("isSoundEnabled") ?? "false") === true,

//   toggleSound: () => {
//     const newState = !get().isSoundEnabled;
//     localStorage.setItem("isSoundEnabled", JSON.stringify(newState));
//     set({ isSoundEnabled: newState });
//   },

//   setActiveTab: (tab) => set({ activeTab: tab }),
//   // setSelectedUser: (user) => set({ selectedUser: user }),
//   setSelectedUser: (user) => {
//     set(state => ({
//       selectedUser: user, 
//       chats: state.chats.map(chat => 
//         chat.id === user?.id ? {...chat, unread_count: 0}: chat
//       )
//     }));
//     // load messages for converstion
//     if (user?.id) get().getMessageByConvId(user.id);
//   },

//   // Fetch group contacts
//   getAllGroupContacts: async () => {
//     set({ isUsersLoading: true });
//     try {
//       const res = await api.get("/conversations/group_list/");
//       set({ allContacts: res.data || [] });
//     } catch (err: any) {
//       toast.error(err?.response?.data?.message || "Failed to load groups");
//     } finally {
//       set({ isUsersLoading: false });
//     }
//   },

//   // Fetch individual contacts
//   getAllIndividualContacts: async () => {
//     set({ isUsersLoading: true });
//     try {
//       const res = await api.get("/conversations/individual_list/");
//       set({ chats: res.data || [] });
//     } catch (err: any) {
//       toast.error(err?.response?.data?.message || "Failed to load chats");
//     } finally {
//       set({ isUsersLoading: false });
//     }
//   },

//   // Fetch messages for a conversation
//   getMessageByConvId: async (convId) => {
//     const selected = get().selectedUser;
//     const id = convId ?? selected?.id;
//     if (!id) return;

//     set({ isMessagesLoading: true });

//     try {
//       const res = await api.get("/messages/", {
//         params: { conversation_id: id },
//       });

//       set({ messages: res.data || [] });
//     } catch (err) {
//       toast.error("Failed to load messages");
//     } finally {
//       set({ isMessagesLoading: false });
//     }
//   },

//   sendMessage: async ({ text = "", file, currentUser }) => {
//     const { selectedUser, messages } = get();
//     if (!selectedUser) {
//       toast.error("No conversation selected");
//       return;
//     }

//     try {
//       const formData = new FormData();
//       formData.append("conversation_id", String(selectedUser.id));
//       formData.append("content", text);

//       let messageType: "text" | "file" | "image" = "text";
//       if (file) {
//         const filename = file.name.toLowerCase();
//         const isImage = /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(filename);
//         messageType = isImage ? "image" : "file";
//         formData.append("file_upload", file);
//       }
//       formData.append("message_type", messageType);

//       // Optimistic message
//       const optimisticMessage: Message = {
//         id: `temp-${Date.now()}`,
//         content: text,
//         message_type: messageType,
//         file_attachment: file ? URL.createObjectURL(file) : null,
//         timestamp: new Date().toISOString(),
//         sender: currentUser, // use currentUser here
//       };
//       set(state => ({
//         messages: [...state.messages, optimisticMessage],
//       }));

//       // Send to backend
//       await api.post("/messages/", formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//     } catch (err: any) {
//       console.error(err);
//       toast.error(err?.response?.data?.message || "Failed to send message");
//     }
//   },


//   // WebSocket message handler - called when receiving real-time messages
//   handleWebSocketMessage: (message: Message) => {
//     set(state => {
//       if (state.messages.some(m => m.id === message.id)) {
//         return state;
//       }
//       // add to messages
//       const updateMessages = [...state.messages, message];
      
//       // Increament unread count if the conversation is NOT active
//       const updatedChats = state.chats.map(chat => {
//         if (chat.id === message.sender.id || chat.id === message.conversation_id) {
//           // only increment if this chat is not currently selected
//           if (state.selectedUser?.id !== chat.id) {
//             return {
//               ...chat, 
//               unread_count: (chat.unread_count || 0) + 1, 
//             };
//           }
//         }
//         return chat;
//       });

//       return {
//         messages: updateMessages,
//         chats: updatedChats,
//       };
//     });
//   },
// }));