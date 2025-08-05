// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
} as const;

// MongoDB Connection Configuration (for documentation)
export const MONGODB_CONFIG = {
  CONNECTION_STRING: 'mongodb+srv://myclinicuser:<password>@<url>/?retryWrites=true&w=majority&appName=myclinic-cluster',
  DATABASE_NAME: 'assessment_app',
} as const;