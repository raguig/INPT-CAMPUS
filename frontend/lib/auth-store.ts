import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { AuthUser } from "@/lib/auth-types";

type AuthState = {
  logout: () => void;
  setToken: (token: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  token: string | null;
  user: AuthUser | null;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      logout: () => set({ token: null, user: null }),
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      token: null,
      user: null,
    }),
    {
      name: "campus-inpt-auth",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
