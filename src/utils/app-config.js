import Constants from 'expo-constants';

// Access environment variables directly from Constants.expoConfig.extra
const getConfig = (key) => {
  if (Constants.expoConfig && Constants.expoConfig.extra) {
    return Constants.expoConfig.extra[key] || null;
  }
  return null;
};

// Default configuration values as fallbacks
const defaultConfig = {
  ocrApiKey: "",
  // Add other config values as needed
};

// Get a configuration value with fallback to default
export const getConfigValue = (key) => {
  return getConfig(key) || defaultConfig[key];
};

// You can store runtime values here
const runtimeConfig = {};

// Set a runtime configuration value
export const setRuntimeConfig = (key, value) => {
  runtimeConfig[key] = value;
};

// Get a runtime configuration value
export const getRuntimeConfig = (key) => {
  return runtimeConfig[key];
};

export default {
  getConfigValue,
  setRuntimeConfig,
  getRuntimeConfig
};
