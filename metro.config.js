// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  const { resolver } = config;

  // Firebase compatibility fixes for Expo SDK 53
  config.resolver = {
    ...resolver,
    sourceExts: [...resolver.sourceExts, 'cjs'],
    unstable_enablePackageExports: false
  };

  return config;
})();
