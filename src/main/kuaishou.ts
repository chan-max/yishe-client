/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-06-09 00:09:21
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-06-11 22:22:06
 * @FilePath: /yishe-electron/src/main/kuaishou.ts
 * @Description: 快手发布功能
 */
import puppeteer from 'puppeteer-core'
import { SocialMediaUploadUrl } from './const'
import { join as pathJoin } from 'path'
import { is } from '@electron-toolkit/utils'
import { getBrowser } from './browser'

export async function publishToKuaishou (publishInfo): Promise<void> {
  try {
    console.log('开始执行快手发布操作，参数:')

    const browser = await getBrowser()
    const page = await browser.newPage()
    console.log('新页面创建成功')

    await page.goto(SocialMediaUploadUrl.kuaishou_pic)
    console.log('已打开快手发布页面')

    // 等待页面完全加载
    await page.waitForSelector('#rc-tabs-0-panel-2', { timeout: 10000 })
    console.log('页面基本元素已加载')

    // 获取图片的绝对路径
    const imagePath = is.dev
      ? pathJoin(__dirname, '../../resources/test.jpeg') // 开发环境
      : pathJoin(process.resourcesPath, 'resources/test.jpeg') // 生产环境

    console.log('图片路径:', imagePath)

    // 先点击上传按钮
    const uploadButton = await page.waitForSelector('#rc-tabs-0-panel-2 button', { timeout: 5000 })
    if (!uploadButton) {
      throw new Error('未找到上传按钮')
    }
    await uploadButton.click()
    console.log('已点击上传按钮')

    // 等待文件输入框出现
    const fileInput = await page.waitForSelector('#rc-tabs-0-panel-2 input[type="file"]', { timeout: 5000 })
    if (!fileInput) {
      throw new Error('未找到文件输入框')
    }

    await fileInput.uploadFile(imagePath)
    console.log('已选择图片文件')


    // 等待图片上传完成
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000))) // 给一些时间让图片上传

        
    // 关闭系统文件选择器弹窗
    await page.keyboard.press('Escape')
    // await page.keyboard.down('Escape');

    console.log('已关闭系统文件选择器弹窗')


    // 填写标题
    const titleSelector = 'input[placeholder*="标题"]'
    await page.waitForSelector(titleSelector)
    await page.type(titleSelector, '测试快手标题')
    console.log('已填写标题')

    // 填写正文内容
    const contentSelector = '#work-description-edit'
    await page.waitForSelector(contentSelector)

    console.log(contentSelector)

    await page.type(contentSelector, '快手发布内容')
    console.log('已填写正文内容')

    // 等待内容填写完成
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 3000)))

    // 点击发布按钮
    const submitButton = await page.waitForSelector('[class^="_section-form-btns_"] div')
    if (!submitButton) {
      throw new Error('未找到发布按钮')
    }
    await submitButton.click()
    console.log('已点击发布按钮')

    // 等待发布完成
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 3000)))
  } catch (error) {
    console.error('快手发布过程出错:', error)
    throw error
  }
}
