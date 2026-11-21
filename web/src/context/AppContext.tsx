'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { SupportedLanguage, Account } from '@dayzero/shared';
import { t } from '@dayzero/shared';
import { pb } from '../lib/pb';

export type AppTab = 'companion' | 'care' | 'helplines' | 'community' | 'settings';

interface AppContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  emergencyModalOpen: boolean;
  setEmergencyModalOpen: (open: boolean) => void;
  account: Account | null;
  isAuthenticated: boolean;
  login: (identity: string, pass: string) => Promise<void>;
  register: (payload: { email: string; pass: string; language: string; timezone: string }) => Promise<void>;
  logout: () => void;
  deleteAccount: (pass: string) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const [activeTab, setActiveTab] = useState<AppTab>('companion');
  const [emergencyModalOpen, setEmergencyModalOpen] = useState<boolean>(false);
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('dayzero_lang') as SupportedLanguage;
      if (savedLang && (savedLang === 'en' || savedLang === 'ml' || savedLang === 'ml-Latn')) {
        setLanguageState(savedLang);
      }
      setAccount(pb.getCurrentAccount());
    }
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dayzero_lang', lang);
    }
  };

  const login = async (identity: string, pass: string) => {
    const res = await pb.login(identity, pass);
    setAccount(res.account);
    if (res.account.language) {
      setLanguage(res.account.language as SupportedLanguage);
    }
  };

  const register = async (payload: { email: string; pass: string; language: string; timezone: string }) => {
    const res = await pb.register({
      email: payload.email,
      password: payload.pass,
      language: payload.language,
      timezone: payload.timezone,
    });
    setAccount(res.account);
    setLanguage(payload.language as SupportedLanguage);
  };

  const logout = () => {
    pb.logout();
    setAccount(null);
  };

  const deleteAccount = async (pass: string) => {
    await pb.deleteAccount(pass);
    setAccount(null);
  };

  const translate = (key: string, params?: Record<string, string | number>) => {
    return t(key, language, params);
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        activeTab,
        setActiveTab,
        emergencyModalOpen,
        setEmergencyModalOpen,
        account,
        isAuthenticated: !!account,
        login,
        register,
        logout,
        deleteAccount,
        t: translate,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
