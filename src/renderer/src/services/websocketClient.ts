import { io, type Socket } from 'socket.io-client'
import { reactive } from 'vue'
import mitt from 'mitt'

type WsStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error'

const CLIENT_SOURCE = '客户端'
const HEARTBEAT_INTERVAL = 15_000
const HEARTBEAT_TIMEOUT = 10_000
const PROD_WS_ENDPOINT = 'https://1s.design:1520/ws'
const DEV_WS_ENDPOINT = 'http://localhost:1520/ws'
const FALLBACK_ENDPOINT = import.meta.env.PROD ? PROD_WS_ENDPOINT : DEV_WS_ENDPOINT
const DEFAULT_WS_ENDPOINT = import.meta.env.VITE_WS_ENDPOINT ?? FALLBACK_ENDPOINT
const IDENTITY_STORAGE_KEY = 'yishe.ws.identity'
const NETWORK_CACHE_TTL = 10 * 60 * 1000 // 10 minutes
const LOCATION_ENDPOINT = 'https://ipapi.co/json/'

interface WsState {
  endpoint: string
  status: WsStatus
  connectedAt: string | null
  lastPingAt: string | null
  lastPongAt: string | null
  lastLatencyMs: number | null
  lastError: string | null
  retryCount: number
}

interface DeviceIdentity {
  clientId: string
  machineCode: string
  createdAt: string
}

interface NetworkProfile {
  ip?: string
  city?: string
  region?: string
  country?: string
  org?: string
  timezone?: string
  fetchedAt?: string
  source?: string
}

interface ClientInfoPayload {
  clientId: string
  source: string
  appVersion?: string
  platform?: string
  locale?: string
  timezone?: string
  device?: {
    memory?: number
    hardwareConcurrency?: number
  }
  machine?: {
    code?: string
    platform?: string
    createdAt?: string
  }
  location?: NetworkProfile
  notes?: Record<string, unknown>
}

const identity = reactive<DeviceIdentity>(loadIdentity())

function getLocalStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage
    }
    return null
  } catch {
    return null
  }
}

function generateClientId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `yc_${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`
}

function generateMachineCode(clientId: string) {
  return `YC-${clientId.replace(/[^a-zA-Z0-9]/g, '').slice(-12).toUpperCase()}`
}

function loadIdentity(): DeviceIdentity {
  const storage = getLocalStorage()
  const now = new Date().toISOString()
  if (!storage) {
    const newClientId = generateClientId()
    return {
      clientId: newClientId,
      machineCode: generateMachineCode(newClientId),
      createdAt: now
    }
  }

  try {
    const saved = storage.getItem(IDENTITY_STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<DeviceIdentity>
      if (parsed.clientId) {
        const identityValue: DeviceIdentity = {
          clientId: parsed.clientId,
          machineCode: parsed.machineCode || generateMachineCode(parsed.clientId),
          createdAt: parsed.createdAt || now
        }
        storage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(identityValue))
        return identityValue
      }
    }
  } catch (error) {
    console.warn('[ws] 读取本地 identity 失败', error)
  }

  const clientId = generateClientId()
  const newIdentity: DeviceIdentity = {
    clientId,
    machineCode: generateMachineCode(clientId),
    createdAt: now
  }
  try {
    storage?.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(newIdentity))
  } catch (error) {
    console.warn('[ws] 保存 identity 失败', error)
  }
  return newIdentity
}

const wsState = reactive<WsState>({
  endpoint: DEFAULT_WS_ENDPOINT,
  status: 'idle',
  connectedAt: null,
  lastPingAt: null,
  lastPongAt: null,
  lastLatencyMs: null,
  lastError: null,
  retryCount: 0
})

const networkProfile = reactive<NetworkProfile>({})

const clientInfo = reactive<ClientInfoPayload>({
  clientId: identity.clientId,
  source: CLIENT_SOURCE,
  platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
  locale: typeof navigator !== 'undefined' ? navigator.language : 'unknown',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  device: {
    memory: typeof navigator !== 'undefined' ? (navigator as any).deviceMemory : undefined,
    hardwareConcurrency: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : undefined
  },
  machine: {
    code: identity.machineCode,
    platform: typeof navigator !== 'undefined' ? navigator.platform : undefined,
    createdAt: identity.createdAt
  },
  location: networkProfile
})

export type WebsocketEvents = {
  log: { level: 'info' | 'warn' | 'error'; message: string }
  toast: { color: string; icon: string; message: string }
  adminMessage: { data: any; timestamp: string }
}

const emitter = mitt<WebsocketEvents>()

let socket: Socket | null = null
let heartbeatInterval: ReturnType<typeof setInterval> | null = null
let heartbeatTimeout: ReturnType<typeof setTimeout> | null = null
let lastPingTimestamp: number | null = null
let intentionalDisconnect = false
let networkFetchPromise: Promise<void> | null = null

async function fetchNetworkProfile(force = false) {
  if (typeof fetch === 'undefined') {
    return
  }
  const lastFetched = networkProfile.fetchedAt ? Date.parse(networkProfile.fetchedAt) : 0
  if (!force && lastFetched && Date.now() - lastFetched < NETWORK_CACHE_TTL) {
    return
  }
  if (networkFetchPromise) {
    return networkFetchPromise
  }

  networkFetchPromise = (async () => {
    try {
      const response = await fetch(LOCATION_ENDPOINT, { cache: 'no-store' })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      const patch: NetworkProfile = {
        ip: data.ip,
        city: data.city,
        region: data.region,
        country: data.country_name || data.country,
        org: data.org,
        timezone: data.timezone,
        fetchedAt: new Date().toISOString(),
        source: 'ipapi.co'
      }
      Object.assign(networkProfile, patch)
      if (socket?.connected) {
        emitClientInfo()
      }
      emitter.emit('log', { level: 'info', message: `[ws] 网络信息刷新: ${patch.ip || 'unknown'}` })
    } catch (error) {
      emitter.emit('log', { level: 'warn', message: `[ws] 获取网络信息失败: ${serializeError(error)}` })
    } finally {
      networkFetchPromise = null
    }
  })()

  await networkFetchPromise
}

function updateState(patch: Partial<WsState>) {
  Object.assign(wsState, patch)
  emitter.emit('log', { level: 'info', message: `[ws] state updated ${JSON.stringify(patch)}` })
}

function clearHeartbeatInterval() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
  }
}

function clearHeartbeatTimeout() {
  if (heartbeatTimeout) {
    clearTimeout(heartbeatTimeout)
    heartbeatTimeout = null
  }
}

function stopHeartbeat() {
  clearHeartbeatInterval()
  clearHeartbeatTimeout()
  lastPingTimestamp = null
}

function scheduleHeartbeatTimeout() {
  clearHeartbeatTimeout()
  heartbeatTimeout = setTimeout(() => {
    updateState({
      status: 'error',
      lastError: 'Heartbeat timeout'
    })
    emitter.emit('log', { level: 'warn', message: '[ws] heartbeat timeout, reconnecting' })
    emitter.emit('toast', { color: 'warning', icon: 'mdi-heart-broken', message: '实时通道心跳异常，正在重连...' })
    reconnect()
  }, HEARTBEAT_TIMEOUT)
}

function emitHeartbeat() {
  if (!socket || !socket.connected) return
  lastPingTimestamp = Date.now()
  updateState({
    lastPingAt: new Date(lastPingTimestamp).toISOString()
  })
  socket.emit('ping')
  scheduleHeartbeatTimeout()
}

function startHeartbeatLoop() {
  stopHeartbeat()
  heartbeatInterval = setInterval(emitHeartbeat, HEARTBEAT_INTERVAL)
  emitHeartbeat()
}

function cleanupSocket() {
  if (socket) {
    socket.removeAllListeners()
    socket.io.removeAllListeners()
    socket.disconnect()
    socket = null
  }
  stopHeartbeat()
}

function buildQuery() {
  const payload: Record<string, string> = {
    clientSource: CLIENT_SOURCE,
    clientId: identity.clientId,
    machineCode: identity.machineCode
  }

  try {
    payload.clientInfo = JSON.stringify(clientInfo)
  } catch {
    // ignore serialization errors
  }

  return payload
}

function bindSocketEvents(currentSocket: Socket) {
  currentSocket.on('connect', () => {
    emitter.emit('log', { level: 'info', message: '[ws] connected' })
    emitter.emit('toast', { color: 'success', icon: 'mdi-radiobox-marked', message: '实时通道已连接' })
    updateState({
      status: 'connected',
      connectedAt: new Date().toISOString(),
      lastError: null,
      retryCount: 0
    })
    emitClientInfo()
    startHeartbeatLoop()
  })

  currentSocket.on('disconnect', (reason) => {
    emitter.emit('log', { level: 'warn', message: `[ws] disconnected: ${reason}` })
    emitter.emit('toast', { color: 'warning', icon: 'mdi-plug', message: `通道断开：${reason || '未知原因'}` })
    stopHeartbeat()
    updateState({
      status: intentionalDisconnect ? 'disconnected' : 'error',
      lastError: reason || null,
      connectedAt: null
    })
  })

  currentSocket.on('pong', () => {
    clearHeartbeatTimeout()
    const now = Date.now()
    updateState({
      status: 'connected',
      lastPongAt: new Date(now).toISOString(),
      lastLatencyMs: lastPingTimestamp ? now - lastPingTimestamp : null,
      lastError: null
    })
    lastPingTimestamp = null
  })

  currentSocket.on('connect_error', (error) => {
    emitter.emit('log', { level: 'error', message: `[ws] connect_error: ${serializeError(error)}` })
    emitter.emit('toast', { color: 'error', icon: 'mdi-alert-circle-outline', message: '实时通道连接失败' })
    updateState({
      status: 'error',
      lastError: serializeError(error)
    })
  })

  currentSocket.on('error', (error) => {
    emitter.emit('log', { level: 'error', message: `[ws] error: ${serializeError(error)}` })
    updateState({
      status: 'error',
      lastError: serializeError(error)
    })
  })

  currentSocket.io.on('reconnect_attempt', (attempt) => {
    emitter.emit('log', { level: 'info', message: `[ws] reconnect attempt #${attempt}` })
    updateState({
      status: 'reconnecting',
      retryCount: attempt
    })
  })

  currentSocket.io.on('reconnect_failed', () => {
    emitter.emit('log', { level: 'error', message: '[ws] reconnect failed' })
    emitter.emit('toast', { color: 'error', icon: 'mdi-alert-circle-outline', message: '实时通道重连失败' })
    updateState({
      status: 'error',
      lastError: 'Reconnect failed'
    })
  })

  currentSocket.io.on('reconnect_error', (error) => {
    emitter.emit('log', { level: 'error', message: `[ws] reconnect_error: ${serializeError(error)}` })
    updateState({
      status: 'error',
      lastError: serializeError(error)
    })
  })

  // 监听来自管理后台的消息
  currentSocket.on('admin-message', (data: any) => {
    emitter.emit('log', { level: 'info', message: `[ws] received admin-message: ${JSON.stringify(data)}` })
    emitter.emit('adminMessage', {
      data,
      timestamp: new Date().toISOString()
    })
    // 同时显示 toast 通知
    const messageText = typeof data === 'string' ? data : data?.message || data?.text || '收到管理消息'
    emitter.emit('toast', {
      color: 'info',
      icon: 'mdi-message-text-outline',
      message: messageText
    })
  })
}

function serializeError(error: unknown) {
  if (!error) return 'Unknown error'
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

function emitClientInfo() {
  if (!socket || !socket.connected) return
  socket.emit('client-info', { ...clientInfo })
}

function connect(endpoint?: string) {
  const targetEndpoint = endpoint || wsState.endpoint || DEFAULT_WS_ENDPOINT
  wsState.endpoint = targetEndpoint
  void fetchNetworkProfile()

  if (socket && socket.connected) {
    return
  }

  cleanupSocket()
  intentionalDisconnect = false

  updateState({
    status: 'connecting',
    lastError: null,
    retryCount: 0
  })

  socket = io(targetEndpoint, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 12_000,
    timeout: 8000,
    query: buildQuery()
  })

  bindSocketEvents(socket)
}

function disconnect() {
  intentionalDisconnect = true
  cleanupSocket()
  updateState({
    status: 'disconnected',
    lastError: null,
    retryCount: 0,
    connectedAt: null
  })
}

function reconnect() {
  intentionalDisconnect = false
  cleanupSocket()
  connect()
}

function setEndpoint(endpoint: string) {
  wsState.endpoint = endpoint || DEFAULT_WS_ENDPOINT
  reconnect()
}

function updateClientInfo(payload: Partial<ClientInfoPayload>) {
  Object.assign(clientInfo, payload)
  emitClientInfo()
}

void fetchNetworkProfile()

export const websocketClient = {
  state: wsState,
  identity,
  network: networkProfile,
  profile: clientInfo,
  connect,
  disconnect,
  reconnect,
  setEndpoint,
  updateClientInfo,
  events: emitter,
  refreshLocation: fetchNetworkProfile
}

