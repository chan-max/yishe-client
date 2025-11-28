<!--
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-01-XX XX:XX:XX
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-01-XX XX:XX:XX
 * @FilePath: /yishe-electron/src/renderer/src/views/Login.vue
 * @Description: 登录页面 - 参考设计样式
-->
<template>
  <v-app>
    <v-main class="login-main">
      <v-container fluid class="pa-0 fill-height">
        <v-row no-gutters class="fill-height">
          <!-- 左侧插画区域 -->
          <v-col cols="12" md="6" class="login-left d-none d-md-flex">
            <div class="login-illustration">
              <!-- 背景装饰 -->
              <div class="illustration-bg">
                <div class="bg-pattern"></div>
              </div>
              
              <!-- 插画内容 -->
              <div class="illustration-content">
                <!-- 可以在这里添加 SVG 插画或使用 CSS 绘制简单图形 -->
                <div class="illustration-figure">
                  <div class="figure-desk">
                    <div class="desk-monitor"></div>
                    <div class="desk-chair"></div>
                  </div>
                </div>
              </div>
            </div>
          </v-col>

          <!-- 右侧登录表单区域 -->
          <v-col cols="12" md="6" class="login-right">
            <div class="login-form-wrapper">
              <v-card class="login-card" elevation="0" rounded="lg">
                <v-card-text class="pa-8">
                  <!-- 标题 -->
                  <div class="text-center mb-8">
                    <h1 class="text-h3 font-weight-bold mb-2">Hello!</h1>
                    <p class="text-body-1 text-medium-emphasis">Sign In to Get Started</p>
                  </div>

                  <!-- 登录表单 -->
                  <v-form ref="formRef" v-model="formValid" @submit.prevent="handleLogin">
                    <v-text-field
                      v-model="form.account"
                      label="账号"
                      prepend-inner-icon="mdi-email-outline"
                      variant="outlined"
                      :rules="accountRules"
                      required
                      class="mb-4"
                      autocomplete="username"
                      density="comfortable"
                      color="primary"
                      bg-color="white"
                    />

                    <v-text-field
                      v-model="form.password"
                      label="密码"
                      prepend-inner-icon="mdi-lock-outline"
                      variant="outlined"
                      :type="showPassword ? 'text' : 'password'"
                      :append-inner-icon="showPassword ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
                      :rules="passwordRules"
                      required
                      class="mb-2"
                      autocomplete="current-password"
                      density="comfortable"
                      color="primary"
                      bg-color="white"
                      @click:append-inner="showPassword = !showPassword"
                      @keyup.enter="handleLogin"
                    />

                    <div class="text-right mb-6">
                      <a href="#" class="text-caption text-primary text-decoration-none">
                        忘记密码？
                      </a>
                    </div>

                    <v-alert
                      v-if="errorMessage"
                      type="error"
                      variant="tonal"
                      class="mb-4"
                      closable
                      density="compact"
                      @click:close="errorMessage = ''"
                    >
                      {{ errorMessage }}
                    </v-alert>

                    <v-btn
                      type="submit"
                      color="primary"
                      size="large"
                      block
                      :loading="loading"
                      :disabled="!formValid || loading"
                      class="mb-4"
                      elevation="0"
                    >
                      登录
                    </v-btn>
                  </v-form>
                </v-card-text>
              </v-card>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { login } from '../api/auth'

const emit = defineEmits<{
  (e: 'login-success'): void
}>()

const formRef = ref()
const formValid = ref(false)
const loading = ref(false)
const showPassword = ref(false)
const errorMessage = ref('')

const form = reactive({
  account: '',
  password: ''
})

const accountRules = [
  (v: string) => !!v || '请输入账号',
  (v: string) => (v && v.length >= 3) || '账号长度至少3个字符'
]

const passwordRules = [
  (v: string) => !!v || '请输入密码',
  (v: string) => (v && v.length >= 6) || '密码长度至少6个字符'
]

const handleLogin = async () => {
  if (!formValid.value) return

  loading.value = true
  errorMessage.value = ''

  try {
    await login({
      username: form.account,  // 表单中使用 account，但传给 API 时转换为 username
      password: form.password
    })
    
    emit('login-success')
  } catch (error: any) {
    console.error('登录失败:', error)
    errorMessage.value = error?.response?.data?.message || error?.message || '登录失败，请检查账号密码'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-main {
  background-color: #ffffff;
}

.fill-height {
  min-height: 100vh;
}

/* 左侧插画区域 */
.login-left {
  position: relative;
  background-color: #ffffff;
  overflow: hidden;
}

.login-illustration {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

.illustration-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.bg-pattern {
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(circle at 20% 30%, rgba(25, 118, 210, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(25, 118, 210, 0.08) 0%, transparent 50%),
    linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, transparent 100%);
  background-size: 200% 200%;
  animation: patternMove 20s ease infinite;
}

@keyframes patternMove {
  0%, 100% {
    background-position: 0% 0%;
  }
  50% {
    background-position: 100% 100%;
  }
}

.illustration-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 500px;
  height: 400px;
}

.illustration-figure {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.figure-desk {
  position: relative;
  width: 300px;
  height: 300px;
}

.desk-monitor {
  width: 180px;
  height: 120px;
  background: #e0e0e0;
  border-radius: 8px;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.desk-monitor::before {
  content: '';
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  bottom: 8px;
  background: #1976d2;
  border-radius: 4px;
  opacity: 0.3;
}

.desk-chair {
  width: 60px;
  height: 80px;
  background: #424242;
  border-radius: 4px;
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 右侧登录表单区域 */
.login-right {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  padding: 24px;
  position: relative;
  overflow: hidden;
}

.login-right::before {
  content: '';
  position: absolute;
  bottom: -100px;
  right: -100px;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.login-form-wrapper {
  width: 100%;
  max-width: 420px;
  position: relative;
  z-index: 1;
}

.login-card {
  background-color: #ffffff !important;
  border-radius: 16px !important;
}

/* 响应式调整 */
@media (max-width: 960px) {
  .login-right {
    padding: 32px 24px;
  }
  
  .login-form-wrapper {
    max-width: 100%;
  }
  
  .login-card {
    border-radius: 12px !important;
  }
}

/* Vuetify 组件样式优化 */
:deep(.v-text-field .v-field) {
  border-radius: 8px;
  background-color: #ffffff;
}

:deep(.v-text-field .v-field__outline) {
  border-color: rgba(0, 0, 0, 0.12);
}

:deep(.v-text-field .v-field--focused .v-field__outline) {
  border-color: #1976d2;
  border-width: 2px;
}

:deep(.v-btn) {
  text-transform: none;
  letter-spacing: 0.5px;
  font-weight: 500;
  border-radius: 8px;
}

:deep(.v-alert) {
  border-radius: 8px;
}

:deep(.v-card-text) {
  padding: 32px !important;
}

@media (max-width: 600px) {
  :deep(.v-card-text) {
    padding: 24px !important;
  }
}
</style>
