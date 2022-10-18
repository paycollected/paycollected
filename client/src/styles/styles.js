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
      borderColor: 'green.900',
      background: 'green.500',
      color: 'green.900',
      _hover: {
        bg: 'gray.50',
        color: 'green.800'
      }
    },
    solid: {
      bg: 'green.500',
      color: 'white',
      _hover: {
        color: 'green.900'
      }
    }
  },
  defaultProps: {
    variant: 'outline',
    size: 'md'
  }
});

export const inputTheme = defineStyleConfig({
  baseStyle: {
    width: '40%'
  },
});
