<!--
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-06-08 23:07:32
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-06-11 08:20:55
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
    const wasOnline = serverStatus.value;
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
    const wasOnline = remoteServerStatus.value;
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
  checkBrowserStatus();
  browserTimerId.value = setInterval(checkBrowserStatus, 5000);
};

const checkBrowserStatus = async () => {
  try {
    const response = await fetch("http://127.0.0.1:9222/json/version", { 
      mode: 'no-cors' // 添加no-cors模式
    });
    browserStatus.value = response.status == 0;
  } catch {
    browserStatus.value = false;
  }
};

const handlePublish = async (): Promise<void> => {
  try {
    // 这里可以根据需要构造不同的参数
    const publishParams = {
      url: "https://example.com",
      selector: "#content",
      content: "要发布的内容",
      buttonSelector: "#submit",
    };

    console.log("准备发送发布请求，参数:", publishParams);
    await window.api.startPublish(publishParams);
    console.log("发布请求已发送");
  } catch (error) {
    console.error("发布过程出错:", error);
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
    <button @click="handlePublish" class="publish-button">发布内容</button>
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
  justify-content: center;
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
