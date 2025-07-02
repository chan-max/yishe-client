/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-06-09 00:09:21
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-07-02 08:20:20
 * @FilePath: /yishe-electron/src/main/xiaohongshu.ts
 * @Description: 小红书发布功能
 */
import { SocialMediaUploadUrl } from './const'
import { join as pathJoin } from 'path'
import { is } from '@electron-toolkit/utils'
import { getOrCreateBrowser } from './server'
import fs from 'fs'

export async function publishToXiaohongshu(publishInfo): Promise<{ success: boolean; message?: string; data?: any }> {
  try {
    console.log('开始执行小红书发布操作，参数:', publishInfo)
    const browser = await getOrCreateBrowser()
    const page = await browser.newPage()
    console.log('新页面创建成功')
    
    await page.goto(SocialMediaUploadUrl.xiaohongshu_pic)
    console.log('已打开小红书发布页面')

    // 等待文件选择器出现
    await page.waitForSelector('input[type="file"]')
    console.log('找到文件选择器')

    const fileInput = await page.$('input[type="file"]')
    if (!fileInput) {
      throw new Error('未找到文件选择器')
    }

    // 上传所有图片（如有多张）
    if (publishInfo.images && Array.isArray(publishInfo.images)) {
      for (const imageUrl of publishInfo.images) {
        try {
          // 下载图片到临时目录
          const tempDir = pathJoin(process.cwd(), 'temp')
          if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true })
          }
          const response = await fetch(imageUrl)
          if (!response.ok) {
            throw new Error(`下载图片失败: ${response.statusText}`)
          }
          const buffer = await response.arrayBuffer()
          const tempPath = pathJoin(tempDir, `${Date.now()}_xiaohongshu.jpg`)
          await fs.promises.writeFile(tempPath, Buffer.from(buffer))
          await fileInput.uploadFile(tempPath)
          console.log('已上传图片:', imageUrl)
          await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000)))
          await fs.promises.unlink(tempPath).catch(err => {
            console.warn('删除临时文件失败:', err)
          })
        } catch (error) {
          console.error(`处理图片 ${imageUrl} 时出错:`, error)
          throw error
        }
      }
    }

    // 填写标题
    const titleSelector = 'input[placeholder*="标题"]'
    await page.waitForSelector(titleSelector)
    await page.type(titleSelector, publishInfo.title || '')
    console.log('已填写标题')

    // 填写正文内容
    const contentSelector = '.ql-editor'
    await page.waitForSelector(contentSelector)
    await page.type(contentSelector, publishInfo.content || '')
    console.log('已填写正文内容')

    // 等待内容填写完成
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1000)))

    // 点击发布按钮
    const submitButton = await page.waitForSelector('.submit button')
    if (!submitButton) {
      throw new Error('未找到发布按钮')
    }
    await submitButton.click()
    console.log('已点击发布按钮')

    // 等待发布完成
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 3000)))
    
    // 发布成功，返回结果
    return { success: true, message: '发布成功' }
  } catch (error) {
    console.error('小红书发布过程出错:', error)
    return { success: false, message: error?.message || '未知错误', data: error }
  }
} 