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
      await browserInstance.pages()
      return browserInstance
    } catch (error) {
      console.log('浏览器连接已断开，重新连接...')
      browserInstance = null
    }
  }

  try {
    await startChrome()
    
    // 新增无限重试机制
    let webSocketUrl = '';
    while (!webSocketUrl) {
      try {
        webSocketUrl = await getWebSocketUrl(5000) // 缩短超时时间到5秒
      } catch (error) {
        console.log('浏览器未就绪，5秒后重试...')
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
    }

    browserInstance = await puppeteer.connect({
      browserWSEndpoint: webSocketUrl,
      defaultViewport: null
    })
    console.log('浏览器连接成功')
  } catch (error) {
    console.error('连接浏览器失败:', error)
    throw error
  }

  return browserInstance
}

export function closeBrowser(): void {
  if (browserInstance) {
    browserInstance.disconnect()
    browserInstance = null
  }
}