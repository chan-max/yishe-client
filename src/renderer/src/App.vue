<!--
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-06-08 23:07:32
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-06-29 07:27:18
 * @FilePath: /yishe-electron/src/renderer/src/App.vue
 * @Description: 衣设程序主界面 - 暗色主题设计
-->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import Versions from "./components/Versions.vue";

const serverStatus = ref(false);
const remoteServerStatus = ref(false);
const isDevToolsOpen = ref(false);
const timerId = ref<NodeJS.Timeout | null>(null);
const remoteTimerId = ref<NodeJS.Timeout | null>(null);

onMounted(() => {
  startServerPolling();
  startRemoteServerPolling();
});

onUnmounted(() => {
  if (timerId.value) {
    clearInterval(timerId.value);
  }
  if (remoteTimerId.value) {
    clearInterval(remoteTimerId.value);
  }
});

const startServerPolling = () => {
  checkServerStatus();
  timerId.value = setInterval(checkServerStatus, 3000);
};

const startRemoteServerPolling = () => {
  checkRemoteServerStatus();
  remoteTimerId.value = setInterval(checkRemoteServerStatus, 5000);
};

const checkServerStatus = async () => {
  try {
    const response = await fetch("http://localhost:1519/api/health");
    serverStatus.value = response.ok;
    
    const indicator = document.querySelector(".local-server-indicator");
    if (response.ok) {
      indicator?.classList.add("status-online");
      setTimeout(() => {
        indicator?.classList.remove("status-online");
      }, 500);
    }
  } catch {
    serverStatus.value = false;
  }
};

const checkRemoteServerStatus = async () => {
  try {
    const response = await fetch("https://1s.design:1520/api/test");
    remoteServerStatus.value = response.ok;
    
    const indicator = document.querySelector(".remote-server-indicator");
    if (response.ok) {
      indicator?.classList.add("status-online");
      setTimeout(() => {
        indicator?.classList.remove("status-online");
      }, 500);
    }
  } catch {
    remoteServerStatus.value = false;
  }
};

const toggleDevTools = (): void => {
  window.electron.ipcRenderer.send("toggle-devtools");
  setTimeout(() => {
    isDevToolsOpen.value = !isDevToolsOpen.value;
  }, 100);
};

const showTrayNotification = async (): Promise<void> => {
  await window.api.showTrayNotification({
    title: '衣设程序',
    body: '这是一条托盘通知消息'
  });
};

const hideToTray = async (): Promise<void> => {
  const result = await window.api.confirmExit();
  // 根据用户选择，API会自动处理相应的操作
  console.log('用户选择:', result);
};

const updateTrayStatus = async (): Promise<void> => {
  const status = serverStatus.value ? '服务运行中' : '服务未连接';
  await window.api.updateTrayTooltip(`衣设程序 - ${status}`);
};
</script>

<template>
  <div class="app-container">
    <!-- 左上角状态指示器 -->
    <div class="status-corner">
      <div class="status-item" :class="{ 'status-online': serverStatus, 'status-offline': !serverStatus }">
        <div class="status-indicator local-server-indicator"></div>
        <span class="status-text">本地服务</span>
      </div>
      <div class="status-item" :class="{ 'status-online': remoteServerStatus, 'status-offline': !remoteServerStatus }">
        <div class="status-indicator remote-server-indicator"></div>
        <span class="status-text">远程服务</span>
      </div>
    </div>

    <!-- 右上角托盘按钮 -->
    <div class="tray-corner">
      <button @click="hideToTray" class="tray-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8L22 12L18 16"/>
          <path d="M6 8L2 12L6 16"/>
          <path d="M14 4L10 20"/>
        </svg>
        隐藏到托盘
      </button>
    </div>

    <!-- 主要内容区域 -->
    <main class="main-content">
      <!-- 顶部标题 -->
      <div class="title-section">
        <img alt="logo" class="logo" src="./assets/electron.svg" />
        <h1 class="app-title">衣设</h1>
      </div>

      <!-- 快速链接区域 -->
      <section class="links-section">
        <h2 class="section-title">快速链接</h2>
        <div class="links-controls">
          <a href="https://1s.design" target="_blank" class="control-btn link-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            商城
          </a>
          <a href="http://49.232.186.238:1521" target="_blank" class="control-btn link-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
            </svg>
            管理系统
          </a>
          <a href="http://49.232.186.238:1522" target="_blank" class="control-btn link-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
              <path d="M2 17L12 22L22 17"/>
              <path d="M2 12L12 17L22 12"/>
            </svg>
            设计工具
          </a>
          <a href="http://49.232.186.238:1523" target="_blank" class="control-btn link-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10,9 9,9 8,9"/>
            </svg>
            文档介绍
          </a>
          <a href="http://49.232.186.238:1525" target="_blank" class="control-btn link-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            客户端下载
          </a>
        </div>
      </section>

      <!-- 底部信息区域 -->
      <section class="footer-section">
        <div class="footer-info">
          <div class="powered-by">
            <span class="powered-text">Powered by</span>
            <a href="https://1s.design" target="_blank" class="design-link">1s.design</a>
          </div>
          <div class="author-info">
            <span class="author-text">Created by：</span>
            <span class="author-name">Jackie Chan</span>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
  background: #000000;
  min-height: 100vh;
  color: #ffffff;
  overflow: hidden;
}

.app-container {
  min-height: 100vh;
  background: #000000;
  position: relative;
}

/* 左上角状态指示器 */
.status-corner {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(30, 30, 30, 0.9);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 12px;
  font-weight: 500;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.status-item.status-online {
  border-color: rgba(0, 255, 136, 0.3);
  background: rgba(0, 255, 136, 0.1);
}

.status-item.status-offline {
  border-color: rgba(255, 68, 68, 0.3);
  background: rgba(255, 68, 68, 0.1);
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #666666;
  transition: all 0.3s ease;
}

.status-online .status-indicator {
  background: #00ff88;
  box-shadow: 0 0 0 2px rgba(0, 255, 136, 0.3);
}

.status-offline .status-indicator {
  background: #ff4444;
  box-shadow: 0 0 0 2px rgba(255, 68, 68, 0.3);
}

.status-text {
  color: #ffffff;
  font-size: 11px;
  white-space: nowrap;
}

/* 主要内容区域 */
.main-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  text-align: center;
}

/* 标题区域 */
.title-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 25px;
}

.logo {
  width: 60px;
  height: 60px;
  filter: invert(1) drop-shadow(0 4px 8px rgba(255, 255, 255, 0.2));
}

.app-title {
  font-size: 2rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
}

/* 快速链接区域 */
.links-section {
  margin-bottom: 25px;
  width: 100%;
  max-width: 700px;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 20px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.links-controls {
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  width: auto;
  min-width: 120px;
  justify-content: center;
}

.control-btn.primary {
  background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
  color: #000000;
  box-shadow: 0 4px 12px rgba(0, 255, 136, 0.4);
}

.control-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 255, 136, 0.6);
}

.control-btn.secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.control-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* 调试工具区域 */
.devtools-section {
  margin-bottom: 25px;
}

.devtools-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #ffffff;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.devtools-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

/* 底部信息区域 */
.footer-section {
  margin-top: 25px;
  width: 100%;
  max-width: 700px;
}

.footer-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: rgba(30, 30, 30, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.footer-info:hover {
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
}

.powered-by {
  display: flex;
  align-items: center;
  gap: 8px;
}

.powered-text {
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
}

.design-link {
  font-size: 11px;
  font-weight: 600;
  color: #6900ff;
  text-decoration: none;
  transition: all 0.2s ease;
  padding: 3px 6px;
  border-radius: 5px;
  background: rgba(105, 0, 255, 0.1);
}

.design-link:hover {
  color: #ffffff;
  background: rgba(105, 0, 255, 0.2);
  transform: translateY(-1px);
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-text {
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
}

.author-name {
  font-size: 11px;
  font-weight: 600;
  color: #ffffff;
  padding: 3px 6px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
}

.author-name:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

/* 动画效果 */
@keyframes statusPulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.status-online {
  animation: statusPulse 0.5s ease-in-out;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .status-corner {
    top: 10px;
    left: 10px;
  }
  
  .tray-corner {
    top: 10px;
    right: 10px;
  }
  
  .status-item {
    padding: 4px 8px;
    font-size: 10px;
  }
  
  .status-indicator {
    width: 6px;
    height: 6px;
  }
  
  .tray-btn {
    padding: 6px 12px;
    font-size: 11px;
  }
  
  .main-content {
    padding: 10px;
  }
  
  .app-title {
    font-size: 1.75rem;
  }
  
  .logo {
    width: 50px;
    height: 50px;
  }
  
  .links-controls {
    flex-direction: column;
    gap: 8px;
  }
  
  .control-btn {
    width: 160px;
    padding: 8px 14px;
  }
  
  .footer-info {
    flex-direction: column;
    gap: 10px;
    padding: 10px 14px;
  }
  
  .powered-by, .author-info {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .app-title {
    font-size: 1.5rem;
  }
  
  .section-title {
    font-size: 1rem;
  }
  
  .control-btn {
    width: 140px;
    font-size: 11px;
    min-width: 100px;
  }
  
  .tray-btn {
    padding: 5px 10px;
    font-size: 10px;
  }
  
  .footer-info {
    padding: 8px 10px;
  }
  
  .powered-text, .author-text, .design-link, .author-name {
    font-size: 10px;
  }
}

/* 快速链接区域 */
.links-section {
  margin-bottom: 25px;
  width: 100%;
  max-width: 700px;
}

.links-controls {
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.control-btn.link-btn {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.15);
  text-decoration: none;
}

.control-btn.link-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
}

/* 右上角托盘按钮 */
.tray-corner {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.tray-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(30, 30, 30, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  color: #ffffff;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  text-decoration: none;
}

.tray-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
</style>
