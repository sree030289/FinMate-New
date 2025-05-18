import { extendTheme } from 'native-base';

// Robinhood-inspired color palette
const colors = {
  primary: {
    50: '#E3FFE8',
    100: '#B3FFC2',
    200: '#81FF9D',
    300: '#5EFF79',
    400: '#40FF54',
    500: '#00C805', // Robinhood green as primary brand color
    600: '#00A504',
    700: '#008203',
    800: '#005F02',
    900: '#003D01',
  },
  green: {
    500: '#00C805', // Robinhood's green for positive values
  },
  red: {
    500: '#FF5000', // Robinhood's red for negative values
  },
  background: {
    light: '#000000', // Black background for light mode (Robinhood style)
    dark: '#000000', // Black background for dark mode (Robinhood style)
  },
  card: {
    light: '#1E2124', // Dark card for light mode (Robinhood style)
    dark: '#1E2124', // Dark card for dark mode (Robinhood style)
  },
  text: {
    light: '#FFFFFF', // White text for light mode (Robinhood style)
    dark: '#FFFFFF', // White text for dark mode
  },
  secondaryText: {
    light: '#A3A3A3', // Light gray text for light mode
    dark: '#A3A3A3', // Light gray text for dark mode
  },
  border: {
    light: '#333333', // Dark borders for light mode
    dark: '#333333', // Dark borders for dark mode
  },
};

// Define theme config
const themeConfig = {
  useSystemColorMode: false,
  initialColorMode: 'dark',
  colors,
  components: {
    Button: {
      baseStyle: {
        rounded: 'full',
      },
      variants: {
        solid: ({colorMode}: {colorMode: string}) => {
          return {
            bg: 'primary.500',
            _pressed: {
              bg: 'primary.600',
            },
          };
        },
        outline: ({colorMode}: {colorMode: string}) => {
          return {
            borderColor: 'primary.500',
            _pressed: {
              bg: colorMode === 'dark' ? 'primary.800' : 'primary.50',
            },
          };
        },
      },
    },
    Text: {
      baseStyle: ({colorMode}: {colorMode: string}) => {
        return {
          color: colorMode === 'dark' ? 'text.dark' : 'text.light',
        };
      },
    },
    Card: {
      baseStyle: ({colorMode}: {colorMode: string}) => {
        return {
          bg: colorMode === 'dark' ? 'card.dark' : 'card.light',
          borderColor: colorMode === 'dark' ? 'border.dark' : 'border.light',
        };
      },
    },
  },
  config: {
    useSystemColorMode: false, 
    initialColorMode: 'dark',
    enableColorModeTransition: true,
    accessibleColors: true,
  },
};

export default extendTheme(themeConfig);
