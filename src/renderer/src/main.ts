import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import { vuetify } from './plugins/vuetify'

// Ant Design Vue 全局引入
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'

createApp(App).use(vuetify).use(Antd).mount('#app')
