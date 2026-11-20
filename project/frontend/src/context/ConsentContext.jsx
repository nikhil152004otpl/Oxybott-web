import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { syncConsent } from '../utils/analytics';

const CONSENT_KEY = '_oxconsent';
const CONSENT_VERSION = '1.0';

const defaultPrefs = {
  necessary: true,  // Always true
  analytics: false,
  functional: false,
  marketing: false,
  decided: false,   // Has user made a decision?
  version: CONSENT_VERSION
};

const ConsentContext = createContext(defaultPrefs);

export function ConsentProvider({ children }) {
  const [prefs, setPrefs] = useState(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Re-ask if version changed
        if (parsed.version !== CONSENT_VERSION) return defaultPrefs;
        return { ...defaultPrefs, ...parsed };
      }
    } catch {}
    return defaultPrefs;
  });

  const savePrefs = useCallback(async (newPrefs) => {
    const toSave = { ...newPrefs, necessary: true, version: CONSENT_VERSION };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(toSave));
    setPrefs(toSave);
    // Sync to backend
    await syncConsent(toSave).catch(() => {});
  }, []);

  const acceptAll = useCallback(() => {
    savePrefs({ necessary: true, analytics: true, functional: true, marketing: true, decided: true });
  }, [savePrefs]);

  const rejectOptional = useCallback(() => {
    savePrefs({ necessary: true, analytics: false, functional: false, marketing: false, decided: true });
  }, [savePrefs]);

  const updatePrefs = useCallback((newPrefs) => {
    savePrefs({ ...prefs, ...newPrefs, decided: true });
  }, [prefs, savePrefs]);

  return (
    <ConsentContext.Provider value={{ prefs, acceptAll, rejectOptional, updatePrefs }}>
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  return useContext(ConsentContext);
}
