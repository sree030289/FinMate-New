export default function registerAssets() {
  try {
    return {
      placeholder: require('../../assets/placeholder.png'),
      finmateLogo: require('../../assets/finmate-logo.png'),
      icon: require('../../assets/icon.png'),
      splashIcon: require('../../assets/splash-icon.png'),
      adaptiveIcon: require('../../assets/adaptive-icon.png'),
      favicon: require('../../assets/favicon.png')
    };
  } catch (error) {
    console.warn('Error registering assets:', error);
    return {};
  }
}