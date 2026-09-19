import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext();

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('anveshak_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('anveshak_token');
  });

  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (role, credentials) => {
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Identity verification failed'
        );
      }

      localStorage.setItem('anveshak_token', data.token);
      localStorage.setItem(
        'anveshak_user',
        JSON.stringify(data.user)
      );

      setToken(data.token);
      setUser(data.user);

      return data.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('anveshak_token');
    localStorage.removeItem('anveshak_user');

    setToken(null);
    setUser(null);
  }, []);

  const sendOTP = useCallback(async (mobile) => {
    return {
      success: true,
      message: 'OTP sent to ' + mobile,
    };
  }, []);

  const verifyOTP = useCallback(async (mobile, otp) => {
    return otp?.length === 6
      ? { success: true }
      : { success: false, message: 'Invalid OTP' };
  }, []);

  const verifyDigiLocker = useCallback(async () => {
    return {
      success: true,
      data: {
        name: 'Verified Citizen',
      },
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
        sendOTP,
        verifyOTP,
        verifyDigiLocker,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}