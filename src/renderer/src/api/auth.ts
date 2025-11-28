/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-01-XX XX:XX:XX
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-01-XX XX:XX:XX
 * @FilePath: /yishe-electron/src/renderer/src/api/auth.ts
 * @Description: 登录相关API
 */
import request from './request'
import { saveTokenToClient, getTokenFromClient } from './user'
import { LOCAL_API_BASE } from '../config/api'

export interface LoginParams {
  username: string  // 后端 LocalStrategy 期望的字段名是 username
  password: string
}

export interface LoginResponse {
  data: {
    token: string
  }
  code: number
  status: boolean
}

export interface UserInfo {
  id: string
  account: string
  username?: string
  company?: string
  isAdmin?: boolean
  [key: string]: any
}

// 登录
export const login = async (params: LoginParams): Promise<LoginResponse> => {
  // 后端 LocalStrategy 期望的字段是 username，不是 account
  const response = await request.post<LoginResponse>({
    url: '/auth/login',
    data: {
      username: params.username,  // 使用 username 字段
      password: params.password
    }
  })
  
  console.log('登录响应:', response)
  
  // 从 response.data.token 中提取 token
  const token = response?.data?.token
  if (token) {
    console.log('提取到 token，开始保存:', { tokenLength: token.length, tokenPreview: token.substring(0, 30) + '...' })
    await saveTokenToClient(token)
    // 验证 token 是否已成功保存（最多重试 5 次）
    let retries = 0
    while (retries < 5) {
      const savedToken = await getTokenFromClient()
      if (savedToken === token) {
        console.log('Token 已成功保存并验证')
        break
      }
      await new Promise(resolve => setTimeout(resolve, 50))
      retries++
    }
    if (retries >= 5) {
      console.warn('Token 保存验证失败，但继续执行')
    }
  } else {
    console.error('登录响应中未找到 token:', response)
    throw new Error('登录失败：未获取到 token')
  }
  
  return response
}

// 获取用户信息
export const getUserInfo = async (): Promise<UserInfo> => {
  // 在调用前先验证 token 是否存在
  const token = await getTokenFromClient()
  console.log('getUserInfo 调用前检查 token:', {
    hasToken: !!token,
    tokenLength: token?.length,
    tokenPreview: token ? `${token.substring(0, 20)}...` : 'null'
  })
  
  const response = await request.post<{ data: UserInfo } | UserInfo>({
    url: '/user/getUserInfo',
    data: {}
  })
  
  console.log('getUserInfo 响应:', response)
  
  // 处理嵌套结构：如果响应有 data 字段，则从 data 中提取用户信息
  if (response && typeof response === 'object' && 'data' in response && response.data) {
    return response.data as UserInfo
  }
  
  // 否则直接返回响应（兼容非嵌套结构）
  return response as UserInfo
}

// 登出
export const logout = async (): Promise<void> => {
  try {
    await request.post({
      url: '/auth/logout'
    })
  } catch (error) {
    console.error('登出失败:', error)
  } finally {
    // 清除本地 token
    await getTokenFromClient().then(token => {
      if (token) {
        // 通过本地服务清除 token
        fetch(`${LOCAL_API_BASE}/logoutToken`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }).catch(console.error)
      }
    })
  }
}

