/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-06-09 00:09:21
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-06-30 23:43:44
 * @FilePath: /yishe-electron/src/main/douyin.ts
 * @Description: 抖音发布功能
 */
import { SocialMediaUploadUrl } from './const'
import { join as pathJoin } from 'path'
import { getOrCreateBrowser } from './server'
import fs from 'fs'

interface PublishInfo {
  platform: string;
  name: string;
  description: string;
  images: string[];
}

export async function publishToDouyin(publishInfo: PublishInfo): Promise<void> {
  try {
    console.log('开始执行抖音发布操作，参数:', publishInfo)
    
    // 确保临时目录存在
    const tempDir = pathJoin(process.cwd(), 'temp')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
    
    const browser = await getOrCreateBrowser()
    const page = await browser.newPage()
    console.log('新页面创建成功')
    
    await page.goto(SocialMediaUploadUrl.douyin_pic)
    console.log('已打开抖音发布页面')

    // 等待文件选择器出现
    await page.waitForSelector('input[type="file"]')
    console.log('找到文件选择器')

    // 设置文件上传路径
    const fileInput = await page.$('input[type="file"]')
    if (!fileInput) {
      throw new Error('未找到文件选择器')
    }

    // 下载并上传所有图片
    for (const imageUrl of publishInfo.images) {
      try {
        // 下载图片到临时目录
        const response = await fetch(imageUrl)
        if (!response.ok) {
          throw new Error(`下载图片失败: ${response.statusText}`)
        }
        
        const buffer = await response.arrayBuffer()
        const tempPath = pathJoin(tempDir, `${Date.now()}.jpg`)
        await fs.promises.writeFile(tempPath, Buffer.from(buffer))
        
        // 上传图片
        await fileInput.uploadFile(tempPath)
        console.log('已上传图片:', imageUrl)
        
        // 等待图片上传完成
        await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000)))
        
        // 删除临时文件
        await fs.promises.unlink(tempPath).catch(err => {
          console.warn('删除临时文件失败:', err)
        })
      } catch (error) {
        console.error(`处理图片 ${imageUrl} 时出错:`, error)
        throw error
      }
    }

    // 填写标题
    const titleSelector = 'input[placeholder*="标题"]'
    await page.waitForSelector(titleSelector)
    await page.type(titleSelector, publishInfo.name)
    console.log('已填写标题')

    // 填写正文内容
    const contentSelector = '.editor-kit-container'
    await page.waitForSelector(contentSelector)
    await page.type(contentSelector, publishInfo.description)
    console.log('已填写正文内容')

    // 等待内容填写完成
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 3000)))

    // 点击发布按钮
    const submitButton = await page.waitForSelector('[class^="content-confirm-container-"] button')
    if (!submitButton) {
      throw new Error('未找到发布按钮')
    }
    await submitButton.click()
    console.log('已点击发布按钮')

    // 等待发布完成
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 3000)))
    
  } catch (error) {
    console.error('抖音发布过程出错:', error)
    throw error
  }
} 