// Re-export the unified API client for backward compatibility.
// All modules should eventually import directly from '../api/apiClient'.
import api from "../api/apiClient";
import { API_BASE, WS_BASE } from "../api/apiClient";
import type { Conversation, Message } from "../types/chat";

export { API_BASE, WS_BASE };

export const authAPI = {
  login: async (email: string, password: string) => {
    const res = await api.post("/auth/login/", { email, password });
    return res.data;
  },

  signup: async (data: { email: string; password: string; role: string; username: string }) => {
    const res = await api.post("/auth/users/", data);
    return res.data;
  },

  logout: async () => {
    const res = await api.post("/auth/logout/");
    return res.data;
  },

  getProfile: async () => {
    const res = await api.get("/auth/users/profile/");
    return res.data;
  },

  updateProfile: async (data: FormData | Record<string, unknown>) => {
    const isFormData = data instanceof FormData;
    const method = isFormData ? "patch" : "put";

    const res = await api[method]("/auth/users/update_profile/", data, {
      headers: {
        ...(isFormData ? { "Content-Type": "multipart/form-data" } : {}),
      },
    });
    return res.data;
  },

  requestPasswordReset: async (email: string) => {
    const res = await api.post("/auth/password-reset/", { email });
    return res.data;
  },

  confirmPasswordReset: async (
    uid: string,
    token: string,
    new_password: string,
    confirm_password: string
  ) => {
    const res = await api.post(
      `${API_BASE}/password-reset-confirm/`,
      { uid, token, new_password, confirm_password },
      { baseURL: "" } // Override baseURL since this endpoint is at root level
    );
    return res.data;
  },

  changePassword: async (
    old_password: string,
    new_password: string,
    confirm_password: string
  ) => {
    const res = await api.put("/auth/password-change/", {
      old_password,
      new_password,
      confirm_password,
    });
    return res.data;
  },
};

export const chatAPI = {
  getConversations: async (search?: string): Promise<Conversation[]> => {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    const res = await api.get(`/conversations/${params}`);
    return res.data;
  },

  startIndividualConversation: async (
    recipientId: number
  ): Promise<Conversation> => {
    const res = await api.post("/conversations/start_individual/", {
      recipient_id: recipientId,
    });
    return res.data;
  },

  getConversationMessages: async (
    conversationId: number
  ): Promise<Message[]> => {
    const res = await api.get(
      `/messages/conversation_messages/?conversation_id=${conversationId}`
    );
    return res.data;
  },

  sendMessage: async (data: {
    conversation: number;
    content: string;
    message_type?: string;
  }): Promise<Message> => {
    const res = await api.post("/messages/", data);
    return res.data;
  },

  searchUsers: async (query: string): Promise<unknown[]> => {
    const res = await api.get(`/auth/users/search/?q=${query}`);
    return res.data;
  },

  searchGroups: async (query: string): Promise<unknown[]> => {
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

  getUserGroups: async (): Promise<unknown[]> => {
    const res = await api.get("/groups/my-groups/");
    return res.data;
  },
};

export const userAPI = {
  getProfile: async (): Promise<unknown> => {
    const res = await api.get("/users/profile/");
    return res.data;
  },

  updateProfile: async (data: unknown): Promise<unknown> => {
    const res = await api.patch("/users/profile/", data);
    return res.data;
  },
};

export default api;
