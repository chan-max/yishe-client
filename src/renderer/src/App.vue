<!--
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-06-08 23:07:32
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-07-01 08:32:33
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
const appVersion = ref('');
const showModal = ref(false);
const modalMessage = ref('');
const modalTitle = ref('');

onMounted(() => {
  startServerPolling();
  startRemoteServerPolling();
  window.api.getAppVersion().then(v => appVersion.value = v);
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
  await window.api.hideMainWindow();
};

const updateTrayStatus = async (): Promise<void> => {
  const status = serverStatus.value ? '服务运行中' : '服务未连接';
  await window.api.updateTrayTooltip(`衣设程序 - ${status}`);
};

const checkSocialMediaStatus = async () => {
  try {
    const res = await window.api.checkSocialMediaLogin();
    const result = res.data;
    if (!result) throw new Error('无返回数据');
    const statusMap = {
      xiaohongshu: '小红书',
      douyin: '抖音',
      weibo: '微博',
      kuaishou: '快手',
      bilibili: 'B站',
    };
    let msg = '社交平台登录状态：\n\n';
    for (const key in result) {
      const plat = statusMap[key] || key;
      const s = result[key];
      const status = s.isLoggedIn ? '✅可用' : '❌不可用';
      msg += `<span class="platform-name">${plat}</span> ${status}\n`;
    }
    modalTitle.value = '社交平台登录状态';
    modalMessage.value = msg;
    showModal.value = true;
  } catch (e) {
    modalTitle.value = '检查失败';
    modalMessage.value = '检查失败：' + (e instanceof Error ? e.message : e);
    showModal.value = true;
  }
};

const testPublishToSocialMedia = async () => {
  try {
    modalTitle.value = '测试发布';
    modalMessage.value = '正在测试发布到各社交平台，请稍候...';
    showModal.value = true;
    
    const result = await window.api.testPublishToSocialMedia();
    
    if (result && result.status) {
      let msg = '测试发布结果：\n\n';
      const platformMap = {
        xiaohongshu: '小红书',
        douyin: '抖音',
        kuaishou: '快手'
      };
      
      if (result.data && result.data.results) {
        result.data.results.forEach((item: any) => {
          const platformName = platformMap[item.platform] || item.platform;
          const status = item?.success ? '✅成功' : '❌失败';
          msg += `<span class="platform-name">${platformName}</span> ${status}\n`;
          if (item.message) {
            msg += `    ${item.message}\n`;
          }
        });
      }
      
      modalTitle.value = '测试发布完成';
      modalMessage.value = msg;
    } else {
      modalTitle.value = '测试发布失败';
      modalMessage.value = '测试发布失败：' + (result.msg || '未知错误');
    }
  } catch (e) {
    modalTitle.value = '测试发布失败';
    modalMessage.value = '测试发布失败：' + (e instanceof Error ? e.message : e);
  }
};

const closeModal = () => {
  showModal.value = false;
  modalMessage.value = '';
  modalTitle.value = '';
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
        <img alt="logo" class="logo" src="./assets/icon.png" />
        <h1 class="app-title">衣设 最具创意的设计工具</h1>
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
      <!-- 新增小功能区，弱化为链接样式 -->
      <section class="mini-tools-section">
        <h3 class="mini-tools-title">功能合集</h3>
        <div class="mini-tools-links">
          <a href="javascript:void(0);" class="mini-tool-link" @click="checkSocialMediaStatus">检查社交媒体登录状态</a>
          <a href="javascript:void(0);" class="mini-tool-link" @click="testPublishToSocialMedia">测试发布到社交平台</a>
          <!-- 可继续添加更多小功能链接 -->
        </div>
      </section>

      <!-- 底部信息区域 -->
      <footer class="footer-bar">
        <div class="footer-content-vertical">
          <span class="version-text">v{{ appVersion }}</span>
          <span class="footer-meta">
            Created by <a href="https://github.com/chan-max" target="_blank" class="creator-name">Jackie Chan</a>
          </span>
        </div>
      </footer>
    </main>

    <!-- 自定义弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ modalTitle }}</h3>
          <button class="modal-close" @click="closeModal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
          <div class="modal-body">
            <div class="modal-message" v-html="modalMessage"></div>
          </div>
        <div class="modal-footer">
          <button class="modal-btn" @click="closeModal">确定</button>
        </div>
      </div>
    </div>
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
  filter: none;
  transition: transform 0.2s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s cubic-bezier(0.4,0,0.2,1);
}

.logo:hover {
  transform: scale(1.08);
  box-shadow: 0 4px 16px rgba(80, 0, 255, 0.18);
}

.app-title {
  font-size: 2rem;
  font-weight: 400;
  color: #ffffff;
  margin: 0;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
  font-family: 'YisheLogo', 'Fira Mono', 'Consolas', 'Menlo', monospace;
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
.footer-bar {
  position: fixed;
  left: 0;
  bottom: 0;
  width: 100%;
  background: transparent;
  border-top: none;
  z-index: 2000;
  padding: 0;
  box-shadow: none;
}
.footer-content-vertical {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 6px 0 4px 0;
}
.version-text {
  color: #b0b0b0;
  font-size: 11px;
  font-family: 'Fira Mono', 'Consolas', 'Menlo', monospace;
  letter-spacing: 0.08em;
  margin-bottom: 0;
}
.footer-meta {
  color: #b0b0b0;
  font-size: 12px;
  font-family: 'Fira Mono', 'Consolas', 'Menlo', monospace;
  letter-spacing: 0.08em;
  font-weight: 400;
}
.footer-link, .creator-name {
  color: #b0b0b0;
  font-weight: 500;
  text-decoration: none;
  border-bottom: 1px dotted #b47cff44;
  transition: border-color 0.2s, color 0.2s;
  padding-bottom: 1px;
}
.footer-link:hover, .creator-name:hover {
  color: #6900ff;
  border-bottom: 1.5px solid #6900ff;
}
@media (max-width: 600px) {
  .footer-content-vertical {
    gap: 1px;
    font-size: 11px;
    padding: 4px 0 2px 0;
  }
  .footer-meta {
    font-size: 11px;
  }
  .version-text {
    font-size: 10px;
  }
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
  
  .footer-content-vertical {
    gap: 1px;
    font-size: 11px;
    padding: 4px 0 2px 0;
  }
  
  .footer-meta {
    font-size: 11px;
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
  
  .footer-content-vertical {
    gap: 1px;
    font-size: 11px;
    padding: 4px 0 2px 0;
  }
  
  .footer-meta {
    font-size: 11px;
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

/* 在 style 标签顶部添加字体引入 */
@font-face {
  font-family: 'YisheLogo';
  src: url('./assets/logo.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

.mini-tools-section {
  margin-top: 10px;
  text-align: center;
}
.mini-tools-title {
  font-size: 1rem;
  font-weight: 500;
  color: #b0b0b0;
  margin-bottom: 8px;
  margin-top: 0;
  letter-spacing: 0.02em;
}
.mini-tools-links {
  display: flex;
  gap: 18px;
  justify-content: center;
  flex-wrap: wrap;
}
.mini-tool-link {
  color: #b0b0b0;
  font-size: 13px;
  text-decoration: underline dotted;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0 2px;
  transition: color 0.2s;
}
.mini-tool-link:hover {
  color: #e0e0e0;
  text-decoration: underline;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: #1a1a1a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-title {
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.modal-body {
  padding: 20px 24px;
  max-height: 400px;
  overflow-y: auto;
}

.modal-message {
  color: #e0e0e0;
  font-family: 'Fira Mono', 'Consolas', 'Menlo', monospace;
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.platform-name {
  display: inline-block;
  width: 60px;
  text-align: left;
}

.modal-footer {
  padding: 16px 24px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: flex-end;
}

.modal-btn {
  background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
  color: #000000;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 255, 136, 0.4);
}

/* 响应式弹窗 */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 20px;
  }
  
  .modal-header {
    padding: 16px 20px 12px;
  }
  
  .modal-body {
    padding: 16px 20px;
  }
  
  .modal-footer {
    padding: 12px 20px 16px;
  }
  
  .modal-title {
    font-size: 16px;
  }
  
  .modal-message {
    font-size: 13px;
  }
}
</style>
