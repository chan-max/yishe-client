<!--
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-06-08 23:07:32
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-06-08 23:27:59
 * @FilePath: /yishe-electron/src/renderer/src/App.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<script setup lang="ts">
import { ref } from 'vue'
import Versions from './components/Versions.vue'

const searchText = ref('')
const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

const handleSearch = async (): Promise<void> => {
  try {
    if (searchText.value.trim()) {
      console.log('准备发送搜索请求:', searchText.value)
      await window.api.startBaiduSearch(searchText.value)
      console.log('搜索请求已发送')
    } else {
      console.log('搜索内容为空')
    }
  } catch (error) {
    console.error('搜索过程出错:', error)
  }
}

const handlePublish = async (): Promise<void> => {
  try {
    // 这里可以根据需要构造不同的参数
    const publishParams = {
      url: 'https://example.com',
      selector: '#content',
      content: '要发布的内容',
      buttonSelector: '#submit'
    }
    
    console.log('准备发送发布请求，参数:', publishParams)
    await window.api.startPublish(publishParams)
    console.log('发布请求已发送')
  } catch (error) {
    console.error('发布过程出错:', error)
  }
}
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
      <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">Documentation</a>
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
  background-color: #4CAF50;
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
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.publish-button:hover {
  background-color: #1976D2;
}
</style>
