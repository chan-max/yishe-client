/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-06-09 00:09:21
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-06-09 01:31:59
 * @FilePath: /yishe-electron/src/main/kuaishou.ts
 * @Description: 快手发布功能
 */
import puppeteer from 'puppeteer-core'
import { SocialMediaUploadUrl } from './const'
import { join as pathJoin } from 'path'
import { is } from '@electron-toolkit/utils'
import { startChrome } from './chrome'

export async function publishToKuaishou(): Promise<void> {
  try {
    console.log('开始执行快手发布操作，参数:')

    const params = {
      title: 'bbbbb',
      content: 'cccccccc'
    }
    
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
    
    await page.goto(SocialMediaUploadUrl.kuaishou_pic);
    console.log('已打开快手发布页面');

    // 等待页面完全加载
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 3000)));

    // 检查是否有iframe
    const frames = page.frames();
    console.log('页面中的frames数量:', frames.length);

    // 尝试在所有frame中查找元素
    let fileInput = null;
    for (const frame of frames) {
      console.log('检查frame:', frame.url());
      fileInput = await frame.$('[tabindex="0"] input[type="file"]');
      if (fileInput) {
        console.log('在frame中找到文件选择器');
        break;
      }
    }

    // 如果在frame中没找到，尝试在主页面查找
    if (!fileInput) {
      console.log('在frame中未找到，尝试在主页面查找');
      fileInput = await page.$('[tabindex="0"] input[type="file"]');
    }

    // 如果还是没找到，尝试使用evaluate来调试
    if (!fileInput) {
      console.log('尝试使用evaluate调试DOM结构');
      const elements = await page.evaluate(() => {
        const elements = document.querySelectorAll('[tabindex="0"]');
        return Array.from(elements).map(el => ({
          tagName: el.tagName,
          className: el.className,
          id: el.id,
          children: Array.from(el.children).map(child => ({
            tagName: child.tagName,
            className: child.className
          }))
        }));
      });
      console.log('找到的tabindex="0"元素:', elements);
    }

    if (!fileInput) {
      throw new Error('未找到快手文件选择器');
    }

    // 获取图片的绝对路径
    const imagePath = is.dev 
      ? pathJoin(__dirname, '../../resources/icon.png')  // 开发环境
      : pathJoin(process.resourcesPath, 'resources/icon.png');  // 生产环境
    
    console.log('图片路径:', imagePath);
    await fileInput.uploadFile(imagePath);
    console.log('已选择图片文件');

    // 等待图片上传完成
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000))); // 给一些时间让图片上传

    // 填写标题
    const titleSelector = 'input[placeholder*="标题"]';
    await page.waitForSelector(titleSelector);
    await page.type(titleSelector, '测试快手标题');
    console.log('已填写标题');

    // 填写正文内容
    const contentSelector = '#work-description-edit';
    await page.waitForSelector(contentSelector);

    console.log(contentSelector)

    await page.type(contentSelector, '快手发布内容');
    console.log('已填写正文内容');

    // 等待内容填写完成
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 3000)));

    // 点击发布按钮
    const submitButton = await page.waitForSelector('[class^="_section-form-btns_"] div');
    if (!submitButton) {
      throw new Error('未找到发布按钮');
    }
    await submitButton.click();
    console.log('已点击发布按钮');

    // 等待发布完成
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 3000)));
    
  } catch (error) {
    console.error('快手发布过程出错:', error);
    throw error;
  }
} 