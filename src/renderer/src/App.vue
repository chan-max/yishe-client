<!--
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-06-08 23:07:32
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-06-28 07:23:09
 * @FilePath: /yishe-electron/src/renderer/src/App.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import Versions from "./components/Versions.vue";

const serverStatus = ref(false);
const remoteServerStatus = ref(false);
const isDevToolsOpen = ref(false);
const timerId = ref<NodeJS.Timeout | null>(null);
const remoteTimerId = ref<NodeJS.Timeout | null>(null);

const browserStatus = ref(false); // 新增浏览器状态
const browserTimerId = ref<NodeJS.Timeout | null>(null); // 新增浏览器检测定时器

onMounted(() => {
  startServerPolling();
  startRemoteServerPolling();
  startBrowserCheck();
  // 自动启动游览器
  handleStartBrowser();
});

onUnmounted(() => {
  if (timerId.value) {
    clearInterval(timerId.value);
  }
  if (remoteTimerId.value) {
    clearInterval(remoteTimerId.value);
  }
  if (browserTimerId.value) {
    clearInterval(browserTimerId.value);
  }
});

const startServerPolling = () => {
  // 立即执行第一次检查
  checkServerStatus();
  // 设置定时器每3秒检查一次
  timerId.value = setInterval(checkServerStatus, 3000);
};

const startRemoteServerPolling = () => {
  // 立即执行第一次检查
  checkRemoteServerStatus();
  // 设置定时器每5秒检查一次
  remoteTimerId.value = setInterval(checkRemoteServerStatus, 5000);
};

const checkServerStatus = async () => {
  try {
    const response = await fetch("http://localhost:1519/api/health");
    serverStatus.value = response.ok;

    // 当状态从离线变为在线时触发动画
    const indicator = document.querySelector(".status-indicator");
    indicator?.classList.add("pulse-animation");

    setTimeout(() => {
      indicator?.classList.remove("pulse-animation");
    }, 500);
  } catch {
    serverStatus.value = false;
  }
};

const checkRemoteServerStatus = async () => {
  try {
    const response = await fetch("https://1s.design:1520/api/test");
    remoteServerStatus.value = response.ok;

    // 当状态从离线变为在线时触发动画
    const indicator = document.querySelector(".remote-status-indicator");
    indicator?.classList.add("pulse-animation");

    setTimeout(() => {
      indicator?.classList.remove("pulse-animation");
    }, 500);
  } catch {
    remoteServerStatus.value = false;
  }
};

// 新增浏览器状态检测方法
const startBrowserCheck = () => {
  // 立即执行第一次检查
  checkBrowserStatus();
  // 设置定时器每3秒检查一次，提高检测频率
  browserTimerId.value = setInterval(checkBrowserStatus, 3000);
};

const checkBrowserStatus = async () => {
  try {
    // 使用 Puppeteer 的浏览器状态检查接口
    const status = await (window.api as any).checkBrowserStatus();
    const previousStatus = browserStatus.value;
    browserStatus.value = status;
    
    // 当状态从离线变为在线时触发动画
    if (status && !previousStatus) {
      const indicator = document.querySelector(".browser-status .status-indicator");
      indicator?.classList.add("pulse-animation");
      
      setTimeout(() => {
        indicator?.classList.remove("pulse-animation");
      }, 500);
    }
    
    // 当状态从在线变为离线时，记录日志并可以添加额外处理
    if (!status && previousStatus) {
      console.log('浏览器连接已断开');
      // 可以在这里添加用户通知或其他处理逻辑
    }
  } catch (error) {
    console.error('检查浏览器状态失败:', error);
    browserStatus.value = false;
  }
};

const handleStartBrowser = async (): Promise<void> => {
  try {
    console.log('正在启动浏览器...');
    const result = await (window.api as any).startBrowser();
    
    if (result.success) {
      console.log("浏览器启动成功:", result.message);
      // 立即检测浏览器状态
      await checkBrowserStatus();
    } else {
      console.error("启动游览器失败:", result.message);
      // 如果普通启动失败，尝试强制重启
      console.log('尝试强制重启浏览器...');
      const restartResult = await (window.api as any).forceRestartBrowser();
      if (restartResult.success) {
        console.log("浏览器强制重启成功:", restartResult.message);
        await checkBrowserStatus();
      } else {
        console.error("强制重启也失败了:", restartResult.message);
      }
    }
  } catch (error: any) {
    console.error("启动游览器失败:", error);
    // 如果出现异常，也尝试强制重启
    try {
      console.log('出现异常，尝试强制重启浏览器...');
      const restartResult = await (window.api as any).forceRestartBrowser();
      if (restartResult.success) {
        console.log("浏览器强制重启成功:", restartResult.message);
        await checkBrowserStatus();
      } else {
        console.error("强制重启也失败了:", restartResult.message);
      }
    } catch (restartError) {
      console.error("强制重启失败:", restartError);
    }
  }
};

const toggleDevTools = (): void => {
  window.electron.ipcRenderer.send("toggle-devtools");
  // 由于我们无法直接获取DevTools的状态，这里使用一个简单的延时来更新状态
  setTimeout(() => {
    isDevToolsOpen.value = !isDevToolsOpen.value;
  }, 100);
};
</script>

<template>
  <img alt="logo" class="logo" src="./assets/electron.svg" />

  <div class="server-status-container">
    <div
      class="server-status browser-status"
      :class="{ online: browserStatus, offline: !browserStatus }"
    >
      <div class="status-indicator"></div>
      {{ browserStatus ? "浏览器已连接" : "浏览器连接失败" }}
    </div>

    <div class="server-status" :class="{ online: serverStatus, offline: !serverStatus }">
      <div class="status-indicator"></div>
      {{ serverStatus ? "服务已启动" : "服务未连接" }}
    </div>
    <div
      class="server-status remote-status"
      :class="{ online: remoteServerStatus, offline: !remoteServerStatus }"
    >
      <div class="status-indicator remote-status-indicator"></div>
      {{ remoteServerStatus ? "远程服务已连接" : "远程服务未连接" }}
    </div>
    <button @click="toggleDevTools" class="devtools-button">
      {{ isDevToolsOpen ? "隐藏调试工具" : "显示调试工具" }}
    </button>
  </div>

  <div class="publish-container">
    <button @click="handleStartBrowser" class="publish-button">启动游览器</button>
  </div>
  <Versions />
</template>

<style>
.search-container {
  margin: 20px 0;
  display: flex;
  gap: 10px;
  justify-content: center;
}

.search-input {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 300px;
  font-size: 14px;
}

.search-button {
  padding: 8px 20px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.search-button:hover {
  background-color: #45a049;
}

.publish-container {
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.publish-button {
  padding: 8px 20px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.publish-button:hover {
  background-color: #1976d2;
}

.server-status {
  padding: 4px 10px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  font-size: 10px;
}

.server-status-container {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 0.5em;
}

.remote-status {
  top: 60px;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
  transition: background-color 0.3s ease;
}

.pulse-animation {
  animation: pulse 0.5s ease-in-out;
}

.online {
  background: rgba(76, 175, 80, 0.1);
  border: 1px solid #4caf50;
  color: #4caf50;
}

.online .status-indicator {
  background: #4caf50;
}

.offline {
  background: rgba(244, 67, 54, 0.1);
  border: 1px solid #f44336;
  color: #f44336;
}

.offline .status-indicator {
  background: #f44336;
}

.devtools-button {
  padding: 4px 10px;
  background-color: #607d8b;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-left: 10px;
}

.devtools-button:hover {
  background-color: #455a64;
}
</style>
