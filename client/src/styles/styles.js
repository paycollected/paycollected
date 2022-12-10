import { extendTheme, defineStyleConfig } from '@chakra-ui/react';
import styled from 'styled-components';

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
      bg: 'white',
      color: '#2B6CB0',
      border: '2px solid',
      borderColor: '#2B6CB0',
      borderRadius: '40px',
      padding: '20px',
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
      padding: '20px',
      // TODO: Hover styling
      _hover: {
        bg: '#A6E1FA',
        color: '##2B6CB0',
        border: '2px solid'
      }
    },
    menu: {
      bg: 'transparent'
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

export const globalTheme = extendTheme({
  components: {
    Button: buttonTheme,
    Input: inputTheme,
    Heading: { baseStyle: { color: '#2B6CB0' } },
  },
  fonts: {
    heading: "'Inter' , sans-serif",
    body: "'Inter', sans-serif",
  },
  textStyles: {
    note: {
      color: '#718096',
      fontSize: '12px',
    },
    planNameHeader: { color: '#272088' }
  }
});

export const NavBarBtn = styled.button`
  &:hover {
    text-decoration: underline;
  }
`;
