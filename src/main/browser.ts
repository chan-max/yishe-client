/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-06-10 19:05:10
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-06-28 07:28:12
 * @FilePath: /yishe-electron/src/main/browser.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import puppeteer from 'puppeteer'

let browserInstance = null

export async function getBrowser() {
  if (browserInstance) {
    try {
      // 检查浏览器连接状态
      const pages = await browserInstance.pages()
      if (pages.length >= 0) {
        return browserInstance
      }
    } catch (error) {
      console.log('浏览器连接已断开，重新启动...')
      // 确保清理旧实例
      try {
        await browserInstance.close()
      } catch (closeError) {
        console.log('关闭旧浏览器实例时出错:', closeError)
      }
      browserInstance = null
    }
  }

  // 确保 browserInstance 为 null
  browserInstance = null

  let retryCount = 0
  const maxRetries = 3

  while (retryCount < maxRetries) {
    try {
      console.log('启动 Puppeteer 浏览器...')
      
      browserInstance = await puppeteer.launch({
        headless: false, // 显示浏览器窗口，方便调试
        defaultViewport: null,
        args: [
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      })

      // 验证连接是否成功
      await browserInstance.pages()
      console.log('浏览器启动成功')
      return browserInstance
    } catch (error) {
      console.error(`启动游览器失败 (尝试 ${retryCount + 1}/${maxRetries}):`, error)
      retryCount++
      
      // 清理失败的实例
      if (browserInstance) {
        try {
          await browserInstance.close()
        } catch (closeError) {
          console.log('关闭失败的浏览器实例时出错:', closeError)
        }
        browserInstance = null
      }
      
      if (retryCount < maxRetries) {
        console.log('5秒后重试...')
        await new Promise(resolve => setTimeout(resolve, 5000))
      } else {
        throw new Error('启动游览器失败，已达到最大重试次数')
      }
    }
  }
}

// 新增：检查浏览器状态的函数
export async function checkBrowserStatus(): Promise<boolean> {
  if (!browserInstance) {
    return false
  }

  try {
    // 检查浏览器是否已关闭
    if (browserInstance.process() && browserInstance.process().killed) {
      console.log('浏览器进程已终止')
      browserInstance = null
      return false
    }

    // 尝试获取页面列表来检查浏览器是否还活着
    const pages = await browserInstance.pages()
    
    // 检查浏览器是否还连接
    if (!browserInstance.connected) {
      console.log('浏览器连接已断开')
      browserInstance = null
      return false
    }
    
    return true
  } catch (error) {
    console.log('浏览器状态检查失败:', error)
    browserInstance = null
    return false
  }
}

export function closeBrowser(): void {
  if (browserInstance) {
    browserInstance.close()
    browserInstance = null
  }
}

// 新增：强制重启浏览器
export async function forceRestartBrowser(): Promise<void> {
  console.log('强制重启浏览器...')
  
  // 关闭现有实例
  if (browserInstance) {
    try {
      await browserInstance.close()
    } catch (error) {
      console.log('关闭现有浏览器实例时出错:', error)
    }
    browserInstance = null
  }
  
  // 等待一段时间确保完全清理
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // 重新启动
  await getBrowser()
}