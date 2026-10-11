import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth, googleProvider, isLiveFirebaseConfigured } from '../firebase/config';
import { setApiAuthToken } from '../services/api';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: User | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAsDemoStudent: () => void;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const DEMO_STUDENT: UserProfile = {
  uid: "usr_demo_student_42",
  email: "alex.mercer@studypath.edu",
  displayName: "Alex Mercer",
  preferences: { theme: "dark" }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Check if demo user was saved
    const savedDemo = localStorage.getItem('studypath_demo_user');
    if (savedDemo) {
      const parsed = JSON.parse(savedDemo);
      setCurrentUser(parsed);
      setIsDemoMode(true);
      setApiAuthToken('mock-demo-token', parsed.uid);
      setLoading(false);
      return;
    }

    if (!isLiveFirebaseConfigured) {
      // If live Firebase is not configured, default to demo student for smooth experience
      setCurrentUser(DEMO_STUDENT);
      setIsDemoMode(true);
      setApiAuthToken('mock-demo-token', DEMO_STUDENT.uid);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        const token = await user.getIdToken();
        setApiAuthToken(token, user.uid);
        setCurrentUser({
          uid: user.uid,
          email: user.email || 'student@studypath.edu',
          displayName: user.displayName || user.email?.split('@')[0] || 'Student',
        });
        setIsDemoMode(false);
      } else {
        setApiAuthToken(null, null);
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    if (!isLiveFirebaseConfigured) {
      const demoUser = {
        uid: `usr_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email,
        displayName: email.split('@')[0]
      };
      setCurrentUser(demoUser);
      setIsDemoMode(true);
      localStorage.setItem('studypath_demo_user', JSON.stringify(demoUser));
      setApiAuthToken('mock-demo-token', demoUser.uid);
      return;
    }
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const token = await cred.user.getIdToken();
    setApiAuthToken(token, cred.user.uid);
  };

  const registerWithEmail = async (email: string, pass: string, name?: string) => {
    if (!isLiveFirebaseConfigured) {
      const newUser = {
        uid: `usr_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email,
        displayName: name || email.split('@')[0]
      };
      setCurrentUser(newUser);
      setIsDemoMode(true);
      localStorage.setItem('studypath_demo_user', JSON.stringify(newUser));
      setApiAuthToken('mock-demo-token', newUser.uid);
      return;
    }
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const token = await cred.user.getIdToken();
    setApiAuthToken(token, cred.user.uid);
  };

  const loginWithGoogle = async () => {
    if (!isLiveFirebaseConfigured) {
      loginAsDemoStudent();
      return;
    }
    const cred = await signInWithPopup(auth, googleProvider);
    const token = await cred.user.getIdToken();
    setApiAuthToken(token, cred.user.uid);
  };

  const loginAsDemoStudent = () => {
    setCurrentUser(DEMO_STUDENT);
    setIsDemoMode(true);
    localStorage.setItem('studypath_demo_user', JSON.stringify(DEMO_STUDENT));
    setApiAuthToken('mock-demo-token', DEMO_STUDENT.uid);
  };

  const logout = async () => {
    localStorage.removeItem('studypath_demo_user');
    setIsDemoMode(false);
    if (isLiveFirebaseConfigured) {
      await signOut(auth);
    }
    setApiAuthToken(null, null);
    setCurrentUser(null);
  };

  const resetPassword = async (email: string) => {
    if (isLiveFirebaseConfigured) {
      await sendPasswordResetEmail(auth, email);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        loading,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginAsDemoStudent,
        logout,
        resetPassword,
        isDemoMode
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
