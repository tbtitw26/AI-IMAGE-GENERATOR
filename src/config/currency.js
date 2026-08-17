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

// Convert an amount in any supported currency back to base EUR
export const convertToBaseEur = (amount, fromCurrency = 'EUR', decimals = 4) => {
  const rate = EXCHANGE_RATES[fromCurrency] || 1.0;
  const factor = 10 ** decimals;
  return Math.round((Number(amount) / rate) * factor) / factor;
};

// Format price with currency (adds thousands separators + 2 decimal places)
export const formatPrice = (amount, currency = 'EUR', options = {}) => {
  const currencyInfo = CURRENCIES[currency] || CURRENCIES.EUR;
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

/**
 * Unified Balance Helper:
 * Calculate the user's total unified balance in base EUR.
 * Supports balance stored as number or object ({ EUR, USD, GBP }).
 */
export const getUserTotalBalanceInEur = (user) => {
  if (!user) return 0;
  if (typeof user.balanceEur === 'number') {
    return user.balanceEur;
  }
  if (typeof user.balance === 'number') {
    return user.balance;
  }
  if (typeof user.balance === 'object' && user.balance !== null) {
    const eur = Number(user.balance.EUR || 0);
    const usd = Number(user.balance.USD || 0) / (EXCHANGE_RATES.USD || 1.10);
    const gbp = Number(user.balance.GBP || 0) / (EXCHANGE_RATES.GBP || 0.92);
    return eur + usd + gbp;
  }
  return 0;
};

/**
 * Get user balance converted to the target currency
 */
export const getUserBalance = (user, toCurrency = 'EUR', decimals = 2) => {
  const eurAmount = getUserTotalBalanceInEur(user);
  return convertPrice(eurAmount, toCurrency, decimals);
};

/**
 * Format user balance into string with symbol in the target currency
 */
export const formatUserBalance = (user, toCurrency = 'EUR', options = {}) => {
  const amount = getUserBalance(user, toCurrency, options.decimals ?? 2);
  return formatPrice(amount, toCurrency, options);
};

/**
 * Token Calculation for Image Generation:
 * Realistic multi-parameter token formula:
 * - Base Model Engine (Cinema 4K is substantially more expensive)
 * - Prompt length complexity
 * - Negative Prompt length complexity
 * - Aspect Ratio multiplier
 * - Batch image count
 * 
 * 1,000 Tokens = 1.00 EUR (0.001 EUR / token)
 */
export const MODEL_BASE_TOKENS = {
  'Aether Ultra': 180,
  'Cinema 4K': 480, // 4K high resolution render
  'Product Studio': 240,
  'Character Gen': 290,
};

export const ASPECT_MULTIPLIERS = {
  '1:1': 1.0,
  '4:3': 1.1,
  '3:4': 1.1,
  '16:9': 1.25,
  '9:16': 1.25,
};

export function calculateGenerationTokens({
  prompt = '',
  negativePrompt = '',
  model = 'Aether Ultra',
  aspectRatio = '1:1',
  imageCount = 1,
} = {}) {
  const baseEngine = MODEL_BASE_TOKENS[model] || 200;
  
  // Prompt complexity: +1 token per 4 chars
  const promptTokens = Math.max(12, Math.ceil((prompt.trim().length || 0) / 4));
  
  // Negative prompt complexity: +1 token per 5 chars
  const negativePromptTokens = negativePrompt.trim().length
    ? Math.ceil(negativePrompt.trim().length / 5)
    : 0;

  const aspectMultiplier = ASPECT_MULTIPLIERS[aspectRatio] || 1.0;
  
  const singleImageTokens = Math.round(
    (baseEngine + promptTokens + negativePromptTokens) * aspectMultiplier
  );
  
  const count = Math.max(1, Number(imageCount) || 1);
  const totalTokens = singleImageTokens * count;
  const costEur = Number((totalTokens / 1000).toFixed(3));

  return {
    singleImageTokens,
    totalTokens,
    costEur,
  };
}

