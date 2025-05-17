import Constants from 'expo-constants';

// Runtime environment variables
const runtimeEnv = {
  OCR_API_KEY: Constants.expoConfig?.extra?.ocrApiKey || '',
};

// Get environment variable with possible override
export const getEnvSync = (key) => {
  return runtimeEnv[key] || '';
};

// Set environment variable
export const setEnv = (key, value) => {
  runtimeEnv[key] = value;
};

export default {
  getEnvSync,
  setEnv
};
