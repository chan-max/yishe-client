/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-06-10 19:05:10
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-06-12 07:53:10
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
      browserInstance = null
    }
  }

  try {
    // 使用puppeteer自动启动浏览器
    browserInstance = await puppeteer.launch({
      headless: false, // 显示浏览器窗口
      defaultViewport: null,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    })

    console.log('浏览器启动成功')
    return browserInstance
  } catch (error) {
    console.error('启动浏览器失败:', error)
    throw new Error('启动浏览器失败')
  }
}

export function closeBrowser(): void {
  if (browserInstance) {
    browserInstance.close()
    browserInstance = null
  }
}