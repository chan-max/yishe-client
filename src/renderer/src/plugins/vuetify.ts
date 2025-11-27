import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { createVuetify, type ThemeDefinition } from 'vuetify'

const yisheLight: ThemeDefinition = {
  dark: false,
  colors: {
    background: '#f5f7fb',
    surface: '#ffffff',
    primary: '#2563eb',
    secondary: '#0ea5e9',
    success: '#16a34a',
    warning: '#f59e0b',
    error: '#dc2626'
  }
}

export const vuetify = createVuetify({
  defaults: {
    global: {
      density: 'compact',
      ripple: false,
      style: 'font-size: 12px; letter-spacing: 0.1px;'
    },
    VBtn: {
      height: 32,
      rounded: 'md',
      class: 'text-none font-weight-medium',
      style: 'font-size: 12px; letter-spacing: 0.2px;'
    },
    VListItem: {
      minHeight: 34,
      style: 'font-size: 12px;'
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

