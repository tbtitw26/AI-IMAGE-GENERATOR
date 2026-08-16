'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getDefaultCurrency, getCurrencyCodes } from '@/config/currency';

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(getDefaultCurrency());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load currency preference from localStorage
  useEffect(() => {
    const savedCurrency = localStorage.getItem('selectedCurrency');
    // EUR is the base currency. If nothing is saved, or the saved value is USD
    // (from an old session before EUR became the default), default to EUR.
    if (savedCurrency && savedCurrency !== 'USD' && getCurrencyCodes().includes(savedCurrency)) {
      setCurrency(savedCurrency);
    } else {
      // Ensure EUR is persisted as the canonical default
      localStorage.setItem('selectedCurrency', 'EUR');
    }
    setIsLoaded(true);
  }, []);

  // Save currency preference to localStorage
  const handleCurrencyChange = (newCurrency) => {
    if (getCurrencyCodes().includes(newCurrency)) {
      setCurrency(newCurrency);
      localStorage.setItem('selectedCurrency', newCurrency);
    }
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency: handleCurrencyChange,
        isLoaded,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
}
