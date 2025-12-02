/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-06-09 18:31:32
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-07-28 06:42:02
 * @FilePath: /yishe-electron/src/main/server.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { specs } from './swagger';  // 新增cors导入
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser } from 'puppeteer';
// 暂时注释掉发布服务相关引用，代码保留但不使用
// import { PublishService } from './publishService';
import { app, ipcMain, BrowserWindow } from 'electron';
import { connectionManager } from './connectionManager';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';

// 使用 stealth 插件
puppeteer.use(StealthPlugin());

// 用内存变量存储 token
let token: string | null = null;

// 导出保存 token 的函数和读取函数，供主进程使用
export function saveToken(newToken: string): void {
  token = newToken;
}

export function getTokenValue(): string | null {
  return token;
}

export function isTokenExist(): boolean {
  return !!token;
}

// 全局浏览器实例管理
let browserInstance: Browser | null = null;

// 获取或创建浏览器实例
export async function getOrCreateBrowser(): Promise<Browser> {
  // 检查现有浏览器实例
  if (browserInstance) {
    try {
      // 简单检查浏览器是否仍然连接
      const pages = await browserInstance.pages();
      console.log('浏览器已存在且连接正常，页面数量:', pages.length);
      
      // 设置连接管理器的浏览器实例
      connectionManager.setBrowser(browserInstance);
      return browserInstance;
      
    } catch (error) {
      console.log('浏览器连接已断开，重新启动...');
      browserInstance = null;
    }
  }

  // 如果连接管理器正在重连，等待一下
  const status = connectionManager.getStatus();
  if (status.isReconnecting) {
    console.log('等待重连完成...');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // 创建新的浏览器实例
  console.log('启动新的浏览器实例...');
  
  try {
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
    
    // 设置连接管理器的浏览器实例
    connectionManager.setBrowser(browserInstance);
    
    return browserInstance;
    
  } catch (error) {
    console.error('❌ 浏览器启动失败:', error);
    throw error;
  }
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
  try {
    // 使用连接管理器清理资源
    await connectionManager.cleanup();
    
    if (browserInstance) {
      try {
        await browserInstance.close();
        console.log('浏览器实例已关闭');
      } catch (error) {
        console.error('关闭浏览器实例时出错:', error);
      } finally {
        browserInstance = null;
      }
    }
  } catch (error) {
    console.error('清理连接管理器时出错:', error);
  }
}

let serverInstance: any = null;
let stopServerFn: (() => Promise<void>) | null = null;
let currentPort: number = 1519;
let ioServer: SocketIOServer | null = null;
let extensionConnections = new Map<string, { socketId: string; connectedAt: string }>();

export function startServer(port: number = 1519): (() => Promise<void>) {
  currentPort = port;
  // 如果服务器已经在运行，先停止它
  if (stopServerFn) {
    console.log('⚠️ 服务器已在运行，先停止旧实例');
    return stopServerFn().then(() => {
      console.log('✅ 旧服务器实例已停止');
      const stopFn = _startServer(port);
      stopServerFn = stopFn;
      return stopFn;
    }) as any;
  }

  const stopFn = _startServer(port);
  stopServerFn = stopFn;
  return stopFn;
}

export function stopServer(): Promise<void> {
  if (stopServerFn) {
    const fn = stopServerFn;
    stopServerFn = null;
    return fn();
  }
  return Promise.resolve();
}

export function isServerRunning(): boolean {
  return stopServerFn !== null;
}

export function getExtensionConnections() {
  return Array.from(extensionConnections.entries()).map(([clientId, info]) => ({
    clientId,
    ...info
  }));
}

function _startServer(port: number = 1519): (() => Promise<void>) {
  const app = express();
  
  console.log('🚀 启动 Express 服务器...');
  console.log(`📡 服务端口: ${port}`);
  console.log(`📚 API 文档: http://localhost:${port}/api-docs`);
  console.log(`🏥 健康检查: http://localhost:${port}/api/health`);
  console.log('─'.repeat(50));
  
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

  // Swagger API 文档路由
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: '衣设 Electron API 文档'
  }));

  /**
   * @swagger
   * /api/health:
   *   get:
   *     summary: 健康检查接口
   *     description: 检查服务器运行状态和授权状态
   *     tags: [系统监控]
   *     responses:
   *       200:
   *         description: 服务器运行正常
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/HealthResponse'
   *       500:
   *         description: 服务器错误
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.get('/api/health', (req, res) => {
    const connectionStatus = connectionManager.getStatus();
    
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'electron-server',
      version: '1.0.0',
      isAuthorized: !!token,
      connection: {
        isConnected: connectionStatus.isConnected,
        lastError: connectionStatus.lastError,
        retryCount: connectionStatus.retryCount,
        lastAttempt: connectionStatus.lastAttempt?.toISOString()
      }
    });
  });

  /**
   * @swagger
   * /api/connection/status:
   *   get:
   *     summary: 获取连接状态
   *     description: 获取浏览器连接状态和错误信息
   *     tags: [连接管理]
   *     responses:
   *       200:
   *         description: 连接状态信息
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 isConnected:
   *                   type: boolean
   *                 lastError:
   *                   type: string
   *                 retryCount:
   *                   type: number
   *                 lastAttempt:
   *                   type: string
   *       500:
   *         description: 服务器错误
   */
  app.get('/api/connection/status', (req, res) => {
    const status = connectionManager.getStatus();
    res.status(200).json(status);
  });

  /**
   * @swagger
   * /api/connection/reconnect:
   *   post:
   *     summary: 手动重连
   *     description: 手动触发重新连接
   *     tags: [连接管理]
   *     responses:
   *       200:
   *         description: 重连成功
   *       500:
   *         description: 重连失败
   */
  app.post('/api/connection/reconnect', async (req, res) => {
    try {
      const success = await connectionManager.reconnect();
      if (success) {
        res.status(200).json({ message: '重连请求已发送' });
      } else {
        res.status(500).json({ error: '重连失败' });
      }
    } catch (error) {
      res.status(500).json({ error: '重连过程中发生错误' });
    }
  });

  /**
   * @swagger
   * /api/testPuppeteer:
   *   get:
   *     summary: Puppeteer 测试接口
   *     description: 测试 Puppeteer 浏览器自动化功能，访问百度网站
   *     tags: [浏览器自动化]
   *     responses:
   *       200:
   *         description: Puppeteer 测试成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PuppeteerTestResponse'
   *       500:
   *         description: Puppeteer 测试失败
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
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

  /**
   * @swagger
   * /api/testXiaohongshu:
   *   get:
   *     summary: 小红书测试接口
   *     description: 测试访问小红书发布页面功能
   *     tags: [社交媒体]
   *     responses:
   *       200:
   *         description: 小红书测试成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/XiaohongshuTestResponse'
   *       500:
   *         description: 小红书测试失败
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
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

  /**
   * @swagger
   * /api/checkXiaohongshuLogin:
   *   get:
   *     summary: 检查小红书登录状态
   *     description: 检查用户是否已登录小红书平台
   *     tags: [社交媒体]
   *     responses:
   *       200:
   *         description: 登录状态检查完成
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: '登录状态检查完成'
   *                 isLoggedIn:
   *                   type: boolean
   *                   example: true
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *       500:
   *         description: 检查失败
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
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



  /**
   * @swagger
   * /api/closeBrowser:
   *   get:
   *     summary: 关闭浏览器
   *     description: 关闭当前运行的浏览器实例
   *     tags: [浏览器管理]
   *     responses:
   *       200:
   *         description: 浏览器已关闭
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: '浏览器已关闭'
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *       500:
   *         description: 关闭失败
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
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

  /**
   * @swagger
   * /api/clearUserData:
   *   get:
   *     summary: 清除用户数据
   *     description: 清除浏览器用户数据目录，包括登录信息等
   *     tags: [浏览器管理]
   *     responses:
   *       200:
   *         description: 用户数据已清除
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: '用户数据已清除'
   *                 userDataDir:
   *                   type: string
   *                   example: '/tmp/puppeteer-user-data'
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *       500:
   *         description: 清除失败
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
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

  /**
   * @swagger
   * /api/testPageEvaluate:
   *   get:
   *     summary: 测试 page.evaluate 功能
   *     description: 测试 Puppeteer 的 page.evaluate 方法，包括简单测试、带参数测试和复杂参数测试
   *     tags: [浏览器自动化]
   *     responses:
   *       200:
   *         description: 测试成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: 'page.evaluate 测试成功'
   *                 results:
   *                   type: object
   *                   properties:
   *                     simple:
   *                       type: string
   *                       example: '百度一下，你就知道'
   *                     param:
   *                       type: string
   *                       example: '页面标题: 百度一下，你就知道, 参数: test-param'
   *                     complex:
   *                       type: object
   *                       properties:
   *                         userElementsCount:
   *                           type: number
   *                           example: 2
   *                         loginElementsCount:
   *                           type: number
   *                           example: 2
   *                         pageTitle:
   *                           type: string
   *                           example: '百度一下，你就知道'
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *       500:
   *         description: 测试失败
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
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

  /**
   * @swagger
   * /api/browserStatus:
   *   get:
   *     summary: 查询浏览器状态
   *     description: 查询当前浏览器实例的连接状态和页面数量
   *     tags: [浏览器管理]
   *     responses:
   *       200:
   *         description: 查询成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 connected:
   *                   type: boolean
   *                   example: true
   *                 pageCount:
   *                   type: number
   *                   example: 3
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *       500:
   *         description: 查询失败
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 connected:
   *                   type: boolean
   *                   example: false
   *                 error:
   *                   type: string
   *                   example: '查询失败'
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   */
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

  /**
   * @swagger
   * /api/checkSocialMediaLogin:
   *   post:
   *     summary: 检查社交媒体登录状态
   *     description: 检查所有支持的社交媒体平台的登录状态
   *     tags: [社交媒体]
   *     responses:
   *       200:
   *         description: 检查完成
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: number
   *                   example: 0
   *                 status:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   description: 各平台登录状态
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *       500:
   *         description: 检查失败
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: number
   *                   example: 1
   *                 status:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: '检查社交媒体登录状态失败'
   *                 error:
   *                   type: string
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   */
  app.post('/api/checkSocialMediaLogin', async (req, res) => {
    try {
      console.log('检查社交媒体登录状态...');
      
      // 暂时注释掉发布服务相关功能
      // 使用 PublishService 的 checkSocialMediaLoginStatus 方法
      // const loginStatus = await PublishService.checkSocialMediaLoginStatus();
      const loginStatus = {}; // 临时返回空对象

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

  /**
   * @swagger
   * /api/publishProductToSocialMedia:
   *   post:
   *     summary: 发布产品到社交媒体
   *     description: 将产品内容发布到指定的社交媒体平台
   *     tags: [内容发布]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - platforms
   *               - productId
   *             properties:
   *               platforms:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     platform:
   *                       type: string
   *                       example: 'xiaohongshu'
   *                     title:
   *                       type: string
   *                       example: '产品标题'
   *                     content:
   *                       type: string
   *                       example: '产品描述内容'
   *                     images:
   *                       type: array
   *                       items:
   *                         type: string
   *                       example: ['http://example.com/image1.jpg']
   *                     tags:
   *                       type: array
   *                       items:
   *                         type: string
   *                       example: ['标签1', '标签2']
   *               productId:
   *                 type: string
   *                 example: 'product-123'
   *     responses:
   *       200:
   *         description: 发布成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: number
   *                   example: 0
   *                 status:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: '发布请求已成功处理'
   *                 data:
   *                   type: object
   *                   properties:
   *                     platforms:
   *                       type: array
   *                     results:
   *                       type: array
   *       500:
   *         description: 发布失败
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: number
   *                   example: 1
   *                 status:
   *                   type: boolean
   *                   example: false
   *                 msg:
   *                   type: string
   *                   example: '发布过程出错'
   *                 error:
   *                   type: string
   */
  app.post('/api/publishProductToSocialMedia', async (req, res) => {
    try {
      var { platforms, productId } = req.body;
        
      console.log('publishProductToSocialMedia', platforms);

      // 暂时注释掉发布服务相关功能
      // const results = await PublishService.publishToMultiplePlatforms(platforms, productId);
      const results = []; // 临时返回空数组

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

  /**
   * @swagger
   * /api/testPublishContent:
   *   get:
   *     summary: 测试发布内容
   *     description: 使用预设的测试内容进行多平台发布测试
   *     tags: [内容发布]
   *     responses:
   *       200:
   *         description: 测试发布完成
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: number
   *                   example: 0
   *                 status:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: '测试发布完成，成功: 3/5'
   *                 data:
   *                   type: object
   *                   properties:
   *                     summary:
   *                       type: object
   *                       properties:
   *                         totalPlatforms:
   *                           type: number
   *                           example: 5
   *                         successCount:
   *                           type: number
   *                           example: 3
   *                         failedCount:
   *                           type: number
   *                           example: 2
   *                         failedPlatforms:
   *                           type: array
   *                           items:
   *                             type: string
   *                           example: ['douyin', 'kuaishou']
   *                         successRate:
   *                           type: string
   *                           example: '60.0%'
   *                     testContent:
   *                       type: array
   *                       description: 测试内容列表
   *                     results:
   *                       type: array
   *                       description: 发布结果列表
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       500:
   *         description: 测试失败
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: number
   *                   example: 1
   *                 status:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: '测试发布内容失败'
   *                 error:
   *                   type: string
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   */
  app.get('/api/testPublishContent', async (req, res) => {
    try {
      console.log('收到测试发布内容请求...');
      
      // 定义默认的测试发布内容
      const testPublishContent = [
        // {
        //   platform: 'xiaohongshu',
        //   title: '记录美好生活的一天',
        //   content: '今天分享一些生活中的小确幸，希望大家都能拥有美好心情。#生活 #分享 #美好时光',
        //   images: [
        //       'http://49.232.186.238:1521/assets/avatar-DAl8kH7V.png',
        //       'http://49.232.186.238:1521/assets/avatar-DAl8kH7V.png'
        //   ],
        //   tags: ['生活', '分享', '美好时光']
        // },
        {
          platform: 'douyin',
          title: '生活点滴分享',
          content: '记录生活中的精彩瞬间，每一天都值得被珍藏。#生活 #记录 #日常',
          images: [
            'https://picsum.photos/800/600?random=3',
            'https://picsum.photos/800/600?random=4'
          ],
          tags: ['生活', '记录', '日常']
        },
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
      // 暂时注释掉发布服务相关功能
      // const results = await PublishService.publishToMultiplePlatforms(testPublishContent, 'test-product-id');
      const results = []; // 临时返回空数组

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

  /**
   * @swagger
   * /api/testSinglePlatform/{platform}:
   *   get:
   *     summary: 测试单个平台发布
   *     description: 测试指定平台的发布功能
   *     tags: [内容发布]
   *     parameters:
   *       - in: path
   *         name: platform
   *         required: true
   *         schema:
   *           type: string
   *         description: 平台名称
   *         example: xiaohongshu
   *     responses:
   *       200:
   *         description: 测试完成
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: number
   *                   example: 0
   *                 status:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: 'xiaohongshu平台测试发布完成'
   *                 data:
   *                   type: object
   *                   properties:
   *                     platform:
   *                       type: string
   *                       example: 'xiaohongshu'
   *                     testContent:
   *                       type: object
   *                       description: 测试内容
   *                     result:
   *                       type: object
   *                       description: 发布结果
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       400:
   *         description: 不支持的平台
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: number
   *                   example: 1
   *                 status:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: '不支持的平台: invalid-platform'
   *                 supportedPlatforms:
   *                   type: array
   *                   items:
   *                     type: string
   *                   example: ['xiaohongshu', 'douyin', 'kuaishou', 'weibo', 'bilibili']
   *       500:
   *         description: 测试失败
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: number
   *                   example: 1
   *                 status:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: '测试xiaohongshu平台发布失败'
   *                 error:
   *                   type: string
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   */
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
      // 暂时注释掉发布服务相关功能
      // const results = await PublishService.publishToMultiplePlatforms([testContent], 'test-single-platform');
      const results = []; // 临时返回空数组

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

  /**
   * @swagger
   * /api/openAllMediaPages:
   *   post:
   *     summary: 批量打开社交媒体页面
   *     description: 批量打开所有支持的社交媒体平台的发布页面
   *     tags: [社交媒体]
   *     responses:
   *       200:
   *         description: 页面打开成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: '所有社交媒体页面已通过 puppeteer 打开'
   *                 urls:
   *                   type: array
   *                   items:
   *                     type: string
   *                   example: [
   *                     'https://creator.xiaohongshu.com/publish/publish?target=image',
   *                     'https://creator.douyin.com/creator-micro/content/upload',
   *                     'https://cp.kuaishou.com/article/publish/video',
   *                     'https://weibo.com',
   *                     'https://member.bilibili.com/platform/upload/text/edit'
   *                   ]
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *       500:
   *         description: 打开失败
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: '批量打开社交媒体页面失败'
   *                 error:
   *                   type: string
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   */
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

  /**
   * @swagger
   * /api/saveToken:
   *   post:
   *     summary: 保存 Token
   *     description: 保存用户认证 Token
   *     tags: [认证管理]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - token
   *             properties:
   *               token:
   *                 type: string
   *                 description: 用户认证 Token
   *                 example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
   *     responses:
   *       200:
   *         description: Token 保存成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *       400:
   *         description: Token 为空
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: 'token 不能为空'
   */
  app.post('/api/saveToken', (req, res) => {
    const { token: newToken } = req.body;
    if (!newToken) {
      res.status(400).json({ success: false, message: 'token 不能为空' });
      return;
    }
    token = newToken;
    res.json({ success: true });
  });

  /**
   * @swagger
   * /api/logoutToken:
   *   post:
   *     summary: 退出授权
   *     description: 清除当前保存的 Token
   *     tags: [认证管理]
   *     responses:
   *       200:
   *         description: 退出成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   */
  app.post('/api/logoutToken', async (req, res) => {
    token = null;
    // 登出时停止服务
    if (stopServerFn) {
      console.log('🔐 检测到 token 清除，停止 1519 服务...');
      await stopServer();
    }
    res.json({ success: true });
  });


  // 创建 HTTP 服务器并附加 Express 应用
  const httpServer = createServer(app);
  
  // 创建 Socket.IO 服务器
  ioServer = new SocketIOServer(httpServer, {
    path: '/ws',
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
  });

  // Socket.IO 连接管理
  ioServer.on('connection', (socket) => {
    const clientId = socket.handshake.query.clientId as string || socket.id;
    const clientSource = socket.handshake.query.clientSource as string || 'unknown';
    
    console.log(`[WS] 插件连接: ${clientId} (${clientSource})`);
    
    extensionConnections.set(clientId, {
      socketId: socket.id,
      connectedAt: new Date().toISOString()
    });

    // 通知主窗口插件连接状态
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send('extension-connection-status', {
        connected: true,
        clientId,
        clientSource,
        connectedAt: extensionConnections.get(clientId)?.connectedAt,
        totalConnections: extensionConnections.size
      });
    }

    // 处理 ping
    socket.on('ping', () => {
      socket.emit('pong', {
        timestamp: new Date().toISOString(),
        message: 'pong'
      });
    });

    // 处理客户端信息
    socket.on('client-info', (data) => {
      console.log(`[WS] 收到客户端信息: ${clientId}`, data);
    });

    // 处理断开连接
    socket.on('disconnect', (reason) => {
      console.log(`[WS] 插件断开: ${clientId}, 原因: ${reason}`);
      extensionConnections.delete(clientId);
      
      // 通知主窗口插件断开
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.webContents.send('extension-connection-status', {
          connected: false,
          clientId,
          disconnectedAt: new Date().toISOString(),
          reason,
          totalConnections: extensionConnections.size
        });
      }
    });

    // 处理错误
    socket.on('error', (error) => {
      console.error(`[WS] Socket 错误: ${clientId}`, error);
    });
  });

  // 启动 HTTP 服务器（绑定到 0.0.0.0 以允许所有网络接口访问）
  httpServer.listen(port, '0.0.0.0', () => {
    console.log('✅ Express 服务器启动成功！');
    console.log('✅ Socket.IO 服务器启动成功！');
    console.log(`📡 WebSocket 端点: ws://localhost:${port}/ws`);
    console.log('─'.repeat(50));
    console.log('📋 可用接口:');
    console.log('🔧 系统监控:');
    console.log(`   GET  /api/health                    - 健康检查`);
    console.log('🤖 浏览器自动化:');
    console.log(`   GET  /api/testPuppeteer             - Puppeteer 测试`);
    console.log(`   GET  /api/testPageEvaluate          - page.evaluate 测试`);
    console.log('📱 社交媒体:');
    console.log(`   GET  /api/testXiaohongshu           - 小红书测试`);
    console.log(`   GET  /api/checkXiaohongshuLogin     - 检查小红书登录状态`);
    console.log(`   POST /api/checkSocialMediaLogin      - 检查社交媒体登录状态`);
    console.log(`   POST /api/openAllMediaPages         - 批量打开社交媒体页面`);
    console.log('📤 内容发布:');
    console.log(`   GET  /api/testPublishContent        - 测试发布内容`);
    console.log(`   GET  /api/testSinglePlatform/{platform} - 测试单个平台发布`);
    console.log(`   POST /api/publishProductToSocialMedia - 发布产品到社交媒体`);
    console.log('🔧 浏览器管理:');
    console.log(`   GET  /api/browserStatus             - 查询浏览器状态`);
    console.log(`   GET  /api/closeBrowser              - 关闭浏览器`);
    console.log(`   GET  /api/clearUserData             - 清除用户数据`);
    console.log('🔐 认证管理:');
    console.log(`   POST /api/saveToken                 - 保存 Token`);
    console.log(`   POST /api/logoutToken               - 退出授权`);
    console.log('📚 API 文档:');
    console.log(`   GET  /api-docs                      - Swagger API 文档`);
    console.log('─'.repeat(50));
  }).on('error', (err) => {
    console.error('❌ HTTP 服务器启动失败:', err);
  });

  // 添加获取插件连接状态的 API
  app.get('/api/extension/connections', (req, res) => {
    const connections = Array.from(extensionConnections.entries()).map(([clientId, info]) => ({
      clientId,
      ...info
    }));
    res.json({
      total: extensionConnections.size,
      connections
    });
  });

  // 返回停止服务器的函数
  return () => {
    return new Promise<void>((resolve) => {
      // 关闭所有 Socket.IO 连接
      if (ioServer) {
        ioServer.close(() => {
          console.log('✅ Socket.IO 服务器已停止');
        });
        ioServer = null;
      }
      
      // 清空连接记录
      extensionConnections.clear();
      
      // 关闭 HTTP 服务器
      if (httpServer) {
        httpServer.close(() => {
          console.log('✅ Express 服务器已停止');
          resolve();
        });
      } else {
        resolve();
      }
    });
  };
}



