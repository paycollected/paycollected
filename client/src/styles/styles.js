import {
  extendTheme, defineStyleConfig, createMultiStyleConfigHelpers,
} from '@chakra-ui/react';
import {
  menuAnatomy, modalAnatomy, inputAnatomy, numberInputAnatomy
} from '@chakra-ui/anatomy';

export const buttonTheme = defineStyleConfig({
  baseStyle: {
    fontWeight: 600,
    borderRadius: '7px',
  },
  sizes: {
    sm: { fontSize: 'sm', borderRadius: '6px' },
    md: {
      fontSize: 'md', px: 8, borderRadius: '40px',
    },
    lg: {
      fontSize: 'md', px: 10, borderRadius: '40px',
    },
  },
  variants: {
    outline: {
      bg: 'white',
      color: 'blue.600',
      border: '1px solid',
      borderColor: 'blue.600',
      fontWeight: 500,
      // TODO: Hover styling
      _hover: {
        opacity: 0.7,
      }
    },
    solid: {
      bg: 'blue.600',
      color: 'white',
      border: '1px solid transparent',
      fontWeight: 500,
      // TODO: Hover styling
      _hover: {
        opacity: 0.8,
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
    },
    dismiss: {
      bg: 'transparent',
      color: 'blue.600',
      fontSize: 'sm',
      fontWeight: 'normal',
      pt: 0.5,
      px: 1,
      pb: 0,
      margin: 0,
      h: 'min-content',
      w: 'auto',
      _hover: {
        textDecoration: 'underline',
      }
    },
    outlineNuanced: {
      bg: 'transparent',
      color: 'gray.700',
      border: '1px solid',
      borderColor: 'gray.200',
      _hover: {
        opacity: 0.3,
      }
    },
    smEdit: {
      bg: 'transparent',
      border: 'none',
      height: 'max-content',
      fontWeight: 500,
      padding: 0,
      _hover: {
        opacity: 0.3,
      }
    },
    copyBtn: {
      bg: 'transparent',
      display: 'block',
      boxSizing: 'border-box',
      border: 'none',
      height: '100%',
      width: '100%',
      py: 0,
      px: '6',
      fontSize: '14px',
      fontWeight: 400,
      _hover: {
        opacity: 0.3,
      }
    }
  },
  defaultProps: {
    variant: 'solid',
    size: 'md',
  }
});

const {
  definePartsStyle: definePartsStyleMenu, defineMultiStyleConfig: defineMultiStyleConfigMenu
} = createMultiStyleConfigHelpers(menuAnatomy.keys);

const {
  definePartsStyle: definePartsStyleModal, defineMultiStyleConfig: defineMultiStyleConfigModal
} = createMultiStyleConfigHelpers(modalAnatomy.keys);

const {
  definePartsStyle: definePartsStyleInput, defineMultiStyleConfig: defineMultiStyleConfigInput
} = createMultiStyleConfigHelpers(inputAnatomy.keys);

const {
  definePartsStyle: definePartsStyleNumberInput,
  defineMultiStyleConfig: defineMultiStyleConfigNumberInput
} = createMultiStyleConfigHelpers(numberInputAnatomy.keys);

const menuTheme = defineMultiStyleConfigMenu({
  baseStyle: definePartsStyleMenu({
    item: { py: '4', fontFamily: "'Roboto', sans-serif", fontSize: '14px' },
  }),
});

const modalTheme = defineMultiStyleConfigModal({
  baseStyle: definePartsStyleModal({
    header: { pt: '10', px: '12' },
    body: { px: '12', pb: '6', pt: '4' },
    footer: { pb: '10', px: '12' },
    closeButton: { top: '6', right: '6' },
  }),
  defaultProps: { size: 'lg' },
  sizes: {
    xl: {
      header: { pt: '14', px: '14' },
      body: { px: '14', pb: '8', pt: '6' },
      footer: { pb: '14', px: '14' },
      closeButton: { top: '6', right: '10' },
    }
  }
});

const inputTheme = defineMultiStyleConfigInput({
  baseStyle: definePartsStyleInput({
    field: { color: 'gray.700' },
  })
});

const numberInputTheme = defineMultiStyleConfigNumberInput({
  baseStyle: definePartsStyleNumberInput({
    field: {
      color: 'blackAlpha.500',
      border: '1px solid',
      borderColor: 'gray.200',
    },
  }),
});

const headingTheme = defineStyleConfig({
  baseStyle: { color: '#2B6CB0' },
  variants: {
    accented: {
      color: '#272088',
      fontSize: '3xl',
      fontWeight: 700,
    },
    nuanced: {
      color: 'blackAlpha.700', fontSize: 'xl', fontWeight: 600,
    }
  },
  sizes: {
    md: { fontSize: '2xl' },
    lg: { fontSize: '3xl' },
  },
  defaultProps: { size: 'lg' }
});

export const globalTheme = extendTheme({
  components: {
    Button: buttonTheme,
    Input: inputTheme,
    Heading: headingTheme,
    Menu: menuTheme,
    Modal: modalTheme,
    NumberInput: numberInputTheme,
  },
  fonts: {
    heading: "'Inter', sans-serif",
    body: "'Inter', sans-serif",
  },
  textStyles: {
    note: { color: '#718096' },
    formLabel: { color: 'gray.700', fontWeight: 600, fontSize: 'sm' },
    formSavedInput: { color: 'blackAlpha.700', fontSize: 'md', fontWeight: 400 },
    gridTitle: { color: 'blackAlpha.800', fontWeight: 600, fontSize: 'md' },
  },
});

export const stripePaymentElementAppearance = {
  theme: 'stripe',
  variables: {
    fontFamily: 'Inter, sans-serif',
    colorText: '#2D3748',
    spacingGridRow: '1.5rem',
    spacingGridColumn: '2rem',
  },
  rules: {
    '.Label': {
      fontSize: '16px',
      marginBottom: '0.75rem',
    }
  }
};
