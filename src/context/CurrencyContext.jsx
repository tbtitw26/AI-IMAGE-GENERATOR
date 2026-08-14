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
    if (savedCurrency && getCurrencyCodes().includes(savedCurrency)) {
      setCurrency(savedCurrency);
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
