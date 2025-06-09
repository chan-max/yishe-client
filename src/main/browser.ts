import puppeteer from 'puppeteer-core'
import { startChrome } from './chrome'

let browserInstance: puppeteer.Browser | null = null

async function waitForChromeDebugger(timeout = 10000): Promise<void> {
  const startTime = Date.now()
  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch('http://localhost:9222/json/version')
      if (response.ok) {
        return
      }
    } catch (error) {
      // 忽略错误，继续重试
    }
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  throw new Error('等待Chrome调试器超时')
}

export async function getBrowser(): Promise<puppeteer.Browser> {
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
    // 等待Chrome调试器准备就绪
    await waitForChromeDebugger()
    
    browserInstance = await puppeteer.connect({
      browserURL: 'http://localhost:9222',
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