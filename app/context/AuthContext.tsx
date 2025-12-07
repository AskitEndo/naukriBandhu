// app/context/AuthContext.tsx
"use client"; // This must be a client component

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
});

export const useAuth = (): AuthContextType => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Listen for connection changes (Login/Logout)
    const unsubscribe = onAuthStateChanged(auth, (currentUser: User | null) => {
      console.log(
        "Auth state changed:",
        currentUser ? "User logged in" : "User logged out"
      );
      console.log("User details:", currentUser);
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async (): Promise<void> => {
    return signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, logout, loading }}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-xl">Loading...</div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
