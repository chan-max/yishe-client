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
    <div class="login-shell">
      <!-- Illustration block -->
      <section class="hero-panel">
        <header class="hero-header">
          <div class="brand-mark">
            <span class="brand-dot"></span>
            <span class="brand-name">sneat</span>
          </div>
        </header>
        <div class="hero-figure">
          <div class="hero-illustration">
            <div class="orbit orbit-sm"></div>
            <div class="orbit orbit-md"></div>
            <div class="orbit orbit-lg"></div>
            <div class="astronaut">
              <div class="astronaut-head"></div>
              <div class="astronaut-body"></div>
              <div class="astronaut-arm left"></div>
              <div class="astronaut-arm right"></div>
              <div class="astronaut-leg left"></div>
              <div class="astronaut-leg right"></div>
            </div>
            <div class="floating-card card-one"></div>
            <div class="floating-card card-two"></div>
            <div class="floating-card card-three"></div>
            <div class="floating-rocket"></div>
          </div>
        </div>
      </section>

      <!-- Form block -->
      <section class="form-panel">
        <div class="form-card">
          <div class="welcome-block">
            <h1>Welcome to Sneat! 👋</h1>
            <p>Please sign-in to your account and start the adventure</p>
          </div>

          <div class="credential-hint">
            <div>
              <strong>Admin Email:</strong> admin@demo.com / Pass: <span>admin</span>
            </div>
            <div>
              <strong>Client Email:</strong> client@demo.com / Pass: <span>client</span>
            </div>
          </div>

          <v-form ref="formRef" v-model="formValid" @submit.prevent="handleLogin" class="login-form">
            <v-text-field
              v-model="form.account"
              label="Email"
              variant="outlined"
              density="comfortable"
              color="primary"
              bg-color="white"
              placeholder="admin@demo.com"
              prepend-inner-icon="mdi-email-outline"
              :rules="accountRules"
              autocomplete="username"
              class="mb-3"
            />

            <v-text-field
              v-model="form.password"
              label="Password"
              variant="outlined"
              density="comfortable"
              color="primary"
              bg-color="white"
              placeholder="•••••••"
              prepend-inner-icon="mdi-lock-outline"
              :append-inner-icon="showPassword ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
              :type="showPassword ? 'text' : 'password'"
              :rules="passwordRules"
              autocomplete="current-password"
              class="mb-1"
              @click:append-inner="showPassword = !showPassword"
            />

            <div class="form-meta">
              <v-checkbox
                v-model="rememberMe"
                label="Remember me"
                hide-details
                density="compact"
                color="primary"
              />
              <a class="link" href="javascript:void(0)">Forgot Password?</a>
            </div>

            <v-alert
              v-if="errorMessage"
              type="error"
              variant="tonal"
              class="mb-4"
              density="comfortable"
              closable
              @click:close="errorMessage = ''"
            >
              {{ errorMessage }}
            </v-alert>

            <v-btn
              type="submit"
              color="primary"
              size="large"
              block
              elevation="0"
              class="login-btn"
              :disabled="!formValid || loading"
              :loading="loading"
            >
              Login
            </v-btn>
          </v-form>

          <div class="account-switch">
            New on our platform?
            <a class="link" href="javascript:void(0)">Create an account</a>
          </div>

          <div class="divider">
            <span>or</span>
          </div>

          <div class="social-row">
            <v-btn icon="mdi-facebook" variant="outlined" size="large" color="#3b5998" />
            <v-btn icon="mdi-twitter" variant="outlined" size="large" color="#1da1f2" />
            <v-btn icon="mdi-github" variant="outlined" size="large" color="#0f172a" />
            <v-btn icon="mdi-google" variant="outlined" size="large" color="#ea4335" />
          </div>
        </div>
      </section>
    </div>
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
const rememberMe = ref(false)
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
.login-shell {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(120deg, #f5f4ff 0%, #fef9ff 40%, #ffffff 100%);
}

.hero-panel {
  flex: 1.1;
  padding: 48px 64px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.hero-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 48px;
}

.brand-mark {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 20px;
  color: #5f5af2;
}

.brand-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6d5efc, #9c6ffb);
  box-shadow: 0 6px 18px rgba(109, 94, 252, 0.35);
}

.hero-figure {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-illustration {
  width: 520px;
  height: 520px;
  position: relative;
}

.orbit {
  position: absolute;
  border-radius: 50%;
  border: 1px dashed rgba(99, 102, 241, 0.3);
  animation: orbitSpin 18s linear infinite;
}

.orbit-sm {
  width: 220px;
  height: 220px;
  top: 150px;
  left: 150px;
}

.orbit-md {
  width: 320px;
  height: 320px;
  top: 100px;
  left: 100px;
  animation-duration: 24s;
}

.orbit-lg {
  width: 420px;
  height: 420px;
  top: 50px;
  left: 50px;
  animation-duration: 30s;
}

.astronaut {
  position: absolute;
  top: 170px;
  left: 200px;
  width: 140px;
  height: 200px;
}

.astronaut-head {
  width: 70px;
  height: 70px;
  background: #fff;
  border-radius: 50%;
  margin: 0 auto;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
  position: relative;
}

.astronaut-head::after {
  content: '';
  position: absolute;
  inset: 12px;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.7), #5c6bc0);
  border-radius: 50%;
}

.astronaut-body {
  width: 90px;
  height: 120px;
  background: linear-gradient(135deg, #ffb74d, #ff7043);
  border-radius: 40px;
  margin: -10px auto 0;
  box-shadow: 0 10px 30px rgba(255, 112, 67, 0.25);
}

.astronaut-arm,
.astronaut-leg {
  position: absolute;
  background: linear-gradient(135deg, #ec4899, #f472b6);
  border-radius: 20px;
}

.astronaut-arm {
  width: 70px;
  height: 16px;
  top: 120px;
}

.astronaut-arm.left {
  left: 0;
  transform-origin: left center;
  animation: wave 3s ease-in-out infinite;
}

.astronaut-arm.right {
  right: 0;
}

.astronaut-leg {
  width: 18px;
  height: 70px;
  bottom: 0;
  background: #5c6bc0;
}

.astronaut-leg.left {
  left: 34px;
}

.astronaut-leg.right {
  right: 34px;
}

.floating-card {
  position: absolute;
  width: 120px;
  height: 80px;
  border-radius: 16px;
  background: rgba(96, 165, 250, 0.15);
  border: 1px solid rgba(96, 165, 250, 0.2);
  box-shadow: 0 10px 25px rgba(59, 130, 246, 0.15);
  animation: float 6s ease-in-out infinite;
}

.floating-card.card-one {
  top: 40px;
  left: 260px;
}

.floating-card.card-two {
  bottom: 80px;
  left: 120px;
  animation-delay: 1s;
}

.floating-card.card-three {
  bottom: 60px;
  right: 100px;
  animation-delay: 2s;
}

.floating-rocket {
  position: absolute;
  width: 60px;
  height: 130px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 30px 30px 0 0;
  right: 130px;
  top: 60px;
  transform-origin: center;
  animation: rocket 6s ease-in-out infinite;
}

.floating-rocket::before,
.floating-rocket::after {
  content: '';
  position: absolute;
  bottom: -12px;
  width: 18px;
  height: 18px;
  background: #ec4899;
  clip-path: polygon(50% 0, 0 100%, 100% 100%);
}

.floating-rocket::before {
  left: -10px;
}

.floating-rocket::after {
  right: -10px;
}

.form-panel {
  flex: 0.9;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 32px;
  background: #fff;
}

.form-card {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 35px 80px rgba(15, 23, 42, 0.08);
}

.welcome-block h1 {
  font-size: 28px;
  margin-bottom: 8px;
  color: #111827;
}

.welcome-block p {
  margin: 0;
  color: #6b7280;
}

.credential-hint {
  background: #f3f4ff;
  border-radius: 16px;
  padding: 14px 18px;
  margin: 24px 0 32px;
  font-size: 13px;
  color: #4f46e5;
  line-height: 1.6;
  border: 1px solid rgba(79, 70, 229, 0.15);
}

.login-form {
  display: flex;
  flex-direction: column;
}

.form-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 12px;
}

.link {
  color: #5f5af2;
  font-weight: 500;
  text-decoration: none;
  font-size: 14px;
}

.login-btn {
  height: 48px;
  border-radius: 12px;
  font-size: 16px;
  margin-bottom: 12px;
}

.account-switch {
  text-align: center;
  font-size: 14px;
  color: #6b7280;
  margin: 12px 0 16px;
}

.divider {
  display: flex;
  align-items: center;
  text-transform: uppercase;
  font-size: 12px;
  color: #9ca3af;
  gap: 12px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e5e7eb;
}

.social-row {
  display: flex;
  gap: 14px;
  margin-top: 18px;
  justify-content: center;
}

@keyframes orbitSpin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-14px);
  }
}

@keyframes wave {
  0%,
  100% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(12deg);
  }
}

@keyframes rocket {
  0%,
  100% {
    transform: translateY(0) rotate(-10deg);
  }
  50% {
    transform: translate(-10px, -20px) rotate(-5deg);
  }
}

@media (max-width: 960px) {
  .login-shell {
    flex-direction: column;
  }
  .hero-panel {
    padding: 32px 24px;
  }
  .form-panel {
    padding: 32px 16px 48px;
  }
  .form-card {
    padding: 32px 24px;
  }
}

::deep(.v-text-field .v-field) {
  border-radius: 12px;
}

::deep(.v-text-field .v-field__outline) {
  border-color: rgba(148, 163, 184, 0.6);
}

::deep(.v-text-field .v-field--focused .v-field__outline) {
  border-color: #5f5af2;
  border-width: 2px;
}

::deep(.v-checkbox .v-selection-control__input) {
  margin-inline-end: 8px;
}

::deep(.v-btn.login-btn) {
  text-transform: none;
  font-weight: 600;
  border-radius: 12px;
}

::deep(.v-btn.v-btn--outlined) {
  border-radius: 12px;
}
</style>
