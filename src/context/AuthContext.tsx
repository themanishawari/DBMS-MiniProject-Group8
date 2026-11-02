import React, { createContext, useContext, useEffect, useState } from 'react';
import { Role, User } from '../types';

const API_BASE = ((import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api/v1') as string;
const TOKEN_KEY = 'ccms_auth_token';
const SESSION_USER_KEY = 'ccms_session_user';

interface AuthContextType {
  currentUser: User | null;
  allUsers: User[];
  loginWithCredentials: (email: string, password: string) => Promise<boolean>;
  loginAsDemoUser: (email: string, password?: string) => Promise<void>;
  registerStudent: (name: string, email: string, studentId: string, phone?: string, password?: string) => Promise<User>;
  updateProfile: (updates: Partial<User>) => Promise<User>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Helper: make an authenticated fetch to the backend
// ---------------------------------------------------------------------------
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  if (!res.ok) {
    let msg = `API Error ${res.status}`;
    try {
      const err = await res.json();
      msg = err.message || err.detail || msg;
    } catch { /* non-JSON */ }
    throw new Error(msg);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Restore user from session if present (avoids flicker on page refresh)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(SESSION_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Persist current user for page-refresh resilience
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(SESSION_USER_KEY);
    }
  }, [currentUser]);

  // Load the full user directory once authenticated (used for staff/admin dropdowns)
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    apiFetch<User[]>('/users')
      .then((users) => setAllUsers(users))
      .catch(() => { /* non-fatal */ });
  }, [currentUser]);

  // ---- Login with real credentials ------------------------------------------
  const loginWithCredentials = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const data = await apiFetch<{ success: boolean; token: string; user: User }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify({ email, password }) }
      );
      localStorage.setItem(TOKEN_KEY, data.token);
      setCurrentUser(data.user);
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  // ---- One-click demo login (auto-fills password 'password123') -------------
  const loginAsDemoUser = async (email: string, password = 'password123'): Promise<void> => {
    setIsLoading(true);
    try {
      const data = await apiFetch<{ success: boolean; token: string; user: User }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify({ email, password }) }
      );
      localStorage.setItem(TOKEN_KEY, data.token);
      setCurrentUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  // ---- Student self-registration --------------------------------------------
  const registerStudent = async (
    name: string,
    email: string,
    studentId: string,
    phone?: string,
    password?: string
  ): Promise<User> => {
    setIsLoading(true);
    try {
      const data = await apiFetch<{ success: boolean; token: string; user: User }>(
        '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({
            name,
            email,
            studentId,
            phone: phone || undefined,
            password: password || 'password123',
          }),
        }
      );
      localStorage.setItem(TOKEN_KEY, data.token);
      setCurrentUser(data.user);
      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  // ---- Profile update -------------------------------------------------------
  const updateProfile = async (updates: Partial<User>): Promise<User> => {
    const updated = await apiFetch<User>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        name: updates.name,
        phone: updates.phone,
        avatarUrl: updates.avatar,
      }),
    });
    setCurrentUser(updated);
    return updated;
  };

  // ---- Logout ---------------------------------------------------------------
  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_USER_KEY);
    setCurrentUser(null);
    setAllUsers([]);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        loginWithCredentials,
        loginAsDemoUser,
        registerStudent,
        updateProfile,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
