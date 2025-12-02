<!--
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-01-XX XX:XX:XX
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-01-XX XX:XX:XX
 * @FilePath: /yishe-electron/src/renderer/src/views/Login.vue
 * @Description: 登录页面 - 参考设计样式
-->
<template>
  <div class="login-shell">
    <!-- Illustration block -->
    <section class="hero-panel">
      <header class="hero-header"></header>
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

    <!-- Form block：Element Plus 表单 -->
    <section class="form-panel">
      <div class="form-card">
        <div class="welcome-block">
          <h1>欢迎使用衣设客户端</h1>
          <p>登录账号，即可开启智能设计与任务管理体验</p>
        </div>

        <el-form class="form" label-position="top" @submit.prevent="handleLogin" autocomplete="on">
          <el-form-item label="账号" :error="accountHelp || undefined">
            <el-input
              v-model="form.account"
              size="large"
              clearable
              autocomplete="username"
              placeholder="请输入账号"
            />
          </el-form-item>

          <el-form-item label="密码" :error="passwordHelp || undefined">
            <el-input
              v-model="form.password"
              size="large"
              autocomplete="current-password"
              placeholder="请输入密码"
              show-password
            />
          </el-form-item>

          <div class="flex-row">
            <el-checkbox v-model="rememberMe">记住我</el-checkbox>
            <el-link class="span" disabled>忘记密码？</el-link>
          </div>

          <el-alert
            v-if="errorMessage"
            class="form-error-alert"
            type="error"
            :title="errorMessage"
            show-icon
          />

          <el-button
            class="button-submit"
            type="primary"
            size="large"
            :loading="loading"
            :disabled="!formValid"
            native-type="submit"
          >
            立即登录
          </el-button>

          <p class="p">
            还没有账号？
            <span class="span">联系管理员开通</span>
          </p>
        </el-form>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { login } from '../api/auth'

const emit = defineEmits<{
  (e: 'login-success'): void
}>()

const loading = ref(false)
const rememberMe = ref(false)
const errorMessage = ref('')

const form = reactive({
  account: '',
  password: ''
})

const formValid = computed(() => form.account.trim().length >= 3 && form.password.length >= 6)

const accountHelp = computed(() => {
  if (!form.account) return ''
  return form.account.trim().length >= 3 ? '' : '账号长度至少 3 位'
})

const passwordHelp = computed(() => {
  if (!form.password) return ''
  return form.password.length >= 6 ? '' : '密码长度至少 6 位'
})

const handleLogin = async () => {
  if (!formValid.value) return

  loading.value = true
  errorMessage.value = ''

  try {
    await login({
      username: form.account,  // 表单中使用 account，但传给 API 时转换为 username
      password: form.password
    })
    
    // 登录成功，保持loading状态直到页面跳转
    emit('login-success')
    // 不在这里关闭loading，让loading状态保持到组件被销毁（页面跳转）
  } catch (error: any) {
    console.error('登录失败:', error)
    errorMessage.value = error?.response?.data?.message || error?.message || '登录失败，请检查账号密码'
    loading.value = false // 只在失败时关闭loading
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
  color: var(--theme-primary);
}

.brand-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--theme-primary), rgba(var(--theme-primary-rgb), 0.7));
  box-shadow: none;
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
  box-shadow: none;
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
  box-shadow: none;
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
  box-shadow: none;
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
  max-width: 480px;
  background: #fff;
  border-radius: 18px;
  padding: 20px 24px;
  box-shadow: none;
  border: 1px solid rgba(148, 163, 184, 0.15);
}

.welcome-block h1 {
  font-size: 22px;
  margin-bottom: 6px;
  color: #111827;
}

.welcome-block p {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background-color: #ffffff;
  padding: 20px 24px;
  border-radius: 18px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
    'Open Sans', 'Helvetica Neue', sans-serif;
}

.flex-column > label {
  color: #151717;
  font-weight: 600;
  font-size: 13px;
}

.inputForm {
  border: 1.5px solid #ecedec;
  border-radius: 10px;
  height: 46px;
  display: flex;
  align-items: center;
  padding-left: 8px;
  transition: 0.2s ease-in-out;
  background: #fff;
}

.inputForm:focus-within {
  border-color: var(--theme-primary);
  box-shadow: none;
  border-width: 2px;
}

.input {
  margin-left: 8px;
  border: none;
  width: 100%;
  height: 100%;
  font-size: 13px;
  font-family: inherit;
}

.input:focus {
  outline: none;
}

.input-action {
  border: none;
  background: transparent;
  margin-right: 8px;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
}

.input-action:hover {
  color: var(--theme-primary);
}

.flex-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
}

.remember {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #151717;
}

.remember input {
  accent-color: var(--theme-primary);
}

.span {
  font-size: 13px;
  color: var(--theme-primary);
  font-weight: 500;
  cursor: pointer;
}

.form-error {
  margin: 4px 0 0;
  color: #ef4444;
  font-size: 12px;
}

.button-submit {
  margin: 10px 0 2px;
  background-color: #151717;
  border: none;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  border-radius: 10px;
  height: 48px;
  width: 100%;
  cursor: pointer;
  transition: background 0.2s ease;
}

.button-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.button-submit:hover:not(:disabled) {
  background-color: #252727;
}

.p {
  text-align: center;
  color: #151717;
  font-size: 13px;
  margin: 6px 0;
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
</style>
