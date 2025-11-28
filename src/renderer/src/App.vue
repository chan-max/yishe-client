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
      label: `实时通道 · ${wsDescriptor.text}`,
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
    message: '正在重新连接实时通道...'
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

const hideToTray = async () => {
  await window.api.hideMainWindow()
}

onMounted(() => {
  startServerPolling()
  websocketClient.connect()
  websocketClient.events.on('toast', showToast)
  websocketClient.events.on('log', logHandler)
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
          <v-btn
            color="primary"
            variant="flat"
            size="small"
            prepend-icon="mdi-tray-arrow-down"
            @click="hideToTray"
          >
            隐藏到托盘
          </v-btn>
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
                        <span>实时通道</span>
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
  background: #eef2f9;
  color: #1f2937;
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    'PingFang SC',
    'Microsoft YaHei',
    sans-serif;
}

.ws-snackbar :deep(.v-snackbar__wrapper) {
  border-radius: 999px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.15);
}

.app-drawer {
  border-right: 1px solid #e5e7eb;
  background: #ffffff;
  transition: width 0.25s ease;
  /* 给 macOS 左上角原生窗口按钮留出更充足的空间，避免遮挡菜单 */
  padding-top: 44px;
  box-shadow: 2px 0 8px rgba(15, 23, 42, 0.04);
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
  border-radius: 10px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.v-navigation-drawer .v-list-item:hover) {
  background: rgba(37, 99, 235, 0.06);
}

:deep(.v-navigation-drawer .v-list-item--active) {
  background: rgba(37, 99, 235, 0.12);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
}

:deep(.v-navigation-drawer .v-list-item--active .v-icon) {
  color: #2563eb;
  transform: scale(1.05);
}

:deep(.v-navigation-drawer .v-list-item--active .v-list-item-title) {
  color: #2563eb;
  font-weight: 600;
}

:deep(.v-list-item-title) {
  font-size: 13px;
  letter-spacing: 0.15px;
  color: #374151;
  transition: color 0.2s ease;
}

:deep(.v-navigation-drawer .v-list-item__prepend) {
  margin-inline-end: 12px;
}

.main-surface {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  background: #f5f7fb;
}

.app-bar {
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
  padding-inline: 20px;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.05);
}

.bar-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.heading {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.2px;
  color: #111827;
}

.caption {
  font-size: 11.5px;
  letter-spacing: 0.2px;
  color: #6b7280;
}

.status-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-left: 24px;
}

.status-chip {
  font-size: 12px;
  letter-spacing: 0.1px;
  padding-inline: 14px;
  background: rgba(15, 23, 42, 0.04);
  color: #111827;
  border-radius: 999px;
  border: 1px solid transparent;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.hero-sheet {
  background: radial-gradient(circle at top right, rgba(37, 99, 235, 0.12), transparent),
    linear-gradient(135deg, #ffffff 0%, #f6f9ff 65%);
  border: 1px solid rgba(37, 99, 235, 0.08);
  padding: 32px;
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
  background: linear-gradient(180deg, #f6f8fc 0%, #eef2f9 100%);
}

.stat-card {
  background: #ffffff;
  border: 1px solid transparent;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.12);
}

.stat-card--primary {
  border-color: rgba(37, 99, 235, 0.15);
}

.stat-card--success {
  border-color: rgba(22, 163, 74, 0.15);
}

.stat-card--warning {
  border-color: rgba(245, 158, 11, 0.2);
}

.stat-card--error {
  border-color: rgba(220, 38, 38, 0.15);
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
  border: 1px solid transparent;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06);
  transition: box-shadow 0.2s ease;
}

.panel-card:hover {
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.1);
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.2px;
  color: #1f2937;
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 12px;
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

/* 优化按钮的过渡效果 */
:deep(.v-btn) {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.v-btn:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}

:deep(.v-btn:active) {
  transform: translateY(0);
}

/* 优化卡片的过渡效果 */
:deep(.v-card) {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 优化输入框的焦点效果 */
:deep(.v-field--focused) {
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
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
