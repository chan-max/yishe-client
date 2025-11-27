<!--
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-06-08 23:07:32
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-01-XX XX:XX:XX
 * @FilePath: /yishe-electron/src/renderer/src/App.vue
 * @Description: 衣设程序主界面 - 管理系统风格设计
-->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import request from './api/request'
import { isClientAuthorized, logoutToken } from './api/user'

// 状态管理
const serverStatus = ref(false);
const remoteServerStatus = ref(false);
const appVersion = ref('');
const isAuthorized = ref(true);
const sidebarCollapsed = ref(false);
const activeMenu = ref('dashboard');

// 连接状态相关
const connectionStatus = ref({
  isConnected: false,
  lastError: null as string | null,
  retryCount: 0,
  lastAttempt: null as Date | null,
  reconnecting: false,
  maxRetriesReached: false
});

// 菜单项配置
const menuItems = [
  { key: 'dashboard', label: '仪表盘', icon: '📊' },
  { key: 'tasks', label: '任务管理', icon: '📋' },
  { key: 'settings', label: '系统设置', icon: '⚙️' },
  { key: 'logs', label: '日志查看', icon: '📝' },
  { key: 'about', label: '关于', icon: 'ℹ️' },
];

// 节流相关状态
let lastServerCheck = 0
let lastRemoteServerCheck = 0
let lastAuthCheck = 0
const THROTTLE_DELAY = 5000 // 5秒节流

// 节流函数
const throttle = (lastCheck: number, delay: number) => {
  const now = Date.now()
  return now - lastCheck >= delay
}

// 带节流的授权状态检查
const checkAuthStatus = async () => {
  if (!throttle(lastAuthCheck, THROTTLE_DELAY)) {
    return
  }
  lastAuthCheck = Date.now()
  
  try {
    const token = await window.api.getToken();
    isAuthorized.value = !!token;
  } catch {
    isAuthorized.value = false;
  }
};

const handleLogout = async () => {
  await logoutToken()
  await checkAuthStatus()
}

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
};

const selectMenu = (key: string) => {
  activeMenu.value = key;
};

onMounted(() => {
  startServerPolling();
  startRemoteServerPolling();
  window.api.getAppVersion().then(v => appVersion.value = v);
  checkAuthStatus()
  setInterval(checkAuthStatus, 5000)
  
  // 监听连接状态事件
  window.api.onConnectionStatus((status: any) => {
    connectionStatus.value = { ...connectionStatus.value, ...status };
  });
});

onUnmounted(() => {
  // 清理定时器
});

const startServerPolling = () => {
  checkServerStatus();
  setInterval(checkServerStatus, 3000);
};

const startRemoteServerPolling = () => {
  checkRemoteServerStatus();
  setInterval(checkRemoteServerStatus, 5000);
};

const checkServerStatus = async () => {
  if (!throttle(lastServerCheck, THROTTLE_DELAY)) {
    return
  }
  lastServerCheck = Date.now()
  
  try {
    const response = await fetch("http://localhost:1519/api/health");
    serverStatus.value = response.ok;
  } catch {
    serverStatus.value = false;
  }
};

const checkRemoteServerStatus = async () => {
  if (!throttle(lastRemoteServerCheck, THROTTLE_DELAY)) {
    return
  }
  lastRemoteServerCheck = Date.now()
  
  try {
    const response = await request.get({ url: '/test' });
    remoteServerStatus.value = true;
  } catch {
    remoteServerStatus.value = false;
  }
};

const hideToTray = async (): Promise<void> => {
  await window.api.hideMainWindow();
};
</script>

<template>
  <div class="app-container">
    <!-- 授权锁定遮罩 -->
    <div v-if="!isAuthorized" class="auth-locked-overlay">
      <div class="auth-locked-content">
        <div class="lock-icon-ani">
          <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
            <rect x="7" y="17" width="24" height="15" rx="5" fill="#191919" stroke="#ff4444" stroke-width="1.5"/>
            <path d="M12 17v-4a7 7 0 1 1 14 0v4" stroke="#ff4444" stroke-width="1.5" fill="none"/>
            <circle cx="19" cy="26" r="2" fill="#ff4444"/>
            <rect x="18" y="26" width="2" height="4" rx="1" fill="#ff4444"/>
          </svg>
        </div>
        <h2 class="locked-title small">客户端未授权</h2>
        <p class="locked-desc small">请前往管理后台完成授权<br/>授权后即可正常使用</p>
        <button class="auth-btn small" @click="checkAuthStatus">重新检测授权</button>
      </div>
    </div>

    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <div class="logo-section">
          <img alt="logo" class="logo" src="./assets/icon.png" />
          <span v-if="!sidebarCollapsed" class="logo-text">衣设管理</span>
        </div>
        <button class="sidebar-toggle" @click="toggleSidebar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path v-if="!sidebarCollapsed" d="M18 6L6 18M6 6l12 12"/>
            <path v-else d="M3 12h18M3 6h18M3 18h18"/>
          </svg>
        </button>
      </div>
      
      <nav class="sidebar-nav">
        <div 
          v-for="item in menuItems" 
          :key="item.key"
          class="nav-item"
          :class="{ active: activeMenu === item.key }"
          @click="selectMenu(item.key)"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span v-if="!sidebarCollapsed" class="nav-label">{{ item.label }}</span>
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="version-info" v-if="!sidebarCollapsed">
          <span class="version-text">v{{ appVersion }}</span>
        </div>
      </div>
    </aside>

    <!-- 主内容区 -->
    <div class="main-wrapper">
      <!-- 顶部导航栏 -->
      <header class="topbar">
        <div class="topbar-left">
          <h1 class="page-title">
            <span v-if="activeMenu === 'dashboard'">仪表盘</span>
            <span v-else-if="activeMenu === 'tasks'">任务管理</span>
            <span v-else-if="activeMenu === 'settings'">系统设置</span>
            <span v-else-if="activeMenu === 'logs'">日志查看</span>
            <span v-else-if="activeMenu === 'about'">关于</span>
          </h1>
        </div>
        
        <div class="topbar-right">
          <!-- 状态指示器 -->
          <div class="status-group">
            <div class="status-badge" :class="{ online: serverStatus, offline: !serverStatus }" title="本地服务">
              <span class="status-dot"></span>
              <span class="status-label">本地</span>
            </div>
            <div class="status-badge" :class="{ online: remoteServerStatus, offline: !remoteServerStatus }" title="远程服务">
              <span class="status-dot"></span>
              <span class="status-label">远程</span>
            </div>
            <div class="status-badge" :class="{ 
              online: connectionStatus.isConnected, 
              offline: !connectionStatus.isConnected && !connectionStatus.reconnecting,
              connecting: connectionStatus.reconnecting 
            }" title="浏览器连接">
              <span class="status-dot"></span>
              <span class="status-label">浏览器</span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="action-buttons">
            <button v-if="isAuthorized" @click="handleLogout" class="btn btn-danger">退出授权</button>
            <button @click="hideToTray" class="btn btn-secondary">隐藏到托盘</button>
          </div>
        </div>
      </header>

      <!-- 内容区域 -->
      <main class="content-area">
        <!-- 仪表盘 -->
        <div v-if="activeMenu === 'dashboard'" class="dashboard">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">📊</div>
              <div class="stat-content">
                <div class="stat-value">0</div>
                <div class="stat-label">总任务数</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">✅</div>
              <div class="stat-content">
                <div class="stat-value">0</div>
                <div class="stat-label">已完成</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">⏳</div>
              <div class="stat-content">
                <div class="stat-value">0</div>
                <div class="stat-label">进行中</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">❌</div>
              <div class="stat-content">
                <div class="stat-value">0</div>
                <div class="stat-label">失败</div>
              </div>
            </div>
          </div>

          <div class="dashboard-content">
            <div class="card">
              <div class="card-header">
                <h3 class="card-title">系统状态</h3>
              </div>
              <div class="card-body">
                <div class="status-list">
                  <div class="status-item">
                    <span class="status-name">本地服务</span>
                    <span class="status-value" :class="{ success: serverStatus, error: !serverStatus }">
                      {{ serverStatus ? '运行中' : '未连接' }}
                    </span>
                  </div>
                  <div class="status-item">
                    <span class="status-name">远程服务</span>
                    <span class="status-value" :class="{ success: remoteServerStatus, error: !remoteServerStatus }">
                      {{ remoteServerStatus ? '已连接' : '未连接' }}
                    </span>
                  </div>
                  <div class="status-item">
                    <span class="status-name">浏览器连接</span>
                    <span class="status-value" :class="{ 
                      success: connectionStatus.isConnected, 
                      error: !connectionStatus.isConnected && !connectionStatus.reconnecting,
                      warning: connectionStatus.reconnecting 
                    }">
                      {{ connectionStatus.isConnected ? '已连接' : connectionStatus.reconnecting ? '重连中' : '未连接' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-header">
                <h3 class="card-title">快速操作</h3>
              </div>
              <div class="card-body">
                <div class="quick-actions">
                  <a href="https://1s.design" target="_blank" class="quick-action-btn">
                    <span class="action-icon">🛒</span>
                    <span class="action-text">商城</span>
                  </a>
                  <a href="http://49.232.186.238:1521" target="_blank" class="quick-action-btn">
                    <span class="action-icon">⚙️</span>
                    <span class="action-text">管理系统</span>
                  </a>
                  <a href="http://49.232.186.238:1522" target="_blank" class="quick-action-btn">
                    <span class="action-icon">🎨</span>
                    <span class="action-text">设计工具</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 其他菜单内容 -->
        <div v-else-if="activeMenu === 'tasks'" class="page-content">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">任务管理</h3>
            </div>
            <div class="card-body">
              <p class="empty-state">任务管理功能开发中...</p>
            </div>
          </div>
        </div>

        <div v-else-if="activeMenu === 'settings'" class="page-content">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">系统设置</h3>
            </div>
            <div class="card-body">
              <p class="empty-state">系统设置功能开发中...</p>
            </div>
          </div>
        </div>

        <div v-else-if="activeMenu === 'logs'" class="page-content">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">日志查看</h3>
            </div>
            <div class="card-body">
              <p class="empty-state">日志查看功能开发中...</p>
            </div>
          </div>
        </div>

        <div v-else-if="activeMenu === 'about'" class="page-content">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">关于</h3>
            </div>
            <div class="card-body">
              <div class="about-content">
                <img alt="logo" class="about-logo" src="./assets/icon.png" />
                <h2 class="about-title">衣设客户端</h2>
                <p class="about-version">版本: v{{ appVersion }}</p>
                <p class="about-desc">最具创意的设计工具</p>
                <p class="about-creator">
                  Created by <a href="https://github.com/chan-max" target="_blank" class="creator-link">Jackie Chan</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app-container {
  display: flex;
  height: 100vh;
  background: #0f0f0f;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
  overflow: hidden;
}

/* 侧边栏样式 */
.sidebar {
  width: 240px;
  background: #1a1a1a;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  flex-shrink: 0;
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar-header {
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  width: 32px;
  height: 32px;
  border-radius: 6px;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
}

.sidebar-toggle {
  background: transparent;
  border: none;
  color: #ffffff;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.sidebar-toggle:hover {
  background: rgba(255, 255, 255, 0.1);
}

.sidebar-nav {
  flex: 1;
  padding: 16px 0;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.2s;
  color: #b0b0b0;
  position: relative;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
}

.nav-item.active {
  background: rgba(0, 255, 136, 0.1);
  color: #00ff88;
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #00ff88;
}

.nav-icon {
  font-size: 20px;
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.nav-label {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.sidebar.collapsed .nav-label {
  display: none;
}

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.version-info {
  font-size: 12px;
  color: #808080;
  text-align: center;
}

.sidebar.collapsed .version-info {
  display: none;
}

/* 主内容区 */
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 顶部导航栏 */
.topbar {
  height: 64px;
  background: #1a1a1a;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
}

.topbar-left {
  display: flex;
  align-items: center;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-group {
  display: flex;
  gap: 8px;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(30, 30, 30, 0.9);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 12px;
}

.status-badge.online {
  border-color: rgba(0, 255, 136, 0.3);
  background: rgba(0, 255, 136, 0.1);
}

.status-badge.offline {
  border-color: rgba(255, 68, 68, 0.3);
  background: rgba(255, 68, 68, 0.1);
}

.status-badge.connecting {
  border-color: rgba(255, 170, 0, 0.3);
  background: rgba(255, 170, 0, 0.1);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #666;
}

.status-badge.online .status-dot {
  background: #00ff88;
  box-shadow: 0 0 0 2px rgba(0, 255, 136, 0.3);
}

.status-badge.offline .status-dot {
  background: #ff4444;
  box-shadow: 0 0 0 2px rgba(255, 68, 68, 0.3);
}

.status-badge.connecting .status-dot {
  background: #ffaa00;
  box-shadow: 0 0 0 2px rgba(255, 170, 0, 0.3);
}

.status-label {
  color: #ffffff;
  font-size: 11px;
  white-space: nowrap;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
}

.btn-danger {
  background: #ff4444;
  color: #ffffff;
}

.btn-danger:hover {
  background: #ff3333;
}

/* 内容区域 */
.content-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: #0f0f0f;
}

/* 仪表盘 */
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  background: #1a1a1a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s;
}

.stat-card:hover {
  border-color: rgba(0, 255, 136, 0.3);
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 32px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 255, 136, 0.1);
  border-radius: 8px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #b0b0b0;
}

.dashboard-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
}

.card {
  background: #1a1a1a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
}

.card-body {
  padding: 20px;
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.status-name {
  font-size: 14px;
  color: #b0b0b0;
}

.status-value {
  font-size: 13px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 12px;
}

.status-value.success {
  background: rgba(0, 255, 136, 0.1);
  color: #00ff88;
}

.status-value.error {
  background: rgba(255, 68, 68, 0.1);
  color: #ff4444;
}

.status-value.warning {
  background: rgba(255, 170, 0, 0.1);
  color: #ffaa00;
}

.quick-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.quick-action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  text-decoration: none;
  color: #ffffff;
  transition: all 0.2s;
}

.quick-action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(0, 255, 136, 0.3);
  transform: translateY(-2px);
}

.action-icon {
  font-size: 18px;
}

.action-text {
  font-size: 14px;
  font-weight: 500;
}

/* 其他页面 */
.page-content {
  max-width: 1200px;
}

.empty-state {
  text-align: center;
  color: #808080;
  padding: 40px;
  font-size: 14px;
}

/* 关于页面 */
.about-content {
  text-align: center;
  padding: 40px 20px;
}

.about-logo {
  width: 80px;
  height: 80px;
  margin-bottom: 20px;
  border-radius: 12px;
}

.about-title {
  font-size: 24px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 8px;
}

.about-version {
  font-size: 14px;
  color: #b0b0b0;
  margin-bottom: 8px;
}

.about-desc {
  font-size: 16px;
  color: #808080;
  margin-bottom: 20px;
}

.about-creator {
  font-size: 14px;
  color: #808080;
}

.creator-link {
  color: #00ff88;
  text-decoration: none;
}

.creator-link:hover {
  text-decoration: underline;
}

/* 授权锁定遮罩 */
.auth-locked-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.92);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-locked-content {
  background: #181818;
  border-radius: 16px;
  padding: 48px 32px 32px 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  text-align: center;
  min-width: 320px;
  animation: fadeInUp 0.7s cubic-bezier(.23, 1.01, .32, 1) both;
}

.lock-icon-ani {
  margin-bottom: 18px;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: lockBounce 1.2s cubic-bezier(.23, 1.01, .32, 1) infinite alternate;
}

.locked-title {
  color: #ff4444;
  font-size: 1.5rem;
  margin-bottom: 10px;
  letter-spacing: 0.02em;
  font-weight: 700;
  animation: fadeIn 1.2s cubic-bezier(.23, 1.01, .32, 1) both;
}

.locked-title.small {
  font-size: 1.08rem;
  margin-bottom: 7px;
}

.locked-desc {
  color: #fff;
  font-size: 1rem;
  margin-bottom: 22px;
  line-height: 1.7;
  animation: fadeIn 1.5s cubic-bezier(.23, 1.01, .32, 1) both;
}

.locked-desc.small {
  font-size: 0.92rem;
  margin-bottom: 14px;
}

.auth-btn {
  background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
  color: #000;
  border: none;
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 255, 136, 0.12);
  animation: fadeIn 1.8s cubic-bezier(.23, 1.01, .32, 1) both;
}

.auth-btn:hover {
  background: #00cc6a;
}

.auth-btn.small {
  font-size: 0.95rem;
  padding: 8px 20px;
}

@keyframes lockBounce {
  0% { transform: translateY(0) scale(1); }
  60% { transform: translateY(-8px) scale(1.08); }
  100% { transform: translateY(0) scale(1); }
}

@keyframes fadeInUp {
  0% { opacity: 0; transform: translateY(30px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

/* 滚动条样式 */
.content-area::-webkit-scrollbar,
.sidebar-nav::-webkit-scrollbar {
  width: 6px;
}

.content-area::-webkit-scrollbar-track,
.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

.content-area::-webkit-scrollbar-thumb,
.sidebar-nav::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.content-area::-webkit-scrollbar-thumb:hover,
.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
