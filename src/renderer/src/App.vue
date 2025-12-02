<!--
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-06-08 23:07:32
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-01-XX XX:XX:XX
 * @FilePath: /yishe-electron/src/renderer/src/App.vue
 * @Description: 衣设程序主界面 - 管理系统风格设计
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { websocketClient } from './services/websocketClient'
import { getUserInfo, logout, type UserInfo } from './api/auth'
import Login from './views/Login.vue'
import Dashboard from './views/Dashboard.vue'
import Tasks from './views/Tasks.vue'
import Workspace from './views/Workspace.vue'
import Settings from './views/Settings.vue'
import Logs from './views/Logs.vue'
import About from './views/About.vue'
import { LOCAL_API_BASE } from './config/api'
import { getTokenFromClient } from './api/user'
import { useToast } from './composables/useToast'

const { toast, showToast } = useToast()

const serverStatus = ref(false)
const appVersion = ref('')
const activeMenu = ref('dashboard')
const isLoggedIn = ref(false)
const userInfo = ref<UserInfo | null>(null)
const loadingUserInfo = ref(false)
const checkingAuth = ref(true) // 添加检查认证状态，避免闪烁

// 插件连接状态
const extensionConnectionStatus = ref<{
  connected: boolean
  clientId?: string
  clientSource?: string
  connectedAt?: string
  totalConnections?: number
} | null>(null)

// 工作目录与下载相关状态
const workspaceDirectory = ref('')
const selectingDirectory = ref(false)
const downloadUrl = ref('')
const downloading = ref(false)
const downloadHistory = ref<any[]>([])
const queryUrl = ref('')
const querying = ref(false)
const queryResult = ref<any | null>(null)

interface AdminMessage {
  id: string
  data: any
  timestamp: string
  read: boolean
}

const adminMessages = ref<AdminMessage[]>([])
const unreadCount = computed(() => adminMessages.value.filter((m) => !m.read).length)

const wsState = websocketClient.state
const clientProfile = websocketClient.profile

const menuItems = [
  { key: 'dashboard', label: '仪表盘', icon: 'mdi-view-dashboard-outline' },
  { key: 'tasks', label: '任务管理', icon: 'mdi-clipboard-check-outline' },
  { key: 'workspace', label: '文件工作目录', icon: 'mdi-folder-multiple-outline' },
  { key: 'settings', label: '系统设置', icon: 'mdi-cog-outline' },
  { key: 'logs', label: '日志查看', icon: 'mdi-file-document-outline' },
  { key: 'about', label: '关于', icon: 'mdi-information-outline' }
]

const quickLinks = [
  { label: '商城', icon: 'mdi-storefront-outline', url: 'https://1s.design' },
  { label: '管理系统', icon: 'mdi-cog-transfer-outline', url: 'http://49.232.186.238:1521' },
  { label: '设计工具', icon: 'mdi-palette-outline', url: 'http://49.232.186.238:1522' }
]

const statCards = [
  {
    key: 'total',
    label: '总任务数',
    icon: 'mdi-view-grid-outline',
    color: 'primary',
    value: 0,
    trend: '+0%',
    trendLabel: '较昨日',
    trendPositive: true
  },
  {
    key: 'done',
    label: '已完成',
    icon: 'mdi-check-all',
    color: 'success',
    value: 0,
    trend: '+0%',
    trendLabel: '完成率',
    trendPositive: true
  },
  {
    key: 'progress',
    label: '进行中',
    icon: 'mdi-progress-clock',
    color: 'warning',
    value: 0,
    trend: '实时',
    trendLabel: '活动任务',
    trendPositive: true
  },
  {
    key: 'failed',
    label: '失败',
    icon: 'mdi-alert-circle-outline',
    color: 'error',
    value: 0,
    trend: '-',
    trendLabel: '异常待查',
    trendPositive: false
  }
]

const pageDescriptions: Record<string, string> = {
  dashboard: '系统运行概览与快速入口',
  tasks: '集中管理批量任务与执行情况',
  workspace: '管理工作目录和文件下载',
  settings: '维护系统参数与设备配置',
  logs: '追踪运行日志与异常信息',
  about: '查看客户端版本信息'
}

const appLogo = new URL('./assets/icon.png', import.meta.url).href

const pageTitle = computed(() => menuItems.find((item) => item.key === activeMenu.value)?.label ?? '')
const pageDescription = computed(() => pageDescriptions[activeMenu.value] ?? '')

const statusChips = computed(() => {
  const wsDescriptor = statusMap(wsState.status)
  const extensionStatus = extensionConnectionStatus.value
  const extensionConnected = extensionStatus?.connected ?? false
  
  return [
    {
      key: 'local',
      label: serverStatus.value ? '本地服务 · 运行中' : '本地服务 · 未连接',
      state: serverStatus.value ? 'success' : 'error',
      icon: serverStatus.value ? 'mdi-lan-connect' : 'mdi-lan-disconnect'
    },
    {
      key: 'extension',
      label: extensionConnected ? `插件连接 · 已连接${extensionStatus?.totalConnections ? ` (${extensionStatus.totalConnections})` : ''}` : '插件连接 · 未连接',
      state: extensionConnected ? 'success' : 'muted',
      icon: extensionConnected ? 'mdi-puzzle-check' : 'mdi-puzzle-outline'
    },
    {
      key: 'ws',
      label: `远程服务 · ${wsDescriptor.text}`,
      state: wsDescriptor.tone,
      icon: wsDescriptor.icon
    }
  ]
})

const websocketBadge = computed(() => statusMap(wsState.status))

function statusMap(status: string) {
  switch (status) {
    case 'connected':
      return { tone: 'success', icon: 'mdi-radiobox-marked', text: '已连接' }
    case 'connecting':
      return { tone: 'warning', icon: 'mdi-dots-horizontal', text: '连接中' }
    case 'reconnecting':
      return { tone: 'warning', icon: 'mdi-refresh', text: '重连中' }
    case 'error':
      return { tone: 'error', icon: 'mdi-alert-circle-outline', text: '异常' }
    default:
      return { tone: 'muted', icon: 'mdi-lightning-bolt-outline', text: '未连接' }
  }
}

function toWsStatusText(status: string) {
  return statusMap(status).text
}

const ACTIVE_WS_STATUSES = ['connecting', 'connected', 'reconnecting']

const ensureWebsocketConnected = () => {
  if (ACTIVE_WS_STATUSES.includes(wsState.status)) return
  websocketClient.connect()
}

const disconnectWebsocketIfNeeded = () => {
  if (['idle', 'disconnected'].includes(wsState.status)) return
  websocketClient.disconnect()
}

watch(isLoggedIn, (loggedIn) => {
  if (loggedIn) {
    ensureWebsocketConnected()
  } else {
    disconnectWebsocketIfNeeded()
  }
})

const reconnectWebsocket = () => {
  websocketClient.reconnect()
  showToast({
    color: 'primary',
    icon: 'mdi-rotate-right',
    message: '正在重新连接远程服务...'
  })
}

// showToast 已从 useToast composable 中获取，无需重复定义

const logHandler = (log: { level: string; message: string }) => {
  console.log(log.message)
}

const handleAdminMessage = (payload: { data: any; timestamp: string }) => {
  const message: AdminMessage = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    data: payload.data,
    timestamp: payload.timestamp,
    read: false
  }
  adminMessages.value.unshift(message)
  // 只保留最近 50 条消息
  if (adminMessages.value.length > 50) {
    adminMessages.value = adminMessages.value.slice(0, 50)
  }
}

const markMessageAsRead = (messageId: string) => {
  const message = adminMessages.value.find((m) => m.id === messageId)
  if (message) {
    message.read = true
  }
}

const markAllAsRead = () => {
  adminMessages.value.forEach((m) => {
    m.read = true
  })
}

const clearMessages = () => {
  adminMessages.value = []
}

const formatMessageTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) {
    return '刚刚'
  } else if (minutes < 60) {
    return `${minutes} 分钟前`
  } else if (hours < 24) {
    return `${hours} 小时前`
  } else if (days < 7) {
    return `${days} 天前`
  } else {
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

const formatCompanyName = (company: any) => {
  if (!company) return '--'
  if (typeof company === 'object') {
    return company?.name || '--'
  }
  return company
}

const copyToClipboard = async (value?: string, label?: string) => {
  if (!value) {
    showToast({
      color: 'warning',
      icon: 'mdi-alert-outline',
      message: '没有可复制的内容'
    })
    return
  }
  try {
    await navigator.clipboard.writeText(value)
    showToast({
      color: 'success',
      icon: 'mdi-content-copy',
      message: label ? `${label} 已复制` : '复制成功'
    })
  } catch (error) {
    console.error('复制失败', error)
    showToast({
      color: 'error',
      icon: 'mdi-alert-circle-outline',
      message: '复制失败，请稍后重试'
    })
  }
}

const refreshLocation = async () => {
  showToast({
    color: 'info',
    icon: 'mdi-map-search',
    message: '正在刷新位置信息...'
  })
  try {
    await websocketClient.refreshLocation(true)
    showToast({
      color: 'success',
      icon: 'mdi-map-marker',
      message: '位置信息已更新'
    })
  } catch (error) {
    console.error('刷新位置失败', error)
    showToast({
      color: 'error',
      icon: 'mdi-alert-circle-outline',
      message: '刷新位置失败，请稍后重试'
    })
  }
}

const toneClass = (tone: string) => {
  switch (tone) {
    case 'success':
      return 'tone-success'
    case 'warning':
      return 'tone-warning'
    case 'error':
      return 'tone-error'
    default:
      return 'tone-muted'
  }
}

  // toast 已从 useToast composable 中获取，无需重复声明

const heroHighlights = computed(() => [
  {
    key: 'latency',
    label: '本地服务',
    value: serverStatus.value ? '在线' : '离线',
    icon: serverStatus.value ? 'mdi-lan-check' : 'mdi-lan-pending',
    color: serverStatus.value ? 'success' : 'warning'
  },
  {
    key: 'browser',
    label: '浏览器通道',
    value: toWsStatusText(wsState.status),
    icon: statusMap(wsState.status).icon,
    color: statusMap(wsState.status).tone === 'success' ? 'success' : statusMap(wsState.status).tone === 'warning' ? 'warning' : 'error'
  }
])

let localTimer: number | null = null
let lastServerCheck = 0
const THROTTLE_DELAY = 5000

const throttle = (lastCheck: number, delay: number) => Date.now() - lastCheck >= delay

const selectMenu = (key: string) => {
  activeMenu.value = key
  // 不再使用 router，直接切换菜单
}

const startServerPolling = () => {
  checkServerStatus()
  if (localTimer) window.clearInterval(localTimer)
  localTimer = window.setInterval(checkServerStatus, 4000)
}

const checkServerStatus = async () => {
  if (!throttle(lastServerCheck, THROTTLE_DELAY)) return
  lastServerCheck = Date.now()
  try {
    const response = await fetch(`${LOCAL_API_BASE}/health`)
    serverStatus.value = response.ok
  } catch {
    serverStatus.value = false
  }
}

// 检查登录状态并获取用户信息
const checkAuthAndGetUserInfo = async () => {
  checkingAuth.value = true // 开始检查，避免闪烁
  try {
    // 先检查是否有 token，如果没有 token 就不需要请求
    const token = await getTokenFromClient()
    if (!token) {
      isLoggedIn.value = false
      userInfo.value = null
      loadingUserInfo.value = false
      checkingAuth.value = false
      return
    }

    loadingUserInfo.value = true
    const info = await getUserInfo()
    userInfo.value = info
    isLoggedIn.value = true
    console.log('检查登录状态成功，用户信息:', info)
  } catch (error: any) {
    // 静默处理 401 错误，不打印到控制台（首次登录时正常情况）
    if (error?.response?.status === 401) {
      isLoggedIn.value = false
      userInfo.value = null
      // 清除可能存在的无效 token（静默清除，不触发退出登录提示）
      try {
        await fetch(`${LOCAL_API_BASE}/logoutToken`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }).catch(() => {})
      } catch (e) {
        // 静默处理
      }
    } else {
      console.error('获取用户信息失败:', error)
      isLoggedIn.value = false
      userInfo.value = null
    }
  } finally {
    loadingUserInfo.value = false
    checkingAuth.value = false // 检查完成
  }
}

// 处理登录成功
const handleLoginSuccess = async () => {
  console.log('handleLoginSuccess: 开始处理登录成功')
  try {
    loadingUserInfo.value = true
    // 登录成功后，直接获取用户信息
    const info = await getUserInfo()
    userInfo.value = info
    isLoggedIn.value = true
    console.log('登录成功，用户信息:', info)
    showToast({
      color: 'success',
      icon: 'mdi-check-circle',
      message: `欢迎回来, ${info.username || info.account}!`
    })
  } catch (error: any) {
    console.error('获取用户信息失败:', error)
    const errorMsg = error?.response?.data?.message || error?.message || '获取用户信息失败'

    // 如果获取用户信息失败，清除 token 并保持登录页面
    isLoggedIn.value = false
    userInfo.value = null

    // 显示错误提示
    showToast({
      color: 'error',
      icon: 'mdi-alert-circle',
      message: errorMsg
    })

    // 清除可能无效的 token（但不显示退出登录的提示）
    try {
      await fetch(`${LOCAL_API_BASE}/logoutToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }).catch(() => {})
    } catch (e) {
      // 静默处理
    }
  } finally {
    loadingUserInfo.value = false
  }
}

// 退出登录
const handleLogout = async () => {
  try {
    await logout()
    isLoggedIn.value = false
    userInfo.value = null
    disconnectWebsocketIfNeeded()
    showToast({
      color: 'success',
      icon: 'mdi-logout',
      message: '已退出登录'
    })
  } catch (error) {
    console.error('退出登录失败:', error)
    // 即使退出失败，也清除本地状态
    isLoggedIn.value = false
    userInfo.value = null
  }
}

// 加载工作目录
const loadWorkspaceDirectory = async () => {
  try {
    const path = await window.api.getWorkspaceDirectory()
    workspaceDirectory.value = path || ''
  } catch (error) {
    console.error('加载工作目录失败:', error)
  }
}

// 选择工作目录
const selectWorkspaceDirectory = async () => {
  try {
    selectingDirectory.value = true
    const selectedPath = await window.api.selectWorkspaceDirectory()
    if (selectedPath) {
      workspaceDirectory.value = selectedPath
      showToast({
        color: 'success',
        icon: 'mdi-check-circle',
        message: '工作目录设置成功'
      })
    }
  } catch (error) {
    console.error('选择工作目录失败:', error)
    showToast({
      color: 'error',
      icon: 'mdi-alert-circle-outline',
      message: '选择工作目录失败，请稍后重试'
    })
  } finally {
    selectingDirectory.value = false
  }
}

// 清除工作目录
const clearWorkspaceDirectory = async () => {
  try {
    await window.api.setWorkspaceDirectory('')
    workspaceDirectory.value = ''
    showToast({
      color: 'success',
      icon: 'mdi-check-circle',
      message: '工作目录已清除'
    })
  } catch (error) {
    console.error('清除工作目录失败:', error)
    showToast({
      color: 'error',
      icon: 'mdi-alert-circle-outline',
      message: '清除工作目录失败，请稍后重试'
    })
  }
}

// 处理文件下载
const handleDownload = async () => {
  if (!downloadUrl.value.trim()) {
    showToast({
      color: 'warning',
      icon: 'mdi-alert-outline',
      message: '请输入下载链接'
    })
    return
  }

  if (!workspaceDirectory.value) {
    showToast({
      color: 'warning',
      icon: 'mdi-alert-outline',
      message: '请先设置工作目录'
    })
    return
  }

  try {
    downloading.value = true
    const result = await window.api.downloadFile(downloadUrl.value.trim())
    
    // 添加到下载历史
    downloadHistory.value.push({
      url: downloadUrl.value.trim(),
      result: result,
      timestamp: Date.now()
    })
    
    // 只保留最近 10 条记录
    if (downloadHistory.value.length > 10) {
      downloadHistory.value = downloadHistory.value.slice(-10)
    }

    if (result.success) {
      if (result.skipped) {
        showToast({
          color: 'info',
          icon: 'mdi-information',
          message: result.message || '文件已存在，跳过下载'
        })
      } else {
        showToast({
          color: 'success',
          icon: 'mdi-check-circle',
          message: result.message || '下载完成'
        })
        // 清空输入框
        downloadUrl.value = ''
      }
    } else {
      showToast({
        color: 'error',
        icon: 'mdi-alert-circle-outline',
        message: result.message || '下载失败'
      })
    }
  } catch (error: any) {
    console.error('下载失败:', error)
    showToast({
      color: 'error',
      icon: 'mdi-alert-circle-outline',
      message: error.message || '下载失败，请稍后重试'
    })
    
    // 添加到下载历史（失败记录）
    downloadHistory.value.push({
      url: downloadUrl.value.trim(),
      result: {
        success: false,
        message: error.message || '下载失败'
      },
      timestamp: Date.now()
    })
  } finally {
    downloading.value = false
  }
}

// 格式化下载结果
const formatDownloadResult = (result: any): string => {
  if (!result) return ''
  
  if (result.success) {
    if (result.skipped) {
      return `已跳过 - ${result.message || '文件已存在'}`
    } else {
      const size = result.fileSize ? formatFileSize(result.fileSize) : ''
      return `下载成功${size ? ` - ${size}` : ''}`
    }
  } else {
    return `失败 - ${result.message || '未知错误'}`
  }
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// 处理文件查询
const handleQuery = async () => {
  if (!queryUrl.value.trim()) {
    showToast({
      color: 'warning',
      icon: 'mdi-alert-outline',
      message: '请输入查询链接'
    })
    return
  }

  if (!workspaceDirectory.value) {
    showToast({
      color: 'warning',
      icon: 'mdi-alert-outline',
      message: '请先设置工作目录'
    })
    return
  }

  try {
    querying.value = true
    queryResult.value = null
    
    const result = await window.api.checkFileDownloaded(queryUrl.value.trim())
    queryResult.value = result

    if (result.found) {
      showToast({
        color: 'success',
        icon: 'mdi-check-circle',
        message: '文件已找到'
      })
    } else {
      showToast({
        color: 'info',
        icon: 'mdi-information',
        message: result.message || '文件未找到'
      })
    }
  } catch (error: any) {
    console.error('查询失败:', error)
    showToast({
      color: 'error',
      icon: 'mdi-alert-circle-outline',
      message: error.message || '查询失败，请稍后重试'
    })
    queryResult.value = {
      found: false,
      message: error.message || '查询失败',
      filePath: null
    }
  } finally {
    querying.value = false
  }
}

onMounted(() => {
  startServerPolling()
  loadWorkspaceDirectory()
  websocketClient.events.on('toast', showToast)
  websocketClient.events.on('log', logHandler)
  websocketClient.events.on('adminMessage', handleAdminMessage)
  ;(window.api as any).getAppVersion().then((v: string) => {
    appVersion.value = v
    websocketClient.updateClientInfo({ appVersion: v })
  })

  // 检查登录状态
  checkAuthAndGetUserInfo()

  // 监听登出事件
  window.addEventListener('auth:logout', () => {
    isLoggedIn.value = false
    userInfo.value = null
  })

  // 监听插件连接状态
  if (window.api.onExtensionConnectionStatus) {
    window.api.onExtensionConnectionStatus((status: any) => {
      extensionConnectionStatus.value = status
    })
  }

  // 定期检查插件连接状态
  const checkExtensionStatus = async () => {
    try {
      const response = await fetch(`${LOCAL_API_BASE}/extension/connections`)
      if (response.ok) {
        const data = await response.json()
        extensionConnectionStatus.value = {
          connected: data.total > 0,
          totalConnections: data.total,
          ...(data.connections?.[0] || {})
        }
      } else {
        extensionConnectionStatus.value = null
      }
    } catch (error) {
      // 忽略错误，可能服务未启动
      extensionConnectionStatus.value = null
    }
  }
  
  // 立即检查一次
  checkExtensionStatus()
  // 每5秒检查一次
  const extensionStatusTimer = setInterval(checkExtensionStatus, 5000)
  
  // 清理定时器
  onBeforeUnmount(() => {
    if (extensionStatusTimer) {
      clearInterval(extensionStatusTimer)
    }
  })
})

onBeforeUnmount(() => {
  if (localTimer) window.clearInterval(localTimer)
  websocketClient.disconnect()
})

onUnmounted(() => {
  websocketClient.events.off('toast', showToast)
  websocketClient.events.off('log', logHandler)
  websocketClient.events.off('adminMessage', handleAdminMessage)
  window.removeEventListener('auth:logout', () => {})
})
</script>

<template>
  <div class="app-root">
    <!-- 检查认证状态时的加载界面 -->
    <div v-if="checkingAuth" class="auth-checking">
      <div class="auth-spinner"></div>
      <p class="mt-4 text-medium-emphasis">正在检查登录状态...</p>
    </div>

    <!-- 登录页面 -->
    <Login v-else-if="!isLoggedIn" @login-success="handleLoginSuccess" />

    <!-- 主应用界面 -->
    <template v-else>
      <transition name="fade">
        <div
          v-if="toast.visible"
          class="ws-snackbar"
          :class="'ws-snackbar--' + toast.color"
        >
          <span class="ws-snackbar-icon">{{ toast.icon }}</span>
          <span>{{ toast.message }}</span>
        </div>
      </transition>

      <el-container class="app-layout">
        <el-aside width="232px" class="app-drawer">
          <div class="drawer-inner">
            <el-menu
              :default-active="activeMenu"
              class="app-menu"
              @select="selectMenu"
            >
              <el-menu-item
                v-for="item in menuItems"
                :key="item.key"
                :index="item.key"
              >
                <span class="menu-item">
                  <span class="menu-item-icon" />
                  <span>{{ item.label }}</span>
                </span>
              </el-menu-item>
            </el-menu>

            <div class="version-pill">
              <span class="version-icon">V</span>
              客户端 v{{ appVersion || '--' }}
            </div>
          </div>
        </el-aside>

        <el-container class="main-surface">
          <el-header height="64px" class="app-bar">
            <div class="bar-left">
              <div class="bar-title">
                <span class="heading">{{ pageTitle }}</span>
                <span class="caption text-medium-emphasis">{{ pageDescription }}</span>
              </div>
              <div class="status-chips">
                <el-tag
                  v-for="chip in statusChips"
                  :key="chip.key"
                  size="small"
                  class="status-chip"
                  :class="toneClass(chip.state)"
                >
                  <span class="status-dot" />
                  <span>{{ chip.label }}</span>
                </el-tag>
              </div>
            </div>

            <div class="bar-right">
              <!-- 用户信息 -->
              <template v-if="userInfo">
                <el-dropdown>
                  <span class="user-btn">
                    <el-avatar size="small" class="mr-2">
                      <span class="avatar-placeholder">U</span>
                    </el-avatar>
                    <span class="user-name">
                      {{ userInfo.username || userInfo.account }}
                    </span>
                    <el-tag
                      v-if="userInfo.isAdmin"
                      size="small"
                      type="primary"
                      effect="plain"
                      class="ml-2"
                    >
                      管理员
                    </el-tag>
                  </span>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item disabled class="dropdown-title">
                        账号信息
                      </el-dropdown-item>
                      <el-dropdown-item divided disabled>
                        用户名：{{ userInfo.username || userInfo.account }}
                      </el-dropdown-item>
                      <el-dropdown-item v-if="userInfo.company" disabled>
                        公司：{{ formatCompanyName(userInfo.company) }}
                      </el-dropdown-item>
                      <el-dropdown-item disabled>
                        账号：{{ userInfo.account }}
                      </el-dropdown-item>
                      <el-dropdown-item divided @click="handleLogout">
                        <span class="text-error">退出登录</span>
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>

              <el-button
                v-else-if="loadingUserInfo"
                text
                loading
                class="ml-2"
              >
                加载中...
              </el-button>
            </div>
          </el-header>

          <el-main class="main-scroll">
            <div class="page-container">
              <Dashboard v-if="activeMenu === 'dashboard'" />
              <Tasks v-else-if="activeMenu === 'tasks'" />
              <Workspace v-else-if="activeMenu === 'workspace'" />
              <Settings v-else-if="activeMenu === 'settings'" />
              <Logs v-else-if="activeMenu === 'logs'" />
              <About v-else-if="activeMenu === 'about'" />
            </div>
          </el-main>
        </el-container>
      </el-container>
    </template>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: #fafafa;
  color: rgba(0, 0, 0, 0.87);
}

.ws-snackbar {
  margin-top: 24px;
}

.ws-snackbar :deep(.v-snackbar__wrapper) {
  border-radius: 16px;
  padding-inline: 16px;
  box-shadow: none;
  background-color: #0f172a;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.08);
  z-index: 99999 !important;
}

.ws-snackbar :deep(.v-snackbar__content) {
  align-items: center;
  gap: 6px;
  font-weight: 500;
  letter-spacing: 0.01em;
}

.ws-snackbar--primary :deep(.v-snackbar__wrapper) {
  background-color: #1d4ed8;
  border-color: rgba(59, 130, 246, 0.4);
}

.ws-snackbar--success :deep(.v-snackbar__wrapper) {
  background-color: #166534;
  border-color: rgba(74, 222, 128, 0.35);
}

.ws-snackbar--warning :deep(.v-snackbar__wrapper) {
  background-color: #b45309;
  border-color: rgba(251, 191, 36, 0.4);
}

.ws-snackbar--error :deep(.v-snackbar__wrapper) {
  background-color: #b91c1c;
  border-color: rgba(248, 113, 113, 0.45);
}

.ws-snackbar--info :deep(.v-snackbar__wrapper) {
  background-color: #0f172a;
  border-color: rgba(148, 163, 184, 0.35);
}

.app-drawer {
  background: #ffffff;
  transition: width 0.25s ease;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
}

.version-pill {
  margin: 0 16px 16px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  color: #6b7280;
  background: #f9fafb;
  border: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
}

:deep(.v-navigation-drawer .v-list-item) {
  margin: 0 8px 4px;
  border-radius: 8px;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

:deep(.v-navigation-drawer .v-list-item:hover) {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.08);
}

:deep(.v-navigation-drawer .v-list-item--active) {
  background: rgba(0, 0, 0, 0.08);
  border-left: 3px solid var(--theme-primary, #000000);
  border-color: rgba(0, 0, 0, 0.12);
  font-weight: 500;
}

:deep(.v-navigation-drawer .v-list-item--active .v-icon) {
  color: var(--theme-primary, #000000);
}

:deep(.v-navigation-drawer .v-list-item--active .v-list-item-title) {
  color: var(--theme-primary, #000000);
  font-weight: 600;
}

:deep(.v-navigation-drawer .v-list-item .v-icon) {
  color: #6b7280;
  transition: color 0.2s ease;
}

:deep(.v-navigation-drawer .v-list-item:hover .v-icon) {
  color: #374151;
}

:deep(.v-list-item-title) {
  font-size: 13px;
  letter-spacing: 0.009375em;
  color: #374151;
  transition: color 0.2s ease;
}

:deep(.v-navigation-drawer .v-list-item:hover .v-list-item-title) {
  color: #111827;
}

:deep(.v-navigation-drawer .v-list-item__prepend) {
  margin-inline-end: 8px;
}

:deep(.v-navigation-drawer .v-list-item__spacer) {
  width: 2px;
  min-width: 2px;
}

/* 导航栏分隔线样式 */
:deep(.v-navigation-drawer .v-divider) {
  opacity: 0.1;
  border-color: rgba(0, 0, 0, 0.1);
}

.main-surface {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  background: #fafafa;
}

.app-bar {
  background: #ffffff;
  padding-inline: 24px;
}

.bar-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.heading {
  font-size: 20px;
  font-weight: 500;
  letter-spacing: 0.0071428571em;
  color: rgba(0, 0, 0, 0.87);
}

.caption {
  font-size: 14px;
  letter-spacing: 0.0178571429em;
  color: rgba(0, 0, 0, 0.6);
}

.status-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-left: 24px;
}

.status-chip {
  font-size: 12px;
  letter-spacing: 0.0166666667em;
  height: 24px;
}

.hero-sheet {
  background: #ffffff;
  padding: 24px;
}

.hero-shell {
  display: flex;
  align-items: center;
  gap: 32px;
}

.hero-copy {
  flex: 1.2;
}

.hero-eyebrow {
  font-size: 12px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  color: #6366f1;
  margin-bottom: 8px;
}

.hero-title {
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px;
}

.hero-desc {
  font-size: 14px;
  color: #475569;
  margin-bottom: 16px;
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.hero-metrics {
  flex: 0.8;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.hero-metric {
  padding: 16px;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.02);
  min-width: 120px;
  border: 1px solid rgba(15, 23, 42, 0.05);
}

.hero-metric-icon {
  display: inline-flex;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  background: rgba(99, 102, 241, 0.12);
}

.hero-metric-icon.text-primary {
  color: var(--theme-primary);
  background: var(--theme-primary-dark);
}

.hero-metric-icon.text-success {
  color: #16a34a;
  background: rgba(22, 163, 74, 0.16);
}

.hero-metric-icon.text-warning {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.18);
}

.hero-metric-icon.text-error {
  color: #dc2626;
  background: rgba(220, 38, 38, 0.18);
}

.hero-metric-label {
  font-size: 12px;
  color: #64748b;
}

.hero-metric-value {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.main-scroll {
  background: #fafafa;
  overflow-y: auto !important;
  height: calc(100vh - 64px) !important;
}

.stat-card {
  background: #ffffff;
  transition: box-shadow 0.2s ease;
}

.stat-card:hover {
  border-color: rgba(0, 0, 0, 0.15) !important;
}

.stat-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.stat-label {
  font-size: 11.5px;
  color: #6b7280;
}

.stat-trend {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 500;
  margin-top: 6px;
}

.stat-trend.text-success {
  color: #16a34a;
}

.stat-trend.text-error {
  color: #dc2626;
}

.stat-trend-label {
  font-size: 11px;
  color: #94a3b8;
  margin-left: 4px;
}

.panel-card {
  background: #ffffff;
  transition: box-shadow 0.2s ease;
}

.panel-card:hover {
  border-color: rgba(0, 0, 0, 0.15) !important;
}

.panel-title {
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 0.009375em;
  color: rgba(0, 0, 0, 0.87);
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-size: 14px;
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: rgba(0, 0, 0, 0.87);
}

.status-pill {
  min-width: 120px;
  justify-content: center;
  font-size: 12px;
  border: 1px solid transparent;
}

.tone-success {
  background: linear-gradient(180deg, #f1fff4, #e4f8e8);
  border-color: rgba(52, 199, 89, 0.4);
  color: #15803d;
}

.tone-warning {
  background: linear-gradient(180deg, #fff9eb, #fff4db);
  border-color: rgba(255, 204, 0, 0.4);
  color: #b45309;
}

.tone-error {
  background: linear-gradient(180deg, #fff4f2, #ffe6e3);
  border-color: rgba(255, 69, 58, 0.4);
  color: #b91c1c;
}

.tone-muted {
  background: linear-gradient(180deg, #f7f7f8, #f1f2f4);
  border-color: rgba(148, 163, 184, 0.4);
  color: #475569;
}

.ws-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #64748b;
  margin-top: 8px;
  flex-wrap: wrap;
}

.ws-meta .ws-error {
  color: #dc2626;
}

.ws-endpoint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #64748b;
  margin-left: auto;
}

.ws-endpoint code {
  background: rgba(15, 23, 42, 0.04);
  border-radius: 6px;
  padding: 2px 6px;
  font-size: 11px;
  color: #0f172a;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.quick-btn {
  min-width: 126px;
}

.client-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 12px;
}

.client-info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.client-info-label {
  color: #6b7280;
  min-width: 80px;
}

.client-info-value {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #111827;
}

.client-info-value code {
  background: rgba(15, 23, 42, 0.04);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
}

.client-location {
  width: 100%;
  justify-content: space-between;
  flex-wrap: wrap;
}

.client-location-org {
  font-weight: 400;
  font-size: 11px;
  color: #94a3b8;
}

.empty-messages {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.message-list {
  padding: 0 !important;
}

.message-item {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.message-item:hover {
  background-color: #f9fafb;
}

.message-item.message-unread {
  background-color: var(--theme-primary-light);
  border-left: 3px solid var(--theme-primary);
}

.message-item:last-child {
  border-bottom: none;
}

.message-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 11px;
  color: #6b7280;
}

.message-time {
  margin-left: auto;
}

.message-content {
  font-size: 12px;
  color: #111827;
  line-height: 1.6;
  word-break: break-word;
}

.message-content pre {
  margin: 0;
  padding: 8px;
  background: #f3f4f6;
  border-radius: 6px;
  font-size: 11px;
  overflow-x: auto;
  max-height: 200px;
  overflow-y: auto;
}

.about-card {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
  box-shadow: none;
}

.about-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.about-version {
  font-size: 12px;
  color: #6b7280;
}

.about-desc {
  font-size: 13px;
  color: #4b5563;
}

/* Chip 圆角由 vuetify-flat.css 统一管理 */

:deep(.v-card-text),
:deep(.v-card-title) {
  padding-inline: 16px;
}

/* 使用 Vuetify 标准过渡效果 */
:deep(.v-btn) {
  text-transform: none;
}

:deep(.v-card) {
  transition: border-color 0.2s ease;
}

.user-info {
  margin-right: 8px;
}

.user-btn {
  text-transform: none;
  font-weight: 500;
  height: 48px !important;
  padding: 0 12px !important;
}

.user-btn :deep(.v-avatar) {
  margin-right: 8px;
}

.user-name {
  margin-right: 4px;
  font-size: 14px;
}

.auth-checking {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #fafafa;
}

.auth-spinner {
  width: 48px;
  height: 48px;
  border-radius: 999px;
  border: 4px solid #e5e7eb;
  border-top-color: #2563eb;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@media (max-width: 960px) {
  .status-chips {
    margin-left: 12px;
    max-width: 320px;
  }

  .app-bar {
    flex-wrap: wrap;
    gap: 8px;
    height: auto;
    padding-block: 8px;
  }

  .hero-shell {
    flex-direction: column;
  }

  .hero-metrics {
    width: 100%;
  }

  .user-info {
    margin-right: 0;
  }
}
</style>
