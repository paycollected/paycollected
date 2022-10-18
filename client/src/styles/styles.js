import { defineStyle, defineStyleConfig } from '@chakra-ui/react';

// const outlined = defineStyle({
//   background: 'white',
//   fontWeight: 'semibold'
// });

export const buttonTheme = defineStyleConfig({
  baseStyle: {
    fontWeight: 'bold',
    borderRadius: '7px',
  },
  sizes: {
    md: {
      fontSize: 'md',
      px: 6,
      py: 4
    },
    lg: {
      fontSize: 'lg',
      px: 6,
      py: 8
    }
  },
  variants: {
    outline: {
      border: '2px solid',
      borderRadius: 5,
      background: 'white',
      color: '#001C55',
      _hover: {
        bg: '#001C55',
        color: '#A6E1FA'
      }
    },
    solid: {
      background: '#001C55',
      color: 'white',
      border: '2px solid transparent',
      _hover: {
        bg: '#A6E1FA',
        color: '#001C55',
        border: '2px solid #001C55'
      }
    }
  },
  defaultProps: {
    variant: 'solid',
    size: 'md'
  }
});

export const inputTheme = defineStyleConfig({
  baseStyle: {
    width: '40%'
  },
});
