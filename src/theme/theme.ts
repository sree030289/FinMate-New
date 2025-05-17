import { extendTheme } from 'native-base';

// Robinhood-inspired color palette
const colors = {
  primary: {
    50: '#E3F8FF',
    100: '#B3ECFF',
    200: '#81DEFD',
    300: '#5ED0FB',
    400: '#40C3FA',
    500: '#00B1F9', // Primary brand color similar to Robinhood
    600: '#008ED7',
    700: '#006DB6',
    800: '#004D94',
    900: '#003773',
  },
  green: {
    500: '#00C805', // Robinhood's green for positive values
  },
  red: {
    500: '#FF5000', // Robinhood's red for negative values
  },
  background: {
    light: '#FFFFFF',
    dark: '#1A1A1A',
  },
  card: {
    light: '#F9F9F9',
    dark: '#232323',
  },
  text: {
    light: '#000000',
    dark: '#FFFFFF',
  },
  secondaryText: {
    light: '#757575',
    dark: '#A3A3A3',
  },
  border: {
    light: '#E0E0E0',
    dark: '#333333',
  },
};

// Define theme config
const themeConfig = {
  useSystemColorMode: false,
  initialColorMode: 'light',
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
    initialColorMode: 'light',
  },
};

export default extendTheme(themeConfig);
