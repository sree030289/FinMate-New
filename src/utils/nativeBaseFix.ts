import { Input } from 'native-base';

/**
 * This function applies a patch to fix the issue with numeric style properties
 * being passed as strings in NativeBase components, which causes
 * "java.lang.String cannot be cast to java.lang.Double" errors on Android.
 */
export function applyNativeBaseFixes() {
  try {
    // Store the original render method
    const originalRender = Input.render;
    
    // Override the render method to ensure numeric properties are passed as numbers
    if (originalRender && typeof originalRender === 'function') {
      Input.render = function (...args) {
        const props = args[0] || {};
        
        // Create a new props object with safe numeric values
        const safeProps = { ...props };
        
        // Ensure outlineWidth is a number
        if (safeProps.outlineWidth !== undefined) {
          safeProps.outlineWidth = Number(safeProps.outlineWidth);
        }
        
        // Ensure _outlineWidth (used internally by NativeBase) is a number
        if (safeProps._outlineWidth !== undefined) {
          safeProps._outlineWidth = Number(safeProps._outlineWidth);
        }
        
        // Ensure borderWidth is a number
        if (safeProps.borderWidth !== undefined) {
          safeProps.borderWidth = Number(safeProps.borderWidth);
        }
        
        // Process nested style objects like _focus, _hover, etc.
        const styleProps = ['style', '_focus', '_hover', '_pressed', '_disabled'];
        styleProps.forEach(styleProp => {
          if (safeProps[styleProp]) {
            if (safeProps[styleProp].outlineWidth !== undefined) {
              safeProps[styleProp].outlineWidth = Number(safeProps[styleProp].outlineWidth);
            }
            if (safeProps[styleProp].borderWidth !== undefined) {
              safeProps[styleProp].borderWidth = Number(safeProps[styleProp].borderWidth);
            }
          }
        });
        
        // Call the original render method with safe props
        args[0] = safeProps;
        return originalRender.apply(this, args);
      };
      
      console.log('NativeBase Input patch applied successfully');
    } else {
      console.error('Could not patch NativeBase Input - render method not found');
    }
  } catch (error) {
    console.error('Error applying NativeBase Input patch:', error);
  }
}