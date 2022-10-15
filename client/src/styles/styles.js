import { defineStyle, defineStyleConfig } from '@chakra-ui/react';

export const buttonTheme = defineStyleConfig({
  defaultProps: {
    variant: 'outline',
    background: 'white',
    color: 'purple.500',
    border: '2px'
  }
});