import React from 'react';
import { Image } from 'native-base';

// A component that safely handles image loading with fallbacks
const SafeImage = ({ source, fallbackSource, ...props }) => {
  // Default fallback image
  const defaultFallback = require('../../assets/placeholder.png');
  
  // Handle images safely
  const getSource = () => {
    try {
      // If source is a require() statement or an object with uri, use it directly
      if (source) {
        return source;
      }
      
      // If we have a fallback, try that
      if (fallbackSource) {
        return fallbackSource;
      }
      
      // Use default fallback as last resort
      return defaultFallback;
    } catch (error) {
      console.warn('Failed to load image, using fallback', error);
      return defaultFallback;
    }
  };
  
  return (
    <Image 
      source={getSource()} 
      alt={props.alt || "Image"}
      {...props}
    />
  );
};

export default SafeImage;
