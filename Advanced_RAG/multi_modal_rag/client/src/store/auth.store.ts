import { create } from "zustand";
import type { AuthStatus, AuthUser } from "@/types/auth.types";

type AuthState = {
  user: AuthUser | null;
  status: AuthStatus;
  setAuthenticatedUser: (user: AuthUser) => void;
  setUnauthenticated: () => void;
  resetAuthStatus: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "unknown",
  setAuthenticatedUser: (user) => set({ user, status: "authenticated" }),
  setUnauthenticated: () => set({ user: null, status: "unauthenticated" }),
  resetAuthStatus: () => set({ user: null, status: "unknown" }),
}));
