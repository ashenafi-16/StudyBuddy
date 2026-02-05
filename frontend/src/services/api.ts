import axios from "axios";
import type {
  Conversation,
  Message
} from "../types/chat";

const API_BASE = "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});



api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});



api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);



export const authAPI = {
  login: async (email: string, password: string) => {
    const res = await api.post("/auth/login/", { email, password });
    return res.data;
  },

  signup: async (data: any) => {
    const res = await api.post("/auth/register/", data);
    return res.data;
  },

  logout: async () => {
    const res = await api.post("/auth/logout/");
    return res.data;
  },
  getProfile: async () => {
    const res = await api.get('/auth/users/profile/');
    return res.data;
  },
  updateProfile: async (data: any) => {
    const isFormData = data instanceof FormData;

    const method = isFormData ? "patch" : "put";

    const res = await api[method]("/auth/users/update_profile/", data, {
      headers: {
        ...(isFormData
          ? { "Content-Type": "multipart/form-data" }
          : {}),
      },
    });
    return res.data
  },

  // Password Reset - Request reset link via email
  requestPasswordReset: async (email: string) => {
    const res = await api.post("/auth/password-reset/", { email });
    return res.data;
  },

  // Password Reset - Confirm with token from email
  confirmPasswordReset: async (uid: string, token: string, new_password: string, confirm_password: string) => {
    // Note: This endpoint is at root level, not under /api
    const res = await axios.post("http://127.0.0.1:8000/password-reset-confirm/", {
      uid,
      token,
      new_password,
      confirm_password,
    });
    return res.data;
  },

  // Password Change - For authenticated users
  changePassword: async (old_password: string, new_password: string, confirm_password: string) => {
    const res = await api.put("/auth/password-change/", {
      old_password,
      new_password,
      confirm_password,
    });
    return res.data;
  },
};


export const chatAPI = {
  /** Fetch all conversations */
  getConversations: async (search?: string): Promise<Conversation[]> => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await api.get(`/conversations/${params}`);
    return res.data;
  },

  /** Start a DM with user */
  startIndividualConversation: async (recipientId: number): Promise<Conversation> => {
    const res = await api.post("/conversations/start_individual/", {
      recipient_id: recipientId,
    });
    return res.data;
  },

  /** Get all messages for conversation */
  getConversationMessages: async (conversationId: number): Promise<Message[]> => {
    const res = await api.get(
      `/messages/conversation_messages/?conversation_id=${conversationId}`
    );
    return res.data;
  },

  /** Send a message */
  sendMessage: async (data: {
    conversation: number;
    content: string;
    message_type?: string;
  }): Promise<Message> => {
    const res = await api.post("/messages/", data);
    return res.data;
  },



  /** Search users */
  searchUsers: async (query: string): Promise<any[]> => {
    const res = await api.get(`/auth/users/search/?q=${query}`);
    return res.data;
  },

  /** Search groups */
  searchGroups: async (query: string): Promise<any[]> => {
    const res = await api.get(`/groups/search/?q=${query}`);
    return res.data;
  },


  joinGroup: async (groupId: number) => {
    const res = await api.post(`/groups/${groupId}/join/`);
    return res.data;
  },

  leaveGroup: async (groupId: number) => {
    const res = await api.post(`/groups/${groupId}/leave/`);
    return res.data;
  },

  getUserGroups: async (): Promise<any[]> => {
    const res = await api.get("/groups/my-groups/");
    return res.data;
  },
};



export const userAPI = {
  getProfile: async (): Promise<any> => {
    const res = await api.get("/users/profile/");
    return res.data;
  },

  updateProfile: async (data: any): Promise<any> => {
    const res = await api.patch("/users/profile/", data);
    return res.data;
  },
};


export default api;
