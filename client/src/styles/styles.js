import {
  extendTheme, defineStyleConfig, createMultiStyleConfigHelpers,
} from '@chakra-ui/react';
import { menuAnatomy } from '@chakra-ui/anatomy';

export const buttonTheme = defineStyleConfig({
  baseStyle: {
    fontWeight: 600,
    borderRadius: '7px',
  },
  sizes: {
    md: { fontSize: 'sm', px: 6, py: 4 },
    lg: { fontSize: 'md', px: 8, py: 8 },
  },
  variants: {
    outline: {
      bg: 'white',
      color: '#2B6CB0',
      border: '2px solid',
      borderColor: '#2B6CB0',
      borderRadius: '40px',
      // TODO: Hover styling
      _hover: {
        bg: '##2B6CB0',
        color: '#A6E1FA',
        border: '2px solid',
        borderColor: 'white'
      }
    },
    solid: {
      bg: '#2B6CB0',
      color: 'white',
      border: '2px solid transparent',
      borderRadius: '40px',
      // TODO: Hover styling
      _hover: {
        bg: '#A6E1FA',
        color: '##2B6CB0',
        border: '2px solid'
      }
    },
    menuIcon: { bg: 'transparent' },
    navBarBtn: {
      bg: 'transparent',
      fontWeight: 'normal',
      fontSize: 'md',
      _hover: {
        textDecoration: 'underline',
      }
    },
    navActionBtn: {
      bg: 'transparent',
      color: 'blue.600',
      fontSize: 'sm',
      fontWeight: 'normal',
      padding: 0,
      margin: 0,
      h: 'min-content',
      _hover: {
        textDecoration: 'underline',
      }
    }
  },
  defaultProps: {
    variant: 'solid',
    size: 'md',
  }
});

export const inputTheme = defineStyleConfig({
  baseStyle: {
    width: '40%',
  },
});

const {
  definePartsStyle, defineMultiStyleConfig
} = createMultiStyleConfigHelpers(menuAnatomy.keys);

const menuTheme = defineMultiStyleConfig({
  baseStyle: definePartsStyle({
    item: { py: '4', fontFamily: "'Roboto', sans-serif", fontSize: '14px' },
  }),
});

const headingTheme = defineStyleConfig({
  baseStyle: { color: '#2B6CB0' },
  variants: {
    accented: {
      color: '#272088',
      fontSize: '2xl',
      fontWeight: 700,
    },
    nuanced: {
      color: 'blackAlpha.700', fontSize: 'xl', fontWeight: 600,
    }
  }
});

export const globalTheme = extendTheme({
  components: {
    Button: buttonTheme,
    Input: inputTheme,
    Heading: headingTheme,
    Menu: menuTheme,
  },
  fonts: {
    heading: "'Inter', sans-serif",
    body: "'Inter', sans-serif",
  },
  textStyles: {
    note: { color: '#718096' },
    formLabel: { color: 'gray.700', fontWeight: 600, fontSize: 'sm' },
    formSavedInput: { color: 'blackAlpha.700', fontSize: 'md', fontWeight: 400 },
  },
});
