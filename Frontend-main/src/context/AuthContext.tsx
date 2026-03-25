import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { User } from "@/types";
import { loginApi, registerApi, getMeApi, googleLoginApi } from "@/api/auth";
import { getGoogleEmailFromOAuth } from "@/lib/googleOAuth";
import { clearToken, setOnUnauthorized } from "@/api/client";
import { toast } from "sonner";

type AuthModal = "login" | "register" | null;

type AuthContextValue = {
  user: User | null;
  isLoggedIn: boolean;
  updateUser: (user: User) => void;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  register: (
    name: string,
    email: string,
    password: string,
    phone?: string,
  ) => Promise<boolean>;
  logout: () => void;
  authModal: AuthModal;
  openLogin: () => void;
  openRegister: () => void;
  closeModal: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function saveUser(user: User) {
  localStorage.setItem("user", JSON.stringify(user));
}

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function removeUser() {
  localStorage.removeItem("user");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authModal, setAuthModal] = useState<AuthModal>(null);

  useEffect(() => {
    const saved = loadUser();
    if (saved) setUser(saved);

    setOnUnauthorized(() => {
      clearToken();
      removeUser();
      setUser(null);
      setAuthModal("login");
      toast.error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
    });
  }, []);

  const openLogin = useCallback(() => setAuthModal("login"), []);
  const openRegister = useCallback(() => setAuthModal("register"), []);
  const closeModal = useCallback(() => setAuthModal(null), []);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        const userData = await loginApi({ email, password });
        setUser(userData);
        saveUser(userData);
        setAuthModal(null);
        return true;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Đăng nhập thất bại";
        toast.error(message);
        return false;
      }
    },
    [],
  );

  const loginWithGoogle = useCallback(async (): Promise<boolean> => {
    try {
      const email = await getGoogleEmailFromOAuth();
      const userData = await googleLoginApi({ email });
      setUser(userData);
      saveUser(userData);
      setAuthModal(null);
      return true;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Đăng nhập Google thất bại";
      toast.error(message);
      return false;
    }
  }, []);

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      phone?: string,
    ): Promise<boolean> => {
      try {
        const userData = await registerApi({ name, email, password, phone });
        setUser(userData);
        saveUser(userData);
        setAuthModal(null);
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Đăng ký thất bại";
        toast.error(message);
        return false;
      }
    },
    [],
  );

  const logout = useCallback(() => {
    clearToken();
    removeUser();
    setUser(null);
  }, []);

  const updateUser = useCallback((u: User) => {
    setUser(u);
    saveUser(u);
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
        updateUser,
        login,
        loginWithGoogle,
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
