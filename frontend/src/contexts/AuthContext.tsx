import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { authAPI } from "../services/api";
import { jwtDecode } from "jwt-decode";
import toast from "react-hot-toast";
import { useChatStore } from "../store/useChatStore";
import { fetchMySubscription, type UserSubscription } from "../api/subscriptionApi";

interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  profile_pic?: string;
  profile_pic_url?: string;
  bio?: string;
  role?: string;
  username?: string;
  groups_joined?: number;
  token: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message?: string }>;
  register: (
    email: string,
    password: string,
    username: string
  ) => Promise<{ success: boolean; message?: string }>;
  updateProfile: (
    data: FormData | Record<string, unknown>
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  loadProfile: () => Promise<void>;
  isAuthenticated: boolean;
  subscriptions: UserSubscription[];
  isPremium: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const setUserFromToken = (token: string) => {
    try {
      const decoded: Record<string, unknown> = jwtDecode(token);

      const newUser: User = {
        id: decoded.user_id as number,
        email: decoded.email as string,
        full_name: decoded.full_name as string | undefined,
        username: decoded.username as string | undefined,
        token,
      };

      setUser(newUser);
      return newUser;
    } catch (error) {
      console.error("Token decode error:", error);
      return null;
    }
  };

  const loadProfile = async () => {
    try {
      const profile = await authAPI.getProfile();

      setUser((prev) =>
        prev
          ? { ...prev, ...profile }
          : { ...profile, token: localStorage.getItem("token") || "" }
      );

      // Also load subscriptions
      const subData = await fetchMySubscription();
      if (subData.has_subscription) {
        setSubscriptions(subData.subscriptions);
      } else {
        setSubscriptions([]);
      }
    } catch (error) {
      console.error("Failed to load profile or subscription:", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    const decodedUser = setUserFromToken(token);
    if (!decodedUser) {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      setLoading(false);
      return;
    }

    loadProfile().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user?.token) {
      useChatStore.getState().connectPresenceSocket(user.token);
    }
  }, [user?.token]);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);

      localStorage.setItem("token", response.tokens.access);
      localStorage.setItem("refresh_token", response.tokens.refresh);

      const decodedUser = setUserFromToken(response.tokens.access);
      if (!decodedUser) throw new Error("Token decode failed");

      await loadProfile();

      return { success: true };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        message: err.response?.data?.message || "Login failed",
      };
    }
  };

  const register = async (email: string, password: string, username: string) => {
    try {
      const response = await authAPI.signup({
        email,
        password,
        username,
      });

      localStorage.setItem("token", response.tokens.access);
      localStorage.setItem("refresh_token", response.tokens.refresh);

      const decodedUser = setUserFromToken(response.tokens.access);
      if (!decodedUser) throw new Error("Token decode failed");

      await loadProfile();

      return { success: true };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        message: err.response?.data?.message || "Registration failed",
      };
    }
  };

  const updateProfile = async (data: FormData | Record<string, unknown>) => {
    try {
      if (data instanceof Object && !(data instanceof FormData) && 'profilePic' in data) {
        (data as Record<string, unknown>).profile_pic = (data as Record<string, unknown>).profilePic;
        delete (data as Record<string, unknown>).profilePic;
      }

      const updated = await authAPI.updateProfile(data);

      setUser(prev => {
        if (!prev) return prev;
        const merged = {
          ...prev,
          ...updated,
        };
        merged.full_name = `${merged.first_name ?? ""} ${merged.last_name ?? ""}`.trim();
        return merged;
      });

      toast.success("Profile updated successfully");
      return { success: true };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Profile update failed");
      return {
        success: false,
        message: err.response?.data?.message || "Profile update failed",
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    updateProfile,
    logout,
    loadProfile,
    isAuthenticated: !!user,
    subscriptions,
    isPremium: subscriptions.length > 0,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
