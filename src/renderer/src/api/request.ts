/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-07-16 18:56:02
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-07-16 19:05:26
 * @FilePath: /design-server/Users/jackie/yishe-electron/src/renderer/src/api/request.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import axios from 'axios'
import { getTokenFromClient } from './user'
import { REMOTE_API_BASE, LOCAL_API_BASE } from '../config/api'

const service = axios.create({
  baseURL: REMOTE_API_BASE,
  timeout: 10000
})

service.interceptors.request.use(
  async config => {
    // 添加 token 到 header（包括登录接口，这样后端可以检查是否有有效 token）
    try {
      const token = await getTokenFromClient()
      console.log('请求拦截器：获取 token 结果', {
        url: config.url,
        hasToken: !!token,
        tokenType: typeof token,
        tokenLength: token?.length,
        tokenPreview: token ? `${token.substring(0, 30)}...` : 'null',
        isLoginEndpoint: config.url?.includes('/auth/login')
      })
      
      if (token) {
        // 确保 headers 对象存在（axios 的 headers 可能是 AxiosHeaders 类型）
        if (!config.headers) {
          config.headers = {} as any
        }
        // 使用 set 方法确保正确设置 header（兼容 AxiosHeaders）
        if (typeof (config.headers as any).set === 'function') {
          (config.headers as any).set('Authorization', `Bearer ${token}`)
        } else {
          (config.headers as any).Authorization = `Bearer ${token}`
        }
        console.log('请求拦截器：已添加 token 到请求头', {
          url: config.url,
          authorizationHeader: `Bearer ${token.substring(0, 30)}...`,
          isLoginEndpoint: config.url?.includes('/auth/login') ? '（登录接口，后端会检查 token 是否有效）' : ''
        })
      } else {
        if (config.url?.includes('/auth/login')) {
          console.log('请求拦截器：登录接口，无 token，将正常登录')
        } else {
          console.warn('请求拦截器：未找到 token，请求将不带 token', { url: config.url })
        }
      }
    } catch (error) {
      console.error('请求拦截器：获取 token 失败', error)
    }
    
    // 最终检查 headers（确保能正确读取）
    const authHeader = (config.headers as any)?.Authorization || (config.headers as any)?.get?.('Authorization')
    console.log('请求拦截器：最终 headers 检查', {
      url: config.url,
      hasAuthorization: !!authHeader,
      authorizationValue: authHeader ? (typeof authHeader === 'string' ? authHeader.substring(0, 30) + '...' : 'exists') : 'null',
      headersType: config.headers?.constructor?.name
    })
    
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  response => {
    return response
  },
  async error => {
    // 如果 token 失效，清除本地 token 并触发重新登录
    // 但登录接口的 401 不应该触发清除 token（可能是账号密码错误）
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      try {
        await fetch(`${LOCAL_API_BASE}/logoutToken`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        // 触发登录事件
        window.dispatchEvent(new CustomEvent('auth:logout'))
      } catch (e) {
        console.error('清除 token 失败:', e)
      }
    }
    return Promise.reject(error)
  }
)

const request = (option: any) => {
  const { headersType, headers, ...otherOption } = option
  // 注意：不能在这里设置 headers，因为拦截器会在之后添加 Authorization
  // 如果在这里设置 headers，会覆盖拦截器设置的 Authorization
  // 所以只传递其他配置，让拦截器处理 headers
  return service({
    ...otherOption,
    headers: {
      'Content-Type': headersType || 'application/json',
      ...headers
    }
  })
}

export default {
  get: async <T = any>(option: any) => {
    const res = await request({ method: 'GET', ...option })
    return res.data as T
  },
  post: async <T = any>(option: any) => {
    const res = await request({ method: 'POST', ...option })
    return res.data as T
  }
} 