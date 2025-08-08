import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on app load
    const checkSession = () => {
      const session = localStorage.getItem('admin_session');
      if (session) {
        try {
          const sessionData = JSON.parse(session);
          const now = Date.now();
          
          // Check if session is still valid (24 hours)
          if (sessionData.expiresAt > now) {
            setUser(sessionData.user);
          } else {
            // Session expired, clear it
            localStorage.removeItem('admin_session');
          }
        } catch (error) {
          console.error('Error parsing session:', error);
          localStorage.removeItem('admin_session');
        }
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authApi.login({ email, password });
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Create session with 24 hour expiration
        const sessionData = {
          user,
          token,
          expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        };

        localStorage.setItem('admin_session', JSON.stringify(sessionData));
        setUser(user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const signup = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      const response = await authApi.signup({ name, email, password, role: 'admin' });
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Create session with 24 hour expiration
        const sessionData = {
          user,
          token,
          expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        };

        localStorage.setItem('admin_session', JSON.stringify(sessionData));
        setUser(user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_session');
    setUser(null);
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isAdmin,
      login,
      signup,
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
