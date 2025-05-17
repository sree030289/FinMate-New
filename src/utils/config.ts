/**
 * Application Configuration
 * 
 * This module provides a centralized way to manage configuration values
 */

// Default configuration values
const defaultConfig = {
  // API Keys
  OCR_API_KEY: '',
  
  // Environment
  IS_DEVELOPMENT: __DEV__,
  
  // Features flags
  ENABLE_ANALYTICS: true,
  ENABLE_CRASH_REPORTING: true,
  
  // App Settings
  APP_VERSION: '1.0.0',
  MIN_PASSWORD_LENGTH: 8,
  
  // Storage keys
  STORAGE_KEYS: {
    OCR_API_KEY: 'ocr_api_key',
    USER_SETTINGS: 'user_settings',
    THEME_PREFERENCE: 'theme_preference',
  }
};

// Runtime config that can be modified
let runtimeConfig = { ...defaultConfig };

/**
 * Get a configuration value
 */
export const getConfig = <K extends keyof typeof defaultConfig>(
  key: K
): typeof defaultConfig[K] => {
  return runtimeConfig[key];
};

/**
 * Set a configuration value at runtime
 */
export const setConfig = <K extends keyof typeof defaultConfig>(
  key: K,
  value: typeof defaultConfig[K]
): void => {
  runtimeConfig[key] = value;
};

/**
 * Get all configuration values
 */
export const getAllConfig = () => {
  return { ...runtimeConfig };
};

export default {
  getConfig,
  setConfig,
  getAllConfig
};
