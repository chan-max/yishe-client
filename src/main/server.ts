/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-06-09 18:31:32
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-07-19 04:14:26
 * @FilePath: /yishe-electron/src/main/server.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import express from 'express';
import cors from 'cors';  // 新增cors导入
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser } from 'puppeteer';
import { PublishService } from './publishService';
import { app, ipcMain } from 'electron';

// 使用 stealth 插件
puppeteer.use(StealthPlugin());

// 用内存变量存储 token
let token: string | null = null;

// 全局浏览器实例管理
let browserInstance: Browser | null = null;

// 获取或创建浏览器实例
export async function getOrCreateBrowser(): Promise<Browser> {
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
      '--disable-features=VizDisplayCompositor',
      '--disable-extensions-except',
      '--disable-plugins-discovery',
      '--disable-default-apps',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection',
      '--disable-hang-monitor',
      '--disable-prompt-on-repost',
      '--disable-domain-reliability',
      '--disable-component-extensions-with-background-pages',
      '--disable-background-networking',
      '--disable-sync',
      '--metrics-recording-only',
      '--no-report-upload',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection',
      '--disable-hang-monitor',
      '--disable-prompt-on-repost',
      '--disable-domain-reliability',
      '--disable-component-extensions-with-background-pages',
      '--disable-background-networking',
      '--disable-sync',
      '--metrics-recording-only',
      '--no-report-upload'
    ]
  });

  console.log('新浏览器实例启动成功，用户数据目录:', userDataDir);
  return browserInstance;
}

// 新增：为页面添加反检测脚本
export async function setupAntiDetection(page: any): Promise<void> {
  // 设置更真实的 user-agent
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  // 注入反检测脚本
  await page.evaluateOnNewDocument(() => {
    // 更彻底的 webdriver 伪装
    // 方法1: 删除原型链上的 webdriver 属性
    delete (navigator as any).__proto__.webdriver;
    
    // 方法2: 使用 Object.defineProperty 重新定义
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
      configurable: true,
      enumerable: false
    });
    
    // 方法3: 确保在 navigator 对象上也不存在
    if ('webdriver' in navigator) {
      delete (navigator as any).webdriver;
    }
    
    // 方法4: 使用 Proxy 来拦截所有访问
    const originalNavigator = navigator;
    const navigatorProxy = new Proxy(originalNavigator, {
      get: function(target, prop) {
        if (prop === 'webdriver') {
          return false;
        }
        return target[prop as keyof Navigator];
      },
      has: function(target, prop) {
        if (prop === 'webdriver') {
          return false;
        }
        return prop in target;
      }
    });
    
    // 尝试替换全局 navigator
    try {
      Object.defineProperty(window, 'navigator', {
        value: navigatorProxy,
        writable: false,
        configurable: false
      });
    } catch (e) {
      // 如果无法替换，至少确保 webdriver 返回 false
      console.log('无法替换全局 navigator，使用备用方案');
    }

    // 伪装插件
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });

    // 伪装语言
    Object.defineProperty(navigator, 'languages', {
      get: () => ['zh-CN', 'zh', 'en'],
    });

    // 伪装平台
    Object.defineProperty(navigator, 'platform', {
      get: () => 'MacIntel',
    });

    // 伪装硬件并发数
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      get: () => 8,
    });

    // 伪装设备内存
    Object.defineProperty(navigator, 'deviceMemory', {
      get: () => 8,
    });

    // 伪装连接
    Object.defineProperty(navigator, 'connection', {
      get: () => ({
        effectiveType: '4g',
        rtt: 50,
        downlink: 10,
        saveData: false,
      }),
    });

    // 伪装 Chrome 运行时
    (window as any).chrome = {
      runtime: {},
    };

    // 伪装 WebGL
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
      if (parameter === 37445) {
        return 'Intel Inc.';
      }
      if (parameter === 37446) {
        return 'Intel(R) Iris(TM) Graphics 6100';
      }
      return getParameter.call(this, parameter);
    };

    // 伪装 Canvas
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      const context = originalGetContext.call(this, type, ...args);
      if (type === '2d') {
        const originalFillText = context.fillText;
        context.fillText = function(...args) {
          return originalFillText.apply(this, args);
        };
      }
      return context;
    };

    // 伪装 AudioContext
    const originalAudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (originalAudioContext) {
      window.AudioContext = originalAudioContext;
      (window as any).webkitAudioContext = originalAudioContext;
    }

    // 伪装 MediaDevices
    if (navigator.mediaDevices) {
      const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
      navigator.mediaDevices.getUserMedia = function(constraints) {
        return Promise.reject(new Error('Not allowed'));
      };
    }

    // 伪装 Battery API
    if ('getBattery' in navigator) {
      navigator.getBattery = () => Promise.resolve({
        charging: true,
        chargingTime: Infinity,
        dischargingTime: Infinity,
        level: 1,
      });
    }

    // 伪装 Notification
    if ('Notification' in window) {
      Object.defineProperty(Notification, 'permission', {
        get: () => 'granted',
      });
    }

    // 伪装 ServiceWorker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register = () => Promise.resolve({
        scope: '',
        updateViaCache: 'all',
        scriptURL: '',
        state: 'activated',
        unregister: () => Promise.resolve(true),
        update: () => Promise.resolve(),
      } as any);
    }

    // 伪装 WebDriver
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });

    // 伪装 Automation
    Object.defineProperty(window, 'navigator', {
      writable: true,
      value: {
        ...navigator,
        webdriver: false,
      },
    });

    // 伪装 Chrome 对象
    (window as any).chrome = {
      app: {
        isInstalled: false,
        InstallState: {
          DISABLED: 'disabled',
          INSTALLED: 'installed',
          NOT_INSTALLED: 'not_installed',
        },
        RunningState: {
          CANNOT_RUN: 'cannot_run',
          READY_TO_RUN: 'ready_to_run',
          RUNNING: 'running',
        },
      },
      runtime: {
        OnInstalledReason: {
          CHROME_UPDATE: 'chrome_update',
          INSTALL: 'install',
          SHARED_MODULE_UPDATE: 'shared_module_update',
          UPDATE: 'update',
        },
        OnRestartRequiredReason: {
          APP_UPDATE: 'app_update',
          OS_UPDATE: 'os_update',
          PERIODIC: 'periodic',
        },
        PlatformArch: {
          ARM: 'arm',
          ARM64: 'arm64',
          MIPS: 'mips',
          MIPS64: 'mips64',
          X86_32: 'x86-32',
          X86_64: 'x86-64',
        },
        PlatformNaclArch: {
          ARM: 'arm',
          MIPS: 'mips',
          MIPS64: 'mips64',
          X86_32: 'x86-32',
          X86_64: 'x86-64',
        },
        PlatformOs: {
          ANDROID: 'android',
          CROS: 'cros',
          LINUX: 'linux',
          MAC: 'mac',
          OPENBSD: 'openbsd',
          WIN: 'win',
        },
        RequestUpdateCheckStatus: {
          NO_UPDATE: 'no_update',
          THROTTLED: 'throttled',
          UPDATE_AVAILABLE: 'update_available',
        },
      },
    };
  });

  // 设置视口大小
  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
  });

  // 设置额外的请求头
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  });
}

// 关闭浏览器实例
export async function closeBrowser(): Promise<void> {
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
      version: '1.0.0',
      isAuthorized: !!token
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

  // 新增 page.evaluate 测试接口
  app.get('/api/testPageEvaluate', async (req, res) => {
    let page = null;
    try {
      console.log('开始测试 page.evaluate...');
      
      const browser = await getOrCreateBrowser();
      page = await browser.newPage();
      
      // 访问一个简单的页面
      await page.goto('https://www.baidu.com', { waitUntil: 'domcontentloaded' });
      
      // 测试简单的 page.evaluate
      const simpleResult = await page.evaluate(() => {
        console.log('简单测试执行中...');
        return document.title;
      });
      
      // 测试带参数的 page.evaluate
      const paramResult = await page.evaluate((param) => {
        console.log('带参数测试执行中，参数:', param);
        return `页面标题: ${document.title}, 参数: ${param}`;
      }, 'test-param');
      
      // 测试复杂参数的 page.evaluate
      const complexParam = {
        userElements: ['.test1', '.test2'],
        loginElements: ['.login1', '.login2']
      };
      
      const complexResult = await page.evaluate((selectors) => {
        console.log('复杂参数测试执行中，选择器:', selectors);
        return {
          userElementsCount: selectors.userElements.length,
          loginElementsCount: selectors.loginElements.length,
          pageTitle: document.title
        };
      }, complexParam);
      
      res.status(200).json({
        message: 'page.evaluate 测试成功',
        results: {
          simple: simpleResult,
          param: paramResult,
          complex: complexResult
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('page.evaluate 测试失败:', error);
      res.status(500).json({
        message: 'page.evaluate 测试失败',
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      });
    } finally {
      if (page) {
        try {
          await page.close();
        } catch (closeError) {
          console.log('关闭测试页面时出错:', closeError);
        }
      }
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

  // 新增通用社交媒体登录状态检查接口
  app.post('/api/checkSocialMediaLogin', async (req, res) => {
    try {
      console.log('检查社交媒体登录状态...');
      
      // 使用 PublishService 的 checkSocialMediaLoginStatus 方法
      const loginStatus = await PublishService.checkSocialMediaLoginStatus();

      // 返回所有平台的登录状态
      res.status(200).json({
        code: 0,
        status: true,
        data: loginStatus,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('检查社交媒体登录状态失败:', error);
      res.status(500).json({
        code: 1,
        status: false,
        message: '检查社交媒体登录状态失败',
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      });
    }
  });

  // 新增发布产品到社交媒体的接口
  app.post('/api/publishProductToSocialMedia', async (req, res) => {
    try {
      var { platforms, productId } = req.body;
        
      console.log('publishProductToSocialMedia', platforms);

      const results = await PublishService.publishToMultiplePlatforms(platforms, productId);

      res.status(200).json({
        code: 0,
        status: true,
        message: '发布请求已成功处理',
        data: {
          platforms: platforms,
          results: results
        }
      });
    } catch (error) {
      console.error('发布过程出错:', error);
      res.status(500).json({
        code: 1,
        status: false,
        msg: '发布过程出错',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  });

  // 新增测试发布内容的GET接口
  app.get('/api/testPublishContent', async (req, res) => {
    try {
      console.log('收到测试发布内容请求...');
      
      // 定义默认的测试发布内容
      const testPublishContent = [
        {
          platform: 'xiaohongshu',
          title: '记录美好生活的一天',
          content: '今天分享一些生活中的小确幸，希望大家都能拥有美好心情。#生活 #分享 #美好时光',
          images: [
              'http://49.232.186.238:1521/assets/avatar-DAl8kH7V.png',
              'http://49.232.186.238:1521/assets/avatar-DAl8kH7V.png'
          ],
          tags: ['生活', '分享', '美好时光']
        },
        // {
        //   platform: 'douyin',
        //   title: '生活点滴分享',
        //   content: '记录生活中的精彩瞬间，每一天都值得被珍藏。#生活 #记录 #日常',
        //   images: [
        //     'https://picsum.photos/800/600?random=3',
        //     'https://picsum.photos/800/600?random=4'
        //   ],
        //   tags: ['生活', '记录', '日常']
        // },
        // {
        //   platform: 'kuaishou',
        //   title: '日常生活分享',
        //   content: '平凡的日子里也有属于自己的小幸福，与你们一起分享。#日常 #幸福 #分享',
        //   images: [
        //   'http://49.232.186.238:1521/assets/avatar-DAl8kH7V.png',
        //   'http://49.232.186.238:1521/assets/avatar-DAl8kH7V.png'
        //   ],
        //   tags: ['日常', '幸福', '分享']
        // },
        // {
        //   platform: 'weibo',
        //   title: '今天的心情日记',
        //   content: '有些美好值得被记录，愿你我都能感受到生活的温柔。#心情 #日记 #温柔',
        //   images: [
        //       'http://49.232.186.238:1521/assets/avatar-DAl8kH7V.png',
        //       'http://49.232.186.238:1521/assets/avatar-DAl8kH7V.png'
        //   ],
        //   tags: ['心情', '日记', '温柔']
        // },
        // {
        //   platform: 'bilibili',
        //   title: '生活随拍',
        //   content: '分享一些日常生活的片段，希望能带给你一点点快乐。#生活 #随拍 #快乐',
        //   images: [
        //     'https://picsum.photos/800/600?random=9',
        //     'https://picsum.photos/800/600?random=10'
        //   ],
        //   tags: ['生活', '随拍', '快乐']
        // }
      ];

      console.log('开始执行多平台测试发布...');
      const results = await PublishService.publishToMultiplePlatforms(testPublishContent, 'test-product-id');

      // 统计发布结果
      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;
      const failedPlatforms = results.filter(r => !r.success).map(r => r.platform);

      res.status(200).json({
        code: 0,
        status: true,
        message: `测试发布完成，成功: ${successCount}/${totalCount}`,
        data: {
          summary: {
            totalPlatforms: totalCount,
            successCount: successCount,
            failedCount: totalCount - successCount,
            failedPlatforms: failedPlatforms,
            successRate: `${((successCount / totalCount) * 100).toFixed(1)}%`
          },
          testContent: testPublishContent,
          results: results,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('测试发布内容失败:', error);
      res.status(500).json({
        code: 1,
        status: false,
        message: '测试发布内容失败',
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      });
    }
  });

  // 新增测试单个平台发布的GET接口
  app.get('/api/testSinglePlatform/:platform', async (req, res) => {
    try {
      const { platform } = req.params;
      console.log(`收到测试单个平台发布请求，平台: ${platform}`);
      
      // 验证平台是否支持
      const supportedPlatforms = ['xiaohongshu', 'douyin', 'kuaishou', 'weibo', 'bilibili'];
      if (!supportedPlatforms.includes(platform)) {
        return res.status(400).json({
          code: 1,
          status: false,
          message: `不支持的平台: ${platform}`,
          supportedPlatforms: supportedPlatforms
        });
      }

      // 定义单个平台的测试内容
      const testContent = {
        platform: platform,
        title: `测试发布 - ${platform}`,
        content: `这是一条测试发布内容，用于验证${platform}平台发布功能。\n\n#测试 #发布 #功能验证`,
        images: [
          'http://49.232.186.238:1523/logo.svg',
          'http://49.232.186.238:1523/logo.svg'
        ],
        tags: ['测试', '发布', '功能验证']
      };

      console.log(`开始执行${platform}平台测试发布...`);
      const results = await PublishService.publishToMultiplePlatforms([testContent], 'test-single-platform');

      res.status(200).json({
        code: 0,
        status: true,
        message: `${platform}平台测试发布完成`,
        data: {
          platform: platform,
          testContent: testContent,
          result: results[0],
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error(`测试${req.params.platform}平台发布失败:`, error);
      res.status(500).json({
        code: 1,
        status: false,
        message: `测试${req.params.platform}平台发布失败`,
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      });
    }
  });

  // 新增：批量打开所有社交媒体页面接口
  app.post('/api/openAllMediaPages', async (req, res) => {
    try {
      const browser = await getOrCreateBrowser();
      const urls = [
        'https://creator.xiaohongshu.com/publish/publish?target=image',
        'https://creator.douyin.com/creator-micro/content/upload',
        'https://cp.kuaishou.com/article/publish/video',
        'https://weibo.com',
        'https://member.bilibili.com/platform/upload/text/edit',
      ];
      for (const url of urls) {
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'domcontentloaded' });
      }
      res.status(200).json({
        message: '所有社交媒体页面已通过 puppeteer 打开',
        urls,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('批量打开社交媒体页面失败:', error);
      res.status(500).json({
        message: '批量打开社交媒体页面失败',
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      });
    }
  });

  // token 持久化存储
  ipcMain.handle('save-token', async (event, newToken) => {
    token = newToken;
    return true;
  });
  ipcMain.handle('get-token', async () => {
    return token;
  });
  ipcMain.handle('is-token-exist', async () => {
    return !!token;
  });

  // 新增保存 token 接口
  app.post('/api/saveToken', (req, res) => {
    const { token: newToken } = req.body;
    if (!newToken) {
      res.status(400).json({ success: false, message: 'token 不能为空' });
      return;
    }
    token = newToken;
    res.json({ success: true });
  });

  // 新增退出授权接口
  app.post('/api/logoutToken', (req, res) => {
    token = null;
    res.json({ success: true });
  });


  // 启动服务器
  app.listen(port, () => {
    console.log(`Express server started on port ${port}`);
  }).on('error', (err) => {
    console.error('Express server failed to start:', err);
  });
}



