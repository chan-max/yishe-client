/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-06-10 19:05:10
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-06-12 07:53:10
 * @FilePath: /yishe-electron/src/main/browser.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import puppeteer from 'puppeteer-core'
import { startChrome } from './chrome'

let browserInstance = null

async function getWebSocketUrl(timeout = 5000): Promise<string> {  // 修改默认超时为5秒
  const startTime = Date.now()
  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch('http://127.0.0.1:9222/json/version')
      if (response.ok) {
        const data = await response.json()
        console.log('[DEBUG] 获取到最新webSocketDebuggerUrl:', data.webSocketDebuggerUrl)
        return data.webSocketDebuggerUrl
      }
    } catch (error) {
      console.log('[DEBUG] 连接调试器失败，0.5秒后重试...')
    }
    await new Promise(resolve => setTimeout(resolve, 500))  // 保持500ms重试间隔
  }
  throw new Error(`等待Chrome调试器超时（${timeout}ms）`)
}

export async function getBrowser() {
  if (browserInstance) {
    try {
      // 检查浏览器连接状态
      const pages = await browserInstance.pages()
      if (pages.length >= 0) {
        return browserInstance
      }
    } catch (error) {
      console.log('浏览器连接已断开，重新连接...')
      browserInstance = null
    }
  }

  let retryCount = 0
  const maxRetries = 3

  while (retryCount < maxRetries) {
    try {
      await startChrome()
      
      // 新增无限重试机制
      let webSocketUrl = '';
      while (!webSocketUrl) {
        try {
          webSocketUrl = await getWebSocketUrl(5000)
        } catch (error) {
          console.log('浏览器未就绪，5秒后重试...')
          await new Promise(resolve => setTimeout(resolve, 5000))
        }
      }

      browserInstance = await puppeteer.connect({
        browserWSEndpoint: webSocketUrl,
        defaultViewport: null
      })

      // 验证连接是否成功
      await browserInstance.pages()
      console.log('浏览器连接成功')
      return browserInstance
    } catch (error) {
      console.error(`连接浏览器失败 (尝试 ${retryCount + 1}/${maxRetries}):`, error)
      retryCount++
      
      if (retryCount < maxRetries) {
        console.log('5秒后重试...')
        await new Promise(resolve => setTimeout(resolve, 5000))
      } else {
        throw new Error('连接浏览器失败，已达到最大重试次数')
      }
    }
  }
}

export function closeBrowser(): void {
  if (browserInstance) {
    browserInstance.disconnect()
    browserInstance = null
  }
}