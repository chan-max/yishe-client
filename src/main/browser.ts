import puppeteer from 'puppeteer-core'
import { startChrome } from './chrome'

let browserInstance = null

async function waitForChromeDebugger(timeout = 10000): Promise<string> {
  const startTime = Date.now()
  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch('http://127.0.0.1:9222/json/version')
      if (response.ok) {
        const data = await response.json()
        return data.webSocketDebuggerUrl // 新增返回webSocketDebuggerUrl
      }
    } catch (error) {
      // 忽略错误，继续重试
    }
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  throw new Error('等待Chrome调试器超时')
}

export async function getBrowser(){
  if (browserInstance) {
    try {
      // 检查浏览器是否仍然连接
      await browserInstance.pages()
      return browserInstance
    } catch (error) {
      console.log('浏览器连接已断开，重新连接...')
      browserInstance = null
    }
  }

  try {
    // 先启动Chrome
    await startChrome()
    const webSocketUrl = await waitForChromeDebugger() // 获取webSocket地址
    
    browserInstance = await puppeteer.connect({
      browserWSEndpoint: webSocketUrl, // 修改连接方式
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