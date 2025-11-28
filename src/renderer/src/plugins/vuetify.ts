import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { createVuetify, type ThemeDefinition } from 'vuetify'

const yisheLight: ThemeDefinition = {
  dark: false,
  colors: {
    background: '#fafafa',
    surface: '#ffffff',
    primary: '#1976d2',
    secondary: '#424242',
    accent: '#82b1ff',
    error: '#ff5252',
    info: '#2196f3',
    success: '#4caf50',
    warning: '#fb8c00'
  }
}

export const vuetify = createVuetify({
  defaults: {
    global: {
      density: 'compact',
      ripple: true,
      style: 'font-size: 12px; letter-spacing: 0.1px;'
    },
    VBtn: {
      height: 32,
      rounded: 'md',
      class: 'text-none font-weight-medium',
      style: 'font-size: 12px; letter-spacing: 0.2px;'
    },
    VListItem: {
      minHeight: 40,
      ripple: true,
      style: 'font-size: 12.5px;'
    },
    VChip: {
      density: 'comfortable',
      style: 'font-size: 11px; letter-spacing: 0.2px;'
    },
    VCardTitle: {
      style: 'font-size: 14px; font-weight: 600; letter-spacing: 0.2px;'
    },
    VTextField: {
      density: 'compact',
      style: 'font-size: 12px;'
    }
  },
  theme: {
    defaultTheme: 'yisheLight',
    themes: {
      yisheLight
    }
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi
    }
  }
})

export default vuetify

