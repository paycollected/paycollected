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
      color: '#001C55',
      border: '2px solid',
      borderColor: '#001C55',
      _hover: {
        bg: '#001C55',
        color: '#A6E1FA',
        border: '2px solid',
        borderColor: 'white'
      }
    },
    solid: {
      bg: '#001C55',
      color: 'white',
      border: '2px solid transparent',
      _hover: {
        bg: '#A6E1FA',
        color: '#001C55',
        border: '2px solid'
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

export const textTheme = extendTheme({
  textStyles: {
    note: {
      color: '#718096',
      forntSize: '14px',
    }
  }
});

export const NavBarBtn = styled.button`
  &:hover {
    text-decoration: underline;
  }
`;
