<!--
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-06-08 23:07:32
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-01-XX XX:XX:XX
 * @FilePath: /yishe-electron/src/renderer/src/App.vue
 * @Description: 衣设程序主界面 - 管理系统风格设计
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, onUnmounted, reactive, ref } from 'vue'
import { websocketClient } from './services/websocketClient'

const serverStatus = ref(false)
const appVersion = ref('')
const activeMenu = ref('dashboard')

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
const deviceIdentity = websocketClient.identity
const networkProfile = websocketClient.network

const menuItems = [
  { key: 'dashboard', label: '仪表盘', icon: 'mdi-view-dashboard-outline' },
  { key: 'tasks', label: '任务管理', icon: 'mdi-clipboard-check-outline' },
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
  settings: '维护系统参数与设备配置',
  logs: '追踪运行日志与异常信息',
  about: '查看客户端版本信息'
}

const appLogo = new URL('./assets/icon.png', import.meta.url).href

const pageTitle = computed(() => menuItems.find((item) => item.key === activeMenu.value)?.label ?? '')
const pageDescription = computed(() => pageDescriptions[activeMenu.value] ?? '')

const statusChips = computed(() => {
  const wsDescriptor = statusMap(wsState.status)
  return [
    {
      key: 'local',
      label: serverStatus.value ? '本地服务 · 运行中' : '本地服务 · 未连接',
      state: serverStatus.value ? 'success' : 'error',
      icon: serverStatus.value ? 'mdi-lan-connect' : 'mdi-lan-disconnect'
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

const reconnectWebsocket = () => {
  websocketClient.reconnect()
  showToast({
    color: 'primary',
    icon: 'mdi-rotate-right',
    message: '正在重新连接远程服务...'
  })
}

const showToast = (payload: { color: string; icon: string; message: string }) => {
  toast.message = payload.message
  toast.icon = payload.icon
  toast.color = payload.color
  toast.visible = true
}

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

const toast = reactive({
  visible: false,
  icon: 'mdi-information-outline',
  color: 'primary',
  message: ''
})

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

let localTimer: ReturnType<typeof window.setInterval> | null = null
let lastServerCheck = 0
const THROTTLE_DELAY = 5000

const throttle = (lastCheck: number, delay: number) => Date.now() - lastCheck >= delay

const selectMenu = (key: string) => {
  activeMenu.value = key
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
    const response = await fetch('http://localhost:1519/api/health')
    serverStatus.value = response.ok
  } catch {
    serverStatus.value = false
  }
}

onMounted(() => {
  startServerPolling()
  websocketClient.connect()
  websocketClient.events.on('toast', showToast)
  websocketClient.events.on('log', logHandler)
  websocketClient.events.on('adminMessage', handleAdminMessage)
  window.api.getAppVersion().then((v) => {
    appVersion.value = v
    websocketClient.updateClientInfo({ appVersion: v })
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
})
</script>

<template>
  <v-app>
    <v-snackbar
      v-model="toast.visible"
      :timeout="3000"
      :color="toast.color"
      variant="tonal"
      location="top right"
      class="ws-snackbar"
    >
      <v-icon size="18" class="mr-2">{{ toast.icon }}</v-icon>
      {{ toast.message }}
    </v-snackbar>
    <v-layout class="app-layout">
      <v-navigation-drawer width="232" permanent class="app-drawer">
        <v-divider class="mx-3 mb-2" />

        <v-list density="compact" nav class="pa-0 mt-1" :lines="false">
          <v-list-item
            v-for="item in menuItems"
            :key="item.key"
            :value="item.key"
            :active="activeMenu === item.key"
            rounded="lg"
            class="mx-2"
            @click="selectMenu(item.key)"
          >
            <template #prepend>
              <v-icon size="18" :icon="item.icon" />
            </template>
            <v-list-item-title>{{ item.label }}</v-list-item-title>
          </v-list-item>
        </v-list>

        <template #append>
          <v-divider class="mx-3 mb-2" />
          <div class="version-pill">
            <v-icon size="14" icon="mdi-alpha-v-box-outline" class="mr-1" />
            客户端 v{{ appVersion || '--' }}
          </div>
        </template>
      </v-navigation-drawer>

      <div class="main-surface">
        <v-app-bar flat height="64" class="app-bar" density="comfortable">
          <div class="bar-title">
            <span class="heading">{{ pageTitle }}</span>
            <span class="caption text-medium-emphasis">{{ pageDescription }}</span>
          </div>
          <div class="status-chips">
            <v-chip
              v-for="chip in statusChips"
              :key="chip.key"
              class="status-chip"
              :class="toneClass(chip.state)"
              variant="flat"
              rounded="pill"
            >
              <v-icon size="16" class="mr-2">{{ chip.icon }}</v-icon>
              {{ chip.label }}
            </v-chip>
          </div>
          <v-spacer />
        </v-app-bar>

        <v-main class="main-scroll">
          <v-container fluid class="py-6 px-6">
            <template v-if="activeMenu === 'dashboard'">
              <v-row class="hero-row mb-6" dense>
                <v-col cols="12">
                  <v-sheet class="hero-sheet" rounded="xl" elevation="0">
                    <div class="hero-shell">
                      <div class="hero-copy">
                        <p class="hero-eyebrow">控制中心</p>
                        <h2 class="hero-title">实时掌握衣设客户端运行状况</h2>
                        <p class="hero-desc">
                          关键节点、服务连接与任务进度在此一目了然，便于随时调整策略。
                        </p>
                        <div class="hero-actions">
                          <v-btn color="primary" prepend-icon="mdi-refresh-auto">
                            立即巡检
                          </v-btn>
                          <v-btn variant="text" color="primary" prepend-icon="mdi-file-chart-outline">
                            导出报告
                          </v-btn>
                        </div>
                      </div>
                      <div class="hero-metrics">
                        <div
                          v-for="item in heroHighlights"
                          :key="item.key"
                          class="hero-metric"
                        >
                          <div class="hero-metric-icon" :class="`text-${item.color}`">
                            <v-icon :icon="item.icon" />
                          </div>
                          <div class="hero-metric-label">{{ item.label }}</div>
                          <div class="hero-metric-value">{{ item.value }}</div>
                        </div>
                      </div>
                    </div>
                  </v-sheet>
                </v-col>
              </v-row>

              <v-row dense>
                <v-col
                  v-for="card in statCards"
                  :key="card.key"
                  cols="12"
                  sm="6"
                  md="3"
                >
                  <v-card
                    class="stat-card"
                    elevation="2"
                    rounded="lg"
                    variant="flat"
                    :class="`stat-card--${card.color}`"
                  >
                    <v-card-text class="d-flex align-center ga-4 pa-4">
                      <v-avatar :color="card.color" size="38" variant="tonal">
                        <v-icon size="20">{{ card.icon }}</v-icon>
                      </v-avatar>
                      <div class="stat-meta">
                        <div class="stat-value">{{ card.value }}</div>
                        <div class="stat-label">{{ card.label }}</div>
                        <div class="stat-trend" :class="card.trendPositive ? 'text-success' : 'text-error'">
                          <v-icon
                            class="mr-1"
                            size="14"
                            :icon="card.trendPositive ? 'mdi-arrow-up' : 'mdi-arrow-down'"
                          />
                          <span>{{ card.trend }}</span>
                          <span class="stat-trend-label">{{ card.trendLabel }}</span>
                        </div>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <v-row dense class="mt-1">
                <v-col cols="12" lg="6">
                  <v-card elevation="2" rounded="xl" class="panel-card">
                    <v-card-title class="panel-title d-flex align-center ga-2">
                      <v-icon icon="mdi-heart-pulse" size="16" />
                      系统状态
                    </v-card-title>
                    <v-divider />
                    <v-card-text class="status-list">
                      <div class="status-row">
                        <span>本地服务</span>
                        <v-chip
                          class="status-pill"
                          :class="toneClass(serverStatus ? 'success' : 'error')"
                          variant="flat"
                          rounded="pill"
                        >
                          <v-icon size="14" class="mr-1">
                            {{ serverStatus ? 'mdi-check-circle-outline' : 'mdi-close-circle-outline' }}
                          </v-icon>
                          {{ serverStatus ? '运行中' : '未连接' }}
                        </v-chip>
                      </div>
                      <div class="status-row">
                        <span>远程服务</span>
                        <v-chip
                          class="status-pill"
                          :class="toneClass(websocketBadge.tone)"
                          rounded="pill"
                          variant="flat"
                        >
                          <v-icon size="14" class="mr-1">{{ websocketBadge.icon }}</v-icon>
                          {{ websocketBadge.text }}
                        </v-chip>
                      </div>
                      <div class="ws-meta" v-if="wsState.lastLatencyMs || wsState.lastError">
                        <span v-if="wsState.lastLatencyMs">延迟 {{ wsState.lastLatencyMs }} ms</span>
                        <span v-if="wsState.lastError" class="ws-error"> {{ wsState.lastError }}</span>
                      </div>
                    </v-card-text>
                    <v-divider />
                    <v-card-actions class="pa-4">
                      <v-btn
                        size="small"
                        variant="tonal"
                        color="primary"
                        prepend-icon="mdi-rotate-right"
                        @click="reconnectWebsocket"
                      >
                        重连通道
                      </v-btn>
                      <div class="ws-endpoint">
                        <span>端点</span>
                        <code>{{ wsState.endpoint }}</code>
                      </div>
                    </v-card-actions>
                  </v-card>
                </v-col>

                <v-col cols="12" lg="6">
                  <v-card elevation="2" rounded="xl" class="panel-card">
                    <v-card-title class="panel-title d-flex align-center ga-2">
                      <v-icon icon="mdi-flash-outline" size="16" />
                      快速操作
                    </v-card-title>
                    <v-divider />
                    <v-card-text>
                      <div class="quick-actions">
                        <v-btn
                          v-for="link in quickLinks"
                          :key="link.url"
                          variant="tonal"
                          color="primary"
                          :href="link.url"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="quick-btn"
                          :prepend-icon="link.icon"
                        >
                          {{ link.label }}
                        </v-btn>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>

                <v-col cols="12" lg="6">
                  <v-card elevation="2" rounded="xl" class="panel-card">
                    <v-card-title class="panel-title d-flex align-center ga-2">
                      <v-icon icon="mdi-message-text-outline" size="16" />
                      管理消息
                      <v-chip
                        v-if="unreadCount > 0"
                        size="small"
                        color="error"
                        class="ml-2"
                      >
                        {{ unreadCount }}
                      </v-chip>
                      <v-spacer />
                      <v-btn
                        v-if="adminMessages.length > 0"
                        icon
                        size="20"
                        variant="text"
                        @click="markAllAsRead"
                        title="全部已读"
                      >
                        <v-icon size="16">mdi-check-all</v-icon>
                      </v-btn>
                      <v-btn
                        v-if="adminMessages.length > 0"
                        icon
                        size="20"
                        variant="text"
                        @click="clearMessages"
                        title="清空消息"
                      >
                        <v-icon size="16">mdi-delete-outline</v-icon>
                      </v-btn>
                    </v-card-title>
                    <v-divider />
                    <v-card-text class="message-list" style="max-height: 400px; overflow-y: auto">
                      <div v-if="adminMessages.length === 0" class="empty-messages">
                        <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-inbox-outline</v-icon>
                        <p class="text-grey">暂无消息</p>
                      </div>
                      <div
                        v-for="msg in adminMessages"
                        :key="msg.id"
                        class="message-item"
                        :class="{ 'message-unread': !msg.read }"
                        @click="markMessageAsRead(msg.id)"
                      >
                        <div class="message-header">
                          <v-icon size="16" color="primary" class="mr-2">mdi-message-text</v-icon>
                          <span class="message-time">{{ formatMessageTime(msg.timestamp) }}</span>
                          <v-chip
                            v-if="!msg.read"
                            size="x-small"
                            color="error"
                            class="ml-2"
                          >
                            新
                          </v-chip>
                        </div>
                        <div class="message-content">
                          <pre v-if="typeof msg.data === 'object'">{{ JSON.stringify(msg.data, null, 2) }}</pre>
                          <span v-else>{{ msg.data }}</span>
                        </div>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>

                <v-col cols="12" lg="6">
                  <v-card elevation="2" rounded="xl" class="panel-card">
                    <v-card-title class="panel-title d-flex align-center ga-2">
                      <v-icon icon="mdi-shield-account" size="16" />
                      客户端身份
                    </v-card-title>
                    <v-divider />
                    <v-card-text class="client-card">
                      <div class="client-info-row">
                        <div class="client-info-label">客户端 ID</div>
                        <div class="client-info-value">
                          <code>{{ clientProfile.clientId || '--' }}</code>
                          <v-btn
                            icon
                            size="24"
                            variant="text"
                            @click="copyToClipboard(clientProfile.clientId, '客户端 ID')"
                          >
                            <v-icon size="16">mdi-content-copy</v-icon>
                          </v-btn>
                        </div>
                      </div>
                      <div class="client-info-row">
                        <div class="client-info-label">机器码</div>
                        <div class="client-info-value">
                          <v-chip size="small" color="primary" variant="tonal" v-if="clientProfile.machine?.code">
                            {{ clientProfile.machine.code }}
                          </v-chip>
                          <span v-else>--</span>
                        </div>
                      </div>
                      <div class="client-info-row">
                        <div class="client-info-label">系统</div>
                        <div class="client-info-value">
                          {{ clientProfile.platform || clientProfile.machine?.platform || '未知' }}
                        </div>
                      </div>
                      <div class="client-info-row">
                        <div class="client-info-label">硬件</div>
                        <div class="client-info-value">
                          <span>
                            {{ clientProfile.device?.hardwareConcurrency || '未知' }} 核 /
                            {{ clientProfile.device?.memory ? `${clientProfile.device.memory} GB` : '未知' }}
                          </span>
                        </div>
                      </div>
                      <div class="client-info-row">
                        <div class="client-info-label">位置</div>
                        <div class="client-info-value client-location">
                          <div>
                            <strong>{{ clientProfile.location?.ip || '--' }}</strong>
                            <span v-if="clientProfile.location?.city">
                              （{{ clientProfile.location.city }}
                              <span v-if="clientProfile.location?.region">·{{ clientProfile.location.region }}</span>
                              <span v-if="clientProfile.location?.country">·{{ clientProfile.location.country }}</span>）
                            </span>
                            <div class="client-location-org" v-if="clientProfile.location?.org">
                              {{ clientProfile.location.org }}
                            </div>
                          </div>
                          <v-btn
                            size="small"
                            variant="text"
                            color="primary"
                            prepend-icon="mdi-refresh"
                            @click="refreshLocation"
                          >
                            更新
                          </v-btn>
                        </div>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </template>

            <template v-else-if="['tasks', 'settings', 'logs'].includes(activeMenu)">
              <v-card elevation="2" rounded="xl" class="panel-card">
                <v-card-title class="panel-title">
                  {{ pageTitle }}
                </v-card-title>
                <v-divider />
                <v-card-text class="text-center py-10 text-medium-emphasis">
                  功能开发中，敬请期待…
                </v-card-text>
              </v-card>
            </template>

            <template v-else-if="activeMenu === 'about'">
              <v-card border="sm" class="about-card mx-auto" max-width="480">
                <v-card-text class="d-flex flex-column align-center py-8 ga-2">
                  <v-avatar size="72" rounded="lg">
                    <v-img :src="appLogo" cover alt="logo" />
                  </v-avatar>
                  <div class="about-title">衣设客户端</div>
                  <div class="about-version">版本 v{{ appVersion || '--' }}</div>
                  <div class="about-desc">最具创意的设计工具</div>
                  <v-btn
                    variant="text"
                    color="primary"
                    href="https://github.com/chan-max"
                    target="_blank"
                    rel="noopener noreferrer"
                    prepend-icon="mdi-github"
                  >
                    Jackie Chan
                  </v-btn>
                </v-card-text>
              </v-card>
            </template>
          </v-container>
        </v-main>
      </div>
    </v-layout>
  </v-app>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: #fafafa;
  color: rgba(0, 0, 0, 0.87);
}

.ws-snackbar :deep(.v-snackbar__wrapper) {
  border-radius: 999px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.15);
}

.app-drawer {
  background: #ffffff;
  transition: width 0.25s ease;
  /* 给 macOS 左上角原生窗口按钮留出更充足的空间，避免遮挡菜单 */
  padding-top: 44px;
}

.version-pill {
  margin: 0 16px 16px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  color: #4b5563;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.v-navigation-drawer .v-list-item) {
  margin: 0 8px 4px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

:deep(.v-navigation-drawer .v-list-item:hover) {
  background: rgba(0, 0, 0, 0.04);
}

:deep(.v-navigation-drawer .v-list-item--active) {
  background: rgba(25, 118, 210, 0.12);
}

:deep(.v-navigation-drawer .v-list-item--active .v-icon) {
  color: #1976d2;
}

:deep(.v-navigation-drawer .v-list-item--active .v-list-item-title) {
  color: #1976d2;
  font-weight: 500;
}

:deep(.v-list-item-title) {
  font-size: 14px;
  letter-spacing: 0.009375em;
  color: rgba(0, 0, 0, 0.87);
}

:deep(.v-navigation-drawer .v-list-item__prepend) {
  margin-inline-end: 12px;
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
  border-radius: 16px;
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
  color: #2563eb;
  background: rgba(37, 99, 235, 0.15);
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
}

.stat-card {
  background: #ffffff;
  transition: box-shadow 0.2s ease;
}

.stat-card:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
  background-color: rgba(37, 99, 235, 0.04);
  border-left: 3px solid #2563eb;
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
  border: 1px solid transparent;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
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

:deep(.v-chip) {
  border-radius: 999px;
}

:deep(.v-card-text),
:deep(.v-card-title) {
  padding-inline: 16px;
}

/* 使用 Vuetify 标准过渡效果 */
:deep(.v-btn) {
  text-transform: none;
}

:deep(.v-card) {
  transition: box-shadow 0.2s ease;
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
}
</style>
