import React, { createContext, useContext, useEffect, useState } from 'react';
import { INITIAL_USERS } from '../data/initialSeed';
import { complaintRepository } from '../repositories';
import { Role, User } from '../types';

interface AuthContextType {
  currentUser: User;
  allUsers: User[];
  loginAsDemoUser: (roleOrEmail: string) => void;
  loginWithCredentials: (email: string, role: Role) => Promise<boolean>;
  registerStudent: (name: string, email: string, studentId: string, phone?: string) => Promise<User>;
  updateProfile: (updates: Partial<User>) => Promise<User>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to student for instant exploratory testing
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('ccms_session_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return INITIAL_USERS[0]; // Rahul Sharma (Student)
  });

  const [allUsers, setAllUsers] = useState<User[]>(INITIAL_USERS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const users = await complaintRepository.getUsers();
        setAllUsers(users);
      } catch (err) {
        console.error('Failed to load users:', err);
      }
    };
    loadUsers();
  }, []);

  const loginAsDemoUser = (roleOrEmail: string) => {
    let found = allUsers.find((u) => u.email.toLowerCase() === roleOrEmail.toLowerCase());
    if (!found) {
      found = allUsers.find((u) => u.role === roleOrEmail);
    }
    if (!found) {
      found = INITIAL_USERS[0];
    }
    setCurrentUser(found);
    localStorage.setItem('ccms_session_user', JSON.stringify(found));
  };

  const loginWithCredentials = async (email: string, role: Role): Promise<boolean> => {
    setIsLoading(true);
    try {
      const users = await complaintRepository.getUsers();
      let match = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

      if (!match) {
        // Demo mode convenience: create a mock session if not exists
        match = {
          id: `user-${Date.now()}`,
          name: email.split('@')[0].replace('.', ' '),
          email,
          role,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
      }

      setCurrentUser(match);
      localStorage.setItem('ccms_session_user', JSON.stringify(match));
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const registerStudent = async (name: string, email: string, studentId: string, phone?: string): Promise<User> => {
    setIsLoading(true);
    try {
      const newUser = await complaintRepository.createUser(
        {
          name,
          email,
          role: 'student',
          studentId,
          phone,
          isActive: true,
        },
        currentUser
      );
      setCurrentUser(newUser);
      localStorage.setItem('ccms_session_user', JSON.stringify(newUser));
      return newUser;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>): Promise<User> => {
    const updated = await complaintRepository.updateUser(currentUser.id, updates, currentUser);
    setCurrentUser(updated);
    localStorage.setItem('ccms_session_user', JSON.stringify(updated));
    return updated;
  };

  const logout = () => {
    localStorage.removeItem('ccms_session_user');
    // Return to student demo account
    setCurrentUser(INITIAL_USERS[0]);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        loginAsDemoUser,
        loginWithCredentials,
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
