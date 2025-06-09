/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-06-09 00:09:21
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-06-09 00:51:04
 * @FilePath: /yishe-electron/src/main/xiaohongshu.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import puppeteer from 'puppeteer-core'
import { SocialMediaUploadUrl } from './const'
import { join as pathJoin } from 'path'
import { is } from '@electron-toolkit/utils'
import { startChrome } from './chrome'

export async function publishToXiaohongshu(): Promise<void> {
  try {
    console.log('开始执行小红书发布操作，参数:')



    
    // 尝试连接到Chrome浏览器
    let browser;
    try {
      browser = await puppeteer.connect({
        browserURL: 'http://localhost:9222',
        defaultViewport: null
      });
      console.log('浏览器连接成功');
    } catch (connectError) {
      console.error('连接浏览器失败，尝试启动Chrome:', connectError);
      // 如果连接失败，尝试启动Chrome
      await startChrome();
      
      // 再次尝试连接
      browser = await puppeteer.connect({
        browserURL: 'http://localhost:9222',
        defaultViewport: null
      });
      console.log('浏览器启动并连接成功');
    }
    
    const page = await browser.newPage();
    console.log('新页面创建成功');
    
    await page.goto(SocialMediaUploadUrl.xiaohongshu_pic);
    console.log('已打开小红书发布页面');

    // 等待文件选择器出现
    await page.waitForSelector('input[type="file"]');
    console.log('找到文件选择器');

    // 设置文件上传路径
    const fileInput = await page.$('input[type="file"]');
    if (!fileInput) {
      throw new Error('未找到文件选择器');
    }

    // 获取图片的绝对路径
    const imagePath = is.dev 
      ? pathJoin(__dirname, '../../resources/test.jpeg')  // 开发环境
      : pathJoin(process.resourcesPath, 'resources/test.jpeg');  // 生产环境
    
    console.log('图片路径:', imagePath);
    await fileInput.uploadFile(imagePath);
    console.log('已选择图片文件');

    // 等待图片上传完成
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000))); // 给一些时间让图片上传

    // 填写标题
    const titleSelector = 'input[placeholder*="标题"]';
    await page.waitForSelector(titleSelector);
    await page.type(titleSelector, '2131313131');
    console.log('已填写标题');

    // 填写正文内容
    const contentSelector = '.ql-editor';
    await page.waitForSelector(contentSelector);

    console.log(contentSelector)

    await page.type(contentSelector, '这是一段测试内容');
    console.log('已填写正文内容');

    // 等待内容填写完成
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1000)));

    // 点击发布按钮
    const submitButton = await page.waitForSelector('.submit button');
    if (!submitButton) {
      throw new Error('未找到发布按钮');
    }
    await submitButton.click();
    console.log('已点击发布按钮');

    // 等待发布完成
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 3000)));
    
  } catch (error) {
    console.error('小红书发布过程出错:', error);
    throw error;
  }
} 