/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-07-16 18:56:02
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-07-16 19:05:26
 * @FilePath: /design-server/Users/jackie/yishe-electron/src/renderer/src/api/request.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import axios from 'axios'

const isDev = process.env.NODE_ENV === 'development'
const service = axios.create({
  baseURL: isDev ? 'http://localhost:1520/api' : 'https://1s.design:1520/api',
  timeout: 10000
})

service.interceptors.request.use(
  config => {
    // 可在此处添加 token 等 header
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
  error => {
    return Promise.reject(error)
  }
)

const request = (option: any) => {
  const { headersType, headers, ...otherOption } = option
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