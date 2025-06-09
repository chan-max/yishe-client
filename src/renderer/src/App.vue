<!--
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-06-08 23:07:32
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-06-09 01:00:12
 * @FilePath: /yishe-electron/src/renderer/src/App.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import Versions from "./components/Versions.vue";

const serverStatus = ref(false);
const timerId = ref<number | null>(null);

onMounted(() => {
  startServerPolling();
});

onUnmounted(() => {
  if (timerId.value) {
    clearInterval(timerId.value);
  }
});

const startServerPolling = () => {
  // 立即执行第一次检查
  checkServerStatus();
  // 设置定时器每3秒检查一次
  timerId.value = setInterval(checkServerStatus, 3000);
};

const checkServerStatus = async () => {
  try {
    const response = await fetch("http://localhost:1520/api/health");
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
const searchText = ref("");
const ipcHandle = (): void => window.electron.ipcRenderer.send("ping");

const handleSearch = async (): Promise<void> => {
  try {
    if (searchText.value.trim()) {
      console.log("准备发送搜索请求:", searchText.value);
      await window.api.startBaiduSearch(searchText.value);
      console.log("搜索请求已发送");
    } else {
      console.log("搜索内容为空");
    }
  } catch (error) {
    console.error("搜索过程出错:", error);
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
</script>

<template>
  <img alt="logo" class="logo" src="./assets/electron.svg" />
  <div class="creator">Powered by electron-vite</div>

  <div class="search-container">
    <input
      v-model="searchText"
      type="text"
      placeholder="请输入搜索内容"
      class="search-input"
    />
    <button @click="handleSearch" class="search-button">搜索</button>
  </div>

  <div>
    <div class="server-status" :class="{ online: serverStatus, offline: !serverStatus }">
      <div class="status-indicator"></div>
      {{ serverStatus ? "服务已启动" : "服务未连接" }}
    </div>
  </div>

  <div class="publish-container">
    <button @click="handlePublish" class="publish-button">发布内容</button>
  </div>

  <div class="text">
    Build an Electron app with
    <span class="vue">Vue123</span>
    and
    <span class="ts">TypeScript</span>
  </div>
  <p class="tip">Please try pressing <code>F12</code> to open the devTool</p>
  <div class="actions">
    <div class="action">
      <a href="https://electron-vite.org/" target="_blank" rel="noreferrer"
        >Documentation</a
      >
    </div>
    <div class="action">
      <a target="_blank" rel="noreferrer" @click="ipcHandle">Send IPC</a>
    </div>
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
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 8px 15px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  font-size: 12px;
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
</style>
