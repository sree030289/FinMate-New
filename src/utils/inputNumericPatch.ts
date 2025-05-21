/**
 * This file patches NativeBase Input component styling to prevent 
 * "java.lang.String cannot be cast to java.lang.Double" errors
 */

import { Input } from 'native-base';

// Store the original render function
const originalRender = Input.render;

// Replace with our patched function
if (originalRender) {
  Input.render = function(...args) {
    const element = originalRender.apply(this, args);
    
    // Force numeric outlineWidth on the element's props
    if (element && element.props) {
      if (element.props.outlineWidth === "0") {
        element.props.outlineWidth = 0;
      }
      if (element.props._outlineWidth === "0") {
        element.props._outlineWidth = 0;
      }
      
      // If there's a style object
      if (element.props.style) {
        if (typeof element.props.style === 'object') {
          if (element.props.style.outlineWidth === "0") {
            element.props.style.outlineWidth = 0;
          }
        }
      }
    }
    
    return element;
  };
}

export default function applyInputPatch() {
  // Just importing this file will apply the patch
  console.log('[Input Numeric Patch] Applied patch to prevent string-to-double casting errors');
}
