// src/dalscooter-theme.js

export const dalscooterTheme = {
  name: 'dalscooter-theme',
  tokens: {
    fonts: {
      default: {
        variable: 'Inter, system-ui, sans-serif',
      },
    },
    colors: {
      background: {
        primary: '#f9fbfd', // subtle light gray
      },
      brand: {
        primary: {
          10: '#e3f2f7',
          80: '#124559', // DALScooter blue
        },
      },
      font: {
        primary: '#1f2937',   // dark slate
        secondary: '#6b7280', // soft gray
        inverse: '#ffffff',
      },
    },
    components: {
      button: {
        primary: {
          backgroundColor: '{colors.brand.primary.80}',
          borderRadius: '8px',
          color: '{colors.font.inverse}',
          fontWeight: '600',
          _hover: {
            backgroundColor: '#0f3e4b',
          },
        },
      },
      fieldcontrol: {
        borderRadius: '8px',
        borderColor: '#cbd5e0',
        fontSize: '1rem',
        padding: '0.75rem',
      },
      authenticator: {
        container: {
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.08)',
          padding: '2.5rem',
        },
      },
      tabs: {
        item: {
          fontWeight: '600',
          color: '{colors.font.secondary}',
          _active: {
            color: '{colors.brand.primary.80}',
          },
        },
      },
    },
  },
};
