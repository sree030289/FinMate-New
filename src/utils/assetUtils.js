// Asset utility functions

// Helper to safely require an asset with fallback
export const requireAsset = (assetPath, fallbackPath = './assets/placeholder.png') => {
  try {
    // Try to require the requested asset
    return require(assetPath);
  } catch (error) {
    console.warn(`Failed to load asset: ${assetPath}, using fallback`);
    try {
      // Try to require the fallback
      return require(fallbackPath);
    } catch (fallbackError) {
      // If even fallback fails, return an empty object
      console.error(`Failed to load fallback asset: ${fallbackPath}`);
      return { uri: '' };
    }
  }
};

// Preload all assets used in the app
export const preloadAppAssets = () => {
  return {
    placeholder: require('../../assets/placeholder.png'),
    finmateLogo: require('../../assets/finmate-logo.png'),
    icon: require('../../assets/icon.png'),
    splashIcon: require('../../assets/splash-icon.png'),
    adaptiveIcon: require('../../assets/adaptive-icon.png'),
    favicon: require('../../assets/favicon.png')
  };
};
