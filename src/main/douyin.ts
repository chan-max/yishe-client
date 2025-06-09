/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-06-09 00:09:21
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-06-09 01:10:41
 * @FilePath: /yishe-electron/src/main/douyin.ts
 * @Description: 抖音发布功能
 */
import puppeteer from 'puppeteer-core'
import { SocialMediaUploadUrl } from './const'
import { join as pathJoin } from 'path'
import { is } from '@electron-toolkit/utils'
import { getBrowser } from './browser'

export async function publishToDouyin(): Promise<void> {
  try {
    console.log('开始执行抖音发布操作，参数:')
    
    const browser = await getBrowser()
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

    // 获取图片的绝对路径
    const imagePath = is.dev 
      ? pathJoin(__dirname, '../../resources/test.jpeg')  // 开发环境
      : pathJoin(process.resourcesPath, 'resources/test.jpeg')  // 生产环境
    
    console.log('图片路径:', imagePath)
    await fileInput.uploadFile(imagePath)
    console.log('已选择图片文件')

    // 等待图片上传完成
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000))) // 给一些时间让图片上传

    // 填写标题
    const titleSelector = 'input[placeholder*="标题"]'
    await page.waitForSelector(titleSelector)
    await page.type(titleSelector, '测试发布标题')
    console.log('已填写标题')

    // 填写正文内容
    const contentSelector = '.editor-kit-container'
    await page.waitForSelector(contentSelector)

    console.log(contentSelector)

    await page.type(contentSelector, '测试发布内容')
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