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

      <!-- Form block -->
      <section class="form-panel">
        <div class="form-card">
          <div class="welcome-block">
            <h1>欢迎使用衣设客户端</h1>
            <p>登录账号，即可开启智能设计与任务管理体验</p>
          </div>

          <form class="form" @submit.prevent="handleLogin">
            <div class="flex-column">
              <label>账号</label>
            </div>
            <div class="inputForm">
              <svg
                height="20"
                viewBox="0 0 32 32"
                width="20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g data-name="Layer 3">
                  <path
                    d="m30.853 13.87a15 15 0 0 0 -29.729 4.082 15.1 15.1 0 0 0 12.876 12.918 15.6 15.6 0 0 0 2.016.13 14.85 14.85 0 0 0 7.715-2.145 1 1 0 1 0 -1.031-1.711 13.007 13.007 0 1 1 5.458-6.529 2.149 2.149 0 0 1 -4.158-.759v-10.856a1 1 0 0 0 -2 0v1.726a8 8 0 1 0 .2 10.325 4.135 4.135 0 0 0 7.83.274 15.2 15.2 0 0 0 .823-7.455zm-14.853 8.13a6 6 0 1 1 6-6 6.006 6.006 0 0 1 -6 6z"
                  />
                </g>
              </svg>
              <input
                v-model.trim="form.account"
                autocomplete="username"
                class="input"
                placeholder="请输入账号"
                type="text"
              />
            </div>

            <div class="flex-column">
              <label>密码</label>
            </div>
            <div class="inputForm">
              <svg
                height="20"
                viewBox="-64 0 512 512"
                width="20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="m336 512h-288c-26.453125 0-48-21.523438-48-48v-224c0-26.476562 21.546875-48 48-48h288c26.453125 0 48 21.523438 48 48v224c0 26.476562-21.546875 48-48 48zm-288-288c-8.8125 0-16 7.167969-16 16v224c0 8.832031 7.1875 16 16 16h288c8.8125 0 16-7.167969 16-16v-224c0-8.832031-7.1875-16-16-16zm0 0"
                />
                <path
                  d="m304 224c-8.832031 0-16-7.167969-16-16v-80c0-52.929688-43.070312-96-96-96s-96 43.070312-96 96v80c0 8.832031-7.167969 16-16 16s-16-7.167969-16-16v-80c0-70.59375 57.40625-128 128-128s128 57.40625 128 128v80c0 8.832031-7.167969 16-16 16zm0 0"
                />
              </svg>
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                class="input"
                placeholder="请输入密码"
              />
              <button
                type="button"
                class="input-action"
                @click="showPassword = !showPassword"
                aria-label="Toggle password visibility"
              >
                <svg viewBox="0 0 576 512" height="18" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.3-3.3c-5.5-1.8-11.9 1.6-11.7 7.4c.3 6.9 1.3 13.8 3.2 20.7c13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3z"
                  />
                </svg>
              </button>
            </div>

            <div class="flex-row">
              <label class="remember">
                <input type="checkbox" v-model="rememberMe" />
                记住我
              </label>
              <span class="span">忘记密码？</span>
            </div>

            <p v-if="errorMessage" class="form-error">
              {{ errorMessage }}
            </p>

            <button class="button-submit" type="submit" :disabled="!formValid || loading">
              <span v-if="!loading">立即登录</span>
              <span v-else>正在登录...</span>
            </button>

            <p class="p">
              还没有账号？
              <span class="span">联系管理员开通</span>
            </p>
          </form>
        </div>
      </section>
    </div>
  </v-app>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { login } from '../api/auth'

const emit = defineEmits<{
  (e: 'login-success'): void
}>()

const loading = ref(false)
const rememberMe = ref(false)
const showPassword = ref(false)
const errorMessage = ref('')

const form = reactive({
  account: '',
  password: ''
})

const formValid = computed(() => form.account.trim().length >= 3 && form.password.length >= 6)

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
  max-width: 480px;
  background: #fff;
  border-radius: 18px;
  padding: 28px;
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.05);
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
  padding: 24px 28px;
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
  border-color: #2d79f3;
  box-shadow: 0 0 0 2px rgba(45, 121, 243, 0.12);
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
  color: #2d79f3;
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
  accent-color: #2d79f3;
}

.span {
  font-size: 13px;
  color: #2d79f3;
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
