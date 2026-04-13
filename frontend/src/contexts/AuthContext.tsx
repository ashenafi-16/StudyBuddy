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
    role: string,
    username: string
  ) => Promise<{ success: boolean; message?: string }>;
  updateProfile: (
    data: any
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
      const decoded: any = jwtDecode(token);

      const newUser: User = {
        id: decoded.user_id,
        email: decoded.email,
        full_name: decoded.full_name,
        username: decoded.username,
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
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  };


  const register = async (email: string, password: string, role: string, username: string) => {
    try {
      const response = await authAPI.signup({
        email,
        password,
        role,
        username,
      });

      localStorage.setItem("token", response.tokens.access);
      localStorage.setItem("refresh_token", response.tokens.refresh);

      const decodedUser = setUserFromToken(response.tokens.access);
      if (!decodedUser) throw new Error("Token decode failed");

      await loadProfile();

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed",
      };
    }
  };


  const updateProfile = async (data: any) => {
    try {
      if (data.profilePic) {
        data.profile_pic = data.profilePic;
        delete data.profilePic;
      }

      const updated = await authAPI.updateProfile(data);

      setUser(prev => {
        const merged = {
          ...prev,
          ...updated,
        };

        merged.full_name = `${merged.first_name ?? ""} ${merged.last_name ?? ""}`.trim();

        return merged;
      });

      toast.success("Profile updated successfully");
      return { success: true };

    } catch (error: any) {

      toast.error(error.response?.data?.message || "Profile update failed");

      return {
        success: false,
        message: error.response?.data?.message || "Profile update failed",
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




// import React, {
//   createContext,
//   useContext,
//   useState,
//   useEffect,
//   type ReactNode,
// } from "react";
// import { authAPI } from "../services/api";
// import { jwtDecode } from "jwt-decode";
// import toast from "react-hot-toast";

// interface User {
//   id: number;
//   email: string;
//   first_name?: string;
//   last_name?: string;
//   full_name?: string;
//   profile_pic?: string;
//   profile_pic_url?: string;
//   bio?: string;
//   role?: string;
//   username?: string;
//   groups_joined?: number;
//   token: string;
// }

// interface AuthContextType {
//   user: User | null;
//   loading: boolean;
//   login: (
//     email: string,
//     password: string
//   ) => Promise<{ success: boolean; message?: string }>;
//   register: (
//     email: string,
//     password: string,
//     role: string,
//     username: string
//   ) => Promise<{ success: boolean; message?: string }>;
//   updateProfile: (
//     data: any
//   ) => Promise<{ success: boolean; message?: string }>;
//   logout: () => void;
//   loadProfile: () => Promise<void>;
//   isAuthenticated: boolean;

//   setOnlineUsers: React.Dispatch<React.SetStateAction<number[]>>; 
// }

// export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [onlineUsers, setOnlineUsers] = useState<number[]>([]);

//   const setUserFromToken = (token: string) => {
//     try {
//       const decoded: any = jwtDecode(token);

//       const newUser: User = {
//         id: decoded.user_id,
//         email: decoded.email,
//         full_name: decoded.full_name,
//         username: decoded.username,
//         token,
//       };

//       setUser(newUser);
//       return newUser;
//     } catch (error) {
//       console.error("Token decode error:", error);
//       return null;
//     }
//   };

//   // ----------------------------
//   // Get profile from API
//   // ----------------------------
//   const loadProfile = async () => {
//     try {
//       const profile = await authAPI.getProfile();

//       setUser((prev) =>
//         prev
//           ? { ...prev, ...profile }
//           : { ...profile, token: localStorage.getItem("token") || "" }
//       );
//     } catch (error) {
//       console.error("Failed to load profile:", error);
//     }
//   };

 
//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (!token) {
//       setLoading(false);
//       return;
//     }

//     const decodedUser = setUserFromToken(token);
//     if (!decodedUser) {
//       localStorage.removeItem("token");
//       localStorage.removeItem("refresh_token");
//       setLoading(false);
//       return;
//     }

//     loadProfile().finally(() => setLoading(false));
//   }, []);

//   useEffect (() => {
//     if (!user?.token) return;
//     let ws: WebSocket | null = null; 
    
//     const connectWS = () => {
//       ws = new WebSocket(`ws://127.0.0.1:8000/ws/online/?token=${user.token}`)
//       ws.onopen = () => {
//         console.log("%c[ONLINE WS] Connected", "color: green");
//       };
//       ws.onmessage = (event) => {
//         const data = JSON.parse(event.data);

//         if (data.online_users) {
//           setOnlineUsers(data.online_users);
//         }
//       };
//       ws.onclose = () => {
//         console.warn("[ONLINE WS] Closed — reconnecting...");
//         setTimeout(connectWS, 2000); // auto reconnect
//       };
//       ws.onerror = () => {
//         console.error("[ONLINE WS] Error");
//         ws?.close();
//       };
//     };
//     connectWS();
//     return () => ws?.close();
//   }, [user]);

//   const login = async (email: string, password: string) => {
//     try {
//       const response = await authAPI.login(email, password);

//       localStorage.setItem("token", response.tokens.access);
//       localStorage.setItem("refresh_token", response.tokens.refresh);

//       const decodedUser = setUserFromToken(response.tokens.access);
//       if (!decodedUser) throw new Error("Token decode failed");

//       await loadProfile();

//       return { success: true };
//     } catch (error: any) {
//       return {
//         success: false,
//         message: error.response?.data?.message || "Login failed",
//       };
//     }
//   };

//   // ----------------------------
//   // Register
//   // ----------------------------
//   const register = async (email: string, password: string, role: string, username: string) => {
//     try {
//       const response = await authAPI.signup({
//         email,
//         password,
//         role,
//         username,
//       });

//       localStorage.setItem("token", response.tokens.access);
//       localStorage.setItem("refresh_token", response.tokens.refresh);

//       const decodedUser = setUserFromToken(response.tokens.access);
//       if (!decodedUser) throw new Error("Token decode failed");

//       await loadProfile();

//       return { success: true };
//     } catch (error: any) {
//       return {
//         success: false,
//         message: error.response?.data?.message || "Registration failed",
//       };
//     }
//   };

//   // ----------------------------
//   // Update Profile (NEW)
//   // ----------------------------
//   const updateProfile = async (data: any) => {
//     try {
//       if (data.profilePic) {
//         data.profile_pic = data.profilePic;
//         delete data.profilePic;
//       }

//       const updated = await authAPI.updateProfile(data);

//       setUser(prev => {
//         const merged = {
//           ...prev,
//           ...updated,
//         };

//         merged.full_name = `${merged.first_name ?? ""} ${merged.last_name ?? ""}`.trim();

//         return merged;
//       });

//       toast.success("Profile updated successfully");
//       return { success: true };

//     } catch (error: any) {

//       toast.error(error.response?.data?.message || "Profile update failed");

//       return {
//         success: false,
//         message: error.response?.data?.message || "Profile update failed",
//       };
//     }
//   };



//   const logout = () => {
//     setUser(null);
//     setOnlineUsers([]);
//     localStorage.removeItem("token");
//     localStorage.removeItem("refresh_token");
//   };

//   const value: AuthContextType = {
//     user,
//     loading,
//     login,
//     register,
//     updateProfile,
//     logout,
//     loadProfile,
//     isAuthenticated: !!user,
//     onlineUsers,
//     setOnlineUsers,
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) throw new Error("useAuth must be used inside AuthProvider");
//   return context;
// };
