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

// Price conversion helper. `decimals` controls rounding precision so small
// amounts (e.g. cost per megapixel, $0.004) don't get rounded away to 0.
export const convertPrice = (priceInEur, toCurrency = 'EUR', decimals = 2) => {
  const rate = EXCHANGE_RATES[toCurrency] || 1.0;
  const factor = 10 ** decimals;
  return Math.round(priceInEur * rate * factor) / factor;
};

// Format price with currency (adds thousands separators + 2 decimal places)
export const formatPrice = (amount, currency = 'EUR', options = {}) => {
  const currencyInfo = CURRENCIES[currency];
  if (!currencyInfo) return `${amount}`;
  const { decimals = 2 } = options;
  const formattedAmount = Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${currencyInfo.symbol}${formattedAmount}`;
};

// Convert + format a EUR-denominated price in one call
export const priceInCurrency = (priceInEur, currency = 'EUR', options = {}) => {
  const { decimals = 2 } = options;
  return formatPrice(convertPrice(priceInEur, currency, decimals), currency, options);
};

// Get all currency codes
export const getCurrencyCodes = () => Object.keys(CURRENCIES);

// Get default currency
export const getDefaultCurrency = () => {
  return Object.keys(CURRENCIES).find(code => CURRENCIES[code].default) || 'EUR';
};
