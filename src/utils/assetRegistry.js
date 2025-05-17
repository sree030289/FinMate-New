// This file helps register asset paths for Metro bundler

// Register asset paths - import this file in your App.js or index.js
const registerAssets = () => {
  // Nothing to do here - just importing this file is enough to make bundler aware
  // that we're using these assets
  const assetPaths = [
    require('../../assets/placeholder.png'),
    require('../../assets/finmate-logo.png'),
    require('../../assets/icon.png'),
    require('../../assets/splash-icon.png'),
    require('../../assets/adaptive-icon.png'),
    require('../../assets/favicon.png')
  ];
  return assetPaths;
};

export default registerAssets;
