export const COLLECTIONS = {
  USER: 'user',
  SESSIONS: 'sessions',
  GENERATIONS: 'generations',
  IMAGES: 'images',
  INVOICES: 'invoices',
  PASSWORD_RESETS: 'password_resets',
  PROJECTS: 'projects',
  WALLET_TRANSACTIONS: 'wallet_transactions',
};

export const DB_NAME = process.env.MONGODB_DB_NAME || 'AI-IMAGE-GENERATOR';
