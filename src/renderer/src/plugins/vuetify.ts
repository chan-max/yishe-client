import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { createVuetify, type ThemeDefinition } from 'vuetify'

const yisheLight: ThemeDefinition = {
  dark: false,
  colors: {
    background: '#fafafa',
    surface: '#ffffff',
    primary: '#000000',
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
      ripple: false, // 扁平化风格：移除 ripple 效果
      style: 'font-size: 12px; letter-spacing: 0.1px;'
    },
    VBtn: {
      height: 32,
      rounded: 'sm', // 扁平化风格：使用小圆角
      elevation: 0, // 扁平化风格：移除阴影
      class: 'text-none font-weight-medium',
      style: 'font-size: 12px; letter-spacing: 0.2px;'
    },
    VListItem: {
      minHeight: 40,
      ripple: false, // 扁平化风格：移除 ripple 效果
      style: 'font-size: 12.5px;'
    },
    VChip: {
      density: 'comfortable',
      rounded: 'sm', // 扁平化风格：使用小圆角
      elevation: 0, // 扁平化风格：移除阴影
      style: 'font-size: 11px; letter-spacing: 0.2px;'
    },
    VCard: {
      elevation: 0, // 扁平化风格：移除阴影
      rounded: 'md', // 扁平化风格：使用中等圆角
      variant: 'flat' // 使用扁平变体
    },
    VCardTitle: {
      style: 'font-size: 14px; font-weight: 600; letter-spacing: 0.2px;'
    },
    VTextField: {
      density: 'compact',
      rounded: 'sm', // 扁平化风格：使用小圆角
      variant: 'outlined', // 使用 outlined 变体更符合扁平化
      style: 'font-size: 12px;'
    },
    VSheet: {
      elevation: 0, // 扁平化风格：移除阴影
      rounded: 'md' // 扁平化风格：使用中等圆角
    },
    VAppBar: {
      elevation: 0, // 扁平化风格：移除阴影
      flat: true // 使用扁平样式
    },
    VNavigationDrawer: {
      elevation: 0 // 扁平化风格：移除阴影
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

