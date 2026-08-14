/**
 * Currency Configuration
 * Defines supported currencies and exchange rates
 * Base currency: EUR (main currency)
 */

export const CURRENCIES = {
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    default: true,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
  },
};

// Exchange rates relative to EUR (base currency)
// Update these rates regularly based on current market rates
export const EXCHANGE_RATES = {
  EUR: 1.0,
  USD: 1.10, // 1 EUR = 1.10 USD (adjust to current rate)
  GBP: 0.92, // 1 EUR = 0.92 GBP (adjust to current rate)
};

// Price conversion helper
export const convertPrice = (priceInEur, toCurrency = 'EUR') => {
  const rate = EXCHANGE_RATES[toCurrency] || 1.0;
  return Math.round((priceInEur * rate) * 100) / 100;
};

// Format price with currency
export const formatPrice = (amount, currency = 'EUR') => {
  const currencyInfo = CURRENCIES[currency];
  if (!currencyInfo) return `${amount}`;
  return `${currencyInfo.symbol}${amount}`;
};

// Get all currency codes
export const getCurrencyCodes = () => Object.keys(CURRENCIES);

// Get default currency
export const getDefaultCurrency = () => {
  return Object.keys(CURRENCIES).find(code => CURRENCIES[code].default) || 'EUR';
};
