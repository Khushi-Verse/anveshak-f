import { createContext, useContext, useState, useCallback } from 'react';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth';

import { auth } from '../config/firebase';

const AuthContext = createContext();

const API_URL = 'http://localhost:5001/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('anveshak_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('anveshak_token');
  });

  const [isLoading, setIsLoading] = useState(false);

  // ---------------- LOGIN ----------------

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

  // ---------------- LOGOUT ----------------

  const logout = useCallback(() => {
    localStorage.removeItem('anveshak_token');
    localStorage.removeItem('anveshak_user');

    setToken(null);
    setUser(null);
  }, []);

  // ---------------- FIREBASE OTP ----------------

  const sendOTP = useCallback(async (mobile) => {
    try {
      if (!mobile) {
        throw new Error('Please enter a mobile number');
      }

      // Create reCAPTCHA only once
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          'recaptcha-container',
          {
            size: 'invisible',
            callback: () => {
              console.log('reCAPTCHA verified');
            },
          }
        );

        await window.recaptchaVerifier.render();
      }

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        mobile,
        window.recaptchaVerifier
      );

      // Store confirmation result for OTP verification
      window.confirmationResult = confirmationResult;

      return {
        success: true,
        message: 'OTP sent successfully',
      };
    } catch (error) {
      console.error('Send OTP error:', error);

      // Reset reCAPTCHA if Firebase rejects the request
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }

      throw new Error(
        error?.message || 'Failed to send OTP'
      );
    }
  }, []);

  // ---------------- VERIFY OTP ----------------

  const verifyOTP = useCallback(async (mobile, otp) => {
    try {
      if (!otp || otp.length !== 6) {
        return {
          success: false,
          message: 'Please enter a valid 6-digit OTP',
        };
      }

      if (!window.confirmationResult) {
        return {
          success: false,
          message: 'Please request OTP first',
        };
      }

      await window.confirmationResult.confirm(otp);

      return {
        success: true,
        message: 'OTP verified successfully',
      };
    } catch (error) {
      console.error('Verify OTP error:', error);

      return {
        success: false,
        message: 'Invalid OTP. Please try again.',
      };
    }
  }, []);

  // ---------------- DIGILOCKER ----------------

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
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
}