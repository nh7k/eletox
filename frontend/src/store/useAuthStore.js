import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

const handleError = (error) => {
  if (!error.response) {
    // Network error or server not running
    return "Unable to connect to the server. Please check your internet connection or try again later.";
  }
  return error.response.data?.message || "An unexpected error occurred. Please try again.";
};

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      if (!res.data) {
        throw new Error("Invalid response from server");
      }
      set({ authUser: res.data });
      // Only connect socket if we have a valid auth user
      if (res.data) {
        get().connectSocket();
      }
    } catch (error) {
      console.log("Error in checkAuth:", error);
      // Don't show error toast for 401 - it's expected when not logged in
      if (error.response?.status !== 401) {
        toast.error(handleError(error));
      }
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      if (!res.data) {
        throw new Error("Invalid response from server");
      }
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      console.error("Signup error:", error);
      toast.error(handleError(error));
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      if (!res.data) {
        throw new Error("Invalid response from server");
      }
      set({ authUser: res.data });
      toast.success("Logged in successfully");
      get().connectSocket();
    } catch (error) {
      console.error("Login error:", error);
      toast.error(handleError(error));
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      console.error("Logout error:", error);
      toast.error(handleError(error));
      // Still clear the auth state even if the server request fails
      set({ authUser: null });
      get().disconnectSocket();
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      if (!res.data) {
        throw new Error("Invalid response from server");
      }
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Update profile error:", error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || handleError(error);
      toast.error(errorMessage);
      // Reset the profile picture if upload failed
      if (data.profilePic) {
        set({ authUser: { ...get().authUser } });
      }
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    try {
      const socket = io(BASE_URL, {
        query: {
          userId: authUser._id,
        },
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        withCredentials: true,
        transports: ['websocket', 'polling']
      });

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        // Only show error if it's not a connection refused error
        if (!error.message.includes("xhr poll error")) {
          toast.error("Unable to establish real-time connection");
        }
      });

      socket.on("connect", () => {
        console.log("Socket connected successfully");
      });

      socket.connect();
      set({ socket });

      socket.on("getOnlineUsers", (userIds) => {
        set({ onlineUsers: userIds });
      });
    } catch (error) {
      console.error("Socket initialization error:", error);
      toast.error("Failed to initialize real-time connection");
    }
  },

  disconnectSocket: () => {
    try {
      if (get().socket?.connected) {
        get().socket.disconnect();
      }
    } catch (error) {
      console.error("Socket disconnect error:", error);
    }
  },
}));
