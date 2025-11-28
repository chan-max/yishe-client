/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-01-XX XX:XX:XX
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-01-XX XX:XX:XX
 * @FilePath: /yishe-electron/src/renderer/src/config/api.ts
 * @Description: API 地址配置
 */

const isDev = process.env.NODE_ENV === 'development'

// 远程 API 地址（登录、用户信息等）
export const REMOTE_API_BASE = isDev 
  ? 'http://localhost:1520/api' 
  : 'https://1s.design:1520/api'

// 本地 Electron 服务地址（健康检查、token 管理等）
export const LOCAL_API_BASE = 'http://localhost:1519/api'

// WebSocket 地址
export const WS_ENDPOINT = isDev
  ? 'http://localhost:1520/ws'
  : 'https://1s.design:1520/ws'

