/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-06-09 18:31:32
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-06-19 08:43:45
 * @FilePath: /yishe-electron/src/main/server.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import express from 'express';
import cors from 'cors';  // 新增cors导入
import puppeteer, { Browser } from 'puppeteer';  // 修复puppeteer导入
import { publishToXiaohongshu } from './xiaohongshu';
import { publishToDouyin } from './douyin';
import { publishToKuaishou } from './kuaishou';

// 全局浏览器实例管理
let browserInstance: Browser | null = null;

// 获取或创建浏览器实例
async function getOrCreateBrowser(): Promise<Browser> {
  if (browserInstance) {
    try {
      // 检查浏览器是否仍然连接
      const pages = await browserInstance.pages();
      console.log('浏览器已存在且连接正常，页面数量:', pages.length);
      return browserInstance;
    } catch (error) {
      console.log('浏览器连接已断开，重新启动...');
      browserInstance = null;
    }
  }

  // 创建新的浏览器实例
  console.log('启动新的浏览器实例...');
  
  // 设置用户数据目录，用于保存登录信息
  const userDataDir = process.platform === 'win32' 
    ? 'C:\\temp\\puppeteer-user-data'  // Windows
    : '/tmp/puppeteer-user-data';      // Linux/Mac
  
  browserInstance = await puppeteer.launch({
    headless: false, // 设置为false以显示浏览器窗口
    defaultViewport: null, // 使用默认视口大小
    userDataDir: userDataDir, // 保存用户数据，包括登录信息
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled', // 隐藏自动化标识
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
    ]
  });

  console.log('新浏览器实例启动成功，用户数据目录:', userDataDir);
  return browserInstance;
}

// 关闭浏览器实例
async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    try {
      await browserInstance.close();
      console.log('浏览器实例已关闭');
    } catch (error) {
      console.error('关闭浏览器时出错:', error);
    } finally {
      browserInstance = null;
    }
  }
}

export function startServer(port: number = 1519): void {
  const app = express();
  
  // 配置 CORS 选项
  const corsOptions = {
    origin: '*', // 允许所有来源访问
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // 允许的 HTTP 方法
    allowedHeaders: ['Content-Type', 'Authorization'], // 允许的请求头
    credentials: true, // 允许发送凭证
    maxAge: 86400 // 预检请求的缓存时间（秒）
  };
  
  // 基础中间件
  app.use(cors(corsOptions));  // 使用配置好的 CORS 选项
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 设置路由
  app.get('/', (req, res) => {
    res.send('Electron Express Server Running');
  });

  // 新增健康检查接口
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'electron-server',
      version: '1.0.0'
    });
  });

  // 新增puppeteer测试接口
  app.get('/api/testPuppeteer', async (req, res) => {
    try {
      console.log('收到puppeteer测试请求...');
      
      // 获取或创建浏览器实例
      const browser = await getOrCreateBrowser();

      // 创建新页面
      const page = await browser.newPage();
      
      // 访问百度
      console.log('正在访问百度...');
      await page.goto('https://www.baidu.com', {
        waitUntil: 'networkidle2' // 等待网络空闲
      });

      console.log('成功访问百度');

      // 返回成功响应
      res.status(200).json({
        message: 'puppeteer测试成功',
        status: '浏览器已打开并访问百度',
        browserConnected: true,
        pageCount: (await browser.pages()).length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('puppeteer测试失败:', error);
      res.status(500).json({
        message: 'puppeteer测试失败',
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      });
    }
  });

  // 新增小红书测试接口
  app.get('/api/testXiaohongshu', async (req, res) => {
    try {
      console.log('收到小红书测试请求...');
      
      // 获取或创建浏览器实例
      const browser = await getOrCreateBrowser();

      // 创建新页面
      const page = await browser.newPage();
      
      // 访问小红书发布页面
      console.log('正在访问小红书发布页面...');
      await page.goto('https://creator.xiaohongshu.com/publish/publish?target=image', {
        waitUntil: 'networkidle2' // 等待网络空闲
      });

      console.log('成功访问小红书发布页面');

      // 返回成功响应
      res.status(200).json({
        message: '小红书测试成功',
        status: '浏览器已打开并访问小红书发布页面',
        browserConnected: true,
        pageCount: (await browser.pages()).length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('小红书测试失败:', error);
      res.status(500).json({
        message: '小红书测试失败',
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      });
    }
  });

  // 新增检查小红书登录状态接口
  app.get('/api/checkXiaohongshuLogin', async (req, res) => {
    let page = null;
    try {
      console.log('检查小红书登录状态...');
      
      // 获取或创建浏览器实例
      const browser = await getOrCreateBrowser();

      // 创建新页面
      page = await browser.newPage();
      
      // 设置页面超时
      page.setDefaultTimeout(30000);
      page.setDefaultNavigationTimeout(30000);
      
      // 访问小红书首页
      console.log('正在访问小红书首页...');
      await page.goto('https://www.xiaohongshu.com', {
        waitUntil: 'domcontentloaded'
      });

      // 等待页面加载完成
      await page.waitForTimeout(3000);

      // 检查是否有登录相关的元素
      const isLoggedIn = await page.evaluate(() => {
        // 检查是否存在登录后的用户信息元素
        const userAvatar = document.querySelector('[data-testid="user-avatar"]');
        const loginButton = document.querySelector('button[data-testid="login-button"]');
        const userMenu = document.querySelector('[data-testid="user-menu"]');
        
        return !!(userAvatar || userMenu) && !loginButton;
      });

      console.log('登录状态检查完成，是否已登录:', isLoggedIn);

      // 返回登录状态
      res.status(200).json({
        message: '登录状态检查完成',
        isLoggedIn: isLoggedIn,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('检查登录状态失败:', error);
      
      // 清理页面资源
      if (page) {
        try {
          await page.close();
          console.log('已清理检查页面');
        } catch (closeError) {
          console.log('关闭检查页面时出错:', closeError);
        }
      }
      
      res.status(500).json({
        message: '检查登录状态失败',
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      });
    }
  });

  // 新增关闭浏览器接口
  app.get('/api/closeBrowser', async (req, res) => {
    try {
      await closeBrowser();
      res.status(200).json({
        message: '浏览器已关闭',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('关闭浏览器失败:', error);
      res.status(500).json({
        message: '关闭浏览器失败',
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      });
    }
  });

  // 新增清除用户数据接口
  app.get('/api/clearUserData', async (req, res) => {
    try {
      console.log('清除用户数据...');
      
      // 先关闭浏览器
      await closeBrowser();
      
      // 设置用户数据目录路径
      const userDataDir = process.platform === 'win32' 
        ? 'C:\\temp\\puppeteer-user-data'
        : '/tmp/puppeteer-user-data';
      
      // 导入文件系统模块
      const fs = require('fs');
      const path = require('path');
      
      // 删除用户数据目录
      if (fs.existsSync(userDataDir)) {
        fs.rmSync(userDataDir, { recursive: true, force: true });
        console.log('用户数据目录已删除:', userDataDir);
      }
      
      res.status(200).json({
        message: '用户数据已清除',
        userDataDir: userDataDir,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('清除用户数据失败:', error);
      res.status(500).json({
        message: '清除用户数据失败',
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      });
    }
  });

  // 新增浏览器状态查询接口
  app.get('/api/browserStatus', async (req, res) => {
    try {
      if (browserInstance) {
        const pages = await browserInstance.pages();
        res.status(200).json({
          connected: true,
          pageCount: pages.length,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(200).json({
          connected: false,
          pageCount: 0,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('查询浏览器状态失败:', error);
      res.status(500).json({
        connected: false,
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      });
    }
  });

  // 新增发布产品到社交媒体的接口
  app.post('/api/publishProductToSocialMedia', async (req, res) => {
    try {
      const { platforms, prouctId } = req.body;
        
      const publishTasks = platforms.map(publishInfo => {
        switch (publishInfo.platform) {
          case 'douyin':
            return publishToDouyin(publishInfo);
          // case 'xiaohongshu':
          //   return publishToXiaohongshu(publishInfo);
          // case 'kuaishou':
          //   return publishToKuaishou(publishInfo);
          // default:
          //   return Promise.reject(new Error(`不支持的平台: ${publishInfo.platform}`));
        }
      });

      await Promise.all(publishTasks);

      res.status(200).json({
        message: '发布请求已成功处理',
        platforms: platforms
      });
    } catch (error) {
      console.error('发布过程出错:', error);
      res.status(500).json({
        msg: '发布过程出错'
      });
    }
  });

  // 启动服务器
  app.listen(port, () => {
    console.log(`Express server started on port ${port}`);
  }).on('error', (err) => {
    console.error('Express server failed to start:', err);
  });
}