import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
  useEffect,
} from "react";
import type { User } from "@/types";
import { loginApi, registerApi, logoutApi, getMeApi } from "@/api/auth";

type AuthModal = "login" | "register" | null;

type AuthContextValue = {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  authModal: AuthModal;
  openLogin: () => void;
  openRegister: () => void;
  closeModal: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authModal, setAuthModal] = useState<AuthModal>(null);

  const openLogin = useCallback(() => setAuthModal("login"), []);
  const openRegister = useCallback(() => setAuthModal("register"), []);
  const closeModal = useCallback(() => setAuthModal(null), []);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        const res = await loginApi({ email, password });
        setUser(res.user);
        setAuthModal(null);
        return true;
      } catch (err) {
        return false;
      }
    },
    [],
  );

  const register = useCallback(
    async (name: string, email: string, password: string): Promise<boolean> => {
      try {
        const res = await registerApi({ name, email, password });
        setUser(res.user);
        setAuthModal(null);
        return true;
      } catch (err) {
        return false;
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch (err) {
      // ignore
    }
    setUser(null);
  }, []);

  // try to restore session if token exists
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await getMeApi();
        if (mounted) setUser(me);
      } catch (err) {
        // no-op
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        login,
        register,
        logout,
        authModal,
        openLogin,
        openRegister,
        closeModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
