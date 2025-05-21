import React, { Component, useMemo } from 'react';
import { Input as NativeBaseInput, IInputProps, useTheme } from 'native-base';

/**
 * Helper function to safely convert string numeric values to actual numbers
 */
const ensureNumericValues = (obj: any, numericProps: string[]) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result = { ...obj };
  
  for (const prop of numericProps) {
    if (prop in result && typeof result[prop] === 'string') {
      try {
        const numValue = parseFloat(result[prop]);
        if (!isNaN(numValue)) {
          result[prop] = numValue;
        }
      } catch (e) {
        console.warn(`Failed to convert ${prop} to number:`, e);
      }
    }
  }
  
  return result;
};

/**
 * SafeInput is a wrapper around NativeBase's Input component that ensures
 * all style properties that should be numbers are actually numbers, not strings.
 * This helps prevent "java.lang.String cannot be cast to java.lang.Double" errors.
 */
const SafeInput = (props: IInputProps) => {
  const theme = useTheme();
  
  // Create a safe copy of props
  const safeProps = { ...props };
  
  // Ensure numeric style properties are actually numbers
  const numericStyleProps = [
    'outlineWidth', 'borderWidth', 'borderRadius', 'borderTopWidth',
    'borderBottomWidth', 'borderLeftWidth', 'borderRightWidth',
    'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius',
    'borderBottomRightRadius', 'margin', 'marginTop', 'marginBottom',
    'marginLeft', 'marginRight', 'padding', 'paddingTop', 'paddingBottom',
    'paddingLeft', 'paddingRight', 'width', 'height', 'minWidth', 'minHeight',
    'maxWidth', 'maxHeight', 'top', 'bottom', 'left', 'right', 'flex',
    'opacity', 'zIndex', 'elevation'
  ];
  
  // Force numeric values for direct props
  if (safeProps._outlineWidth && typeof safeProps._outlineWidth === 'string') {
    safeProps._outlineWidth = parseFloat(safeProps._outlineWidth);
  }
  
  if (safeProps.outlineWidth && typeof safeProps.outlineWidth === 'string') {
    safeProps.outlineWidth = parseFloat(safeProps.outlineWidth);
  }
  
  // If there are style props, ensure they are numbers
  if (safeProps.style) {
    if (typeof safeProps.style === 'object' && safeProps.style !== null) {
      safeProps.style = ensureNumericValues(safeProps.style, numericStyleProps);
    }
  }
  
  // Create a memo'd component with direct outlineWidth prop override
  const Component = useMemo(() => {
    return (
      <NativeBaseInput 
        {...safeProps} 
        outlineWidth={0} // Force numeric 0 directly
        _outlineWidth={0} // Force numeric 0 directly
      />
    );
  }, [safeProps]);
  
  return Component;
};

export default SafeInput;
