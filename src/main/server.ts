/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-06-09 18:31:32
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-06-30 23:44:59
 * @FilePath: /yishe-electron/src/main/server.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import express from 'express';
import cors from 'cors';  // 新增cors导入
import puppeteer, { Browser } from 'puppeteer';  // 修复puppeteer导入
import { PublishService } from './publishService';

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
      '--disable-features=VizDisplayCompositor'
    ]
  });

  console.log('新浏览器实例启动成功，用户数据目录:', userDataDir);
  return browserInstance;
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
      
      const loginStatus = {
        xiaohongshu: {
          isLoggedIn: false,
          status: 'unknown',
          message: ''
        },
        douyin: {
          isLoggedIn: false,
          status: 'unknown',
          message: ''
        },
        weibo: {
          isLoggedIn: false,
          status: 'unknown',
          message: ''
        },
        kuaishou: {
          isLoggedIn: false,
          status: 'unknown',
          message: ''
        },
        bilibili: {
          isLoggedIn: false,
          status: 'unknown',
          message: ''
        }
      };

      // 获取或创建浏览器实例（只创建一次）
      const browser = await getOrCreateBrowser();
      const pages: any[] = [];

      // 定义平台检查配置
      const platformConfigs = [
        {
          name: 'xiaohongshu',
          url: 'https://creator.xiaohongshu.com/publish/publish?target=image',
          selectors: {
            userElements: ['.reds-avatar-border', '.user-avatar', '.creator-header'],
            loginElements: ['button[data-testid="login-button"]', '.login-btn', '.login-text']
          }
        },
        {
          name: 'douyin',
          url: 'https://creator.douyin.com/creator-micro/content/manage',
          selectors: {
            userElements: ['.avatar', '.user-menu', '.user-info', '.creator-header'],
            loginElements: ['.login-btn', '.login-text', '.login-button']
          }
        },
        {
          name: 'weibo',
          url: 'https://weibo.com/creator/home',
          selectors: {
            userElements: ['.avatar', '.user-menu', '.user-info', '.creator-header'],
            loginElements: ['.login-btn', '.login-text', '.login-button']
          }
        },
        {
          name: 'kuaishou',
          url: 'https://creator.kuaishou.com/creator/post',
          selectors: {
            userElements: ['.avatar', '.user-menu', '.user-info', '.creator-header'],
            loginElements: ['.login-btn', '.login-text', '.login-button']
          }
        },
        {
          name: 'bilibili',
          url: 'https://member.bilibili.com/platform/home',
          selectors: {
            userElements: ['.avatar', '.user-menu', '.user-info', '.creator-header'],
            loginElements: ['.login-btn', '.login-text', '.login-button']
          }
        }
      ];

      // 并发检查所有平台的登录状态
      const checkPromises = platformConfigs.map(async (config) => {
        let page = null;
        try {
          console.log(`检查${config.name}登录状态...`);
          
          // 在同一个浏览器中创建新标签页
          page = await browser.newPage();
          pages.push(page);
          
          // 设置页面超时
          page.setDefaultTimeout(30000);
          page.setDefaultNavigationTimeout(30000);
          
          // 访问平台首页
          console.log(`正在访问${config.name}首页...`);
          await page.goto(config.url, {
            waitUntil: 'domcontentloaded'
          });

          // 检查是否有登录相关的元素
          var isLoggedIn = await page.evaluate((selectors) => {
            // 检查是否存在登录后的用户信息元素
            const hasUserElement = selectors.userElements.some(selector => 
              document.querySelector(selector)
            );
            
            // 检查是否存在登录按钮
            const hasLoginElement = selectors.loginElements.some(selector => 
              document.querySelector(selector)
            );
            
            return hasUserElement && !hasLoginElement;
          }, config.selectors);

   

          // 更新登录状态
          loginStatus[config.name as keyof typeof loginStatus] = {
            isLoggedIn: isLoggedIn,
            status: 'success',
            message: isLoggedIn ? '已登录' : '未登录'
          };

          console.log(`${config.name}登录状态检查完成，是否已登录:`, isLoggedIn);

        } catch (error) {
          console.error(`检查${config.name}登录状态失败:`, error);
          loginStatus[config.name as keyof typeof loginStatus] = {
            isLoggedIn: false,
            status: 'error',
            message: error instanceof Error ? error.message : '检查失败'
          };
        } finally {
          // 关闭当前标签页
          if (page) {
            try {
              await page.close();
              console.log(`已关闭${config.name}检查页面`);
            } catch (closeError) {
              console.log(`关闭${config.name}检查页面时出错:`, closeError);
            }
          }
        }
      });

      // 等待所有平台检查完成
      await Promise.all(checkPromises);

      // 返回所有平台的登录状态
      res.status(200).json({
      code:0,
      status:true,
        data: loginStatus,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('检查社交媒体登录状态失败:', error);
      res.status(500).json({
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
  


  // 新增测试发布接口
  app.post('/api/testPublishToSocialMedia', async (req, res) => {
    try {
      console.log('收到测试发布请求...');
      
      const result = await PublishService.testPublish();

      res.status(200).json(result);
    } catch (error) {
      console.error('测试发布过程出错:', error);
      res.status(500).json({
        code: 1,
        status: false,
        msg: '测试发布过程出错',
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
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



// 核心逻辑抽离为独立方法
export async function checkAllSocialMediaLoginStatus() {
  const loginStatus = {
    xiaohongshu: { isLoggedIn: false, status: 'unknown', message: '' },
    douyin: { isLoggedIn: false, status: 'unknown', message: '' },
    weibo: { isLoggedIn: false, status: 'unknown', message: '' },
    kuaishou: { isLoggedIn: false, status: 'unknown', message: '' },
    bilibili: { isLoggedIn: false, status: 'unknown', message: '' }
  };
  const browser = await getOrCreateBrowser();
  const pages: any[] = [];
  const platformConfigs = [
    {
      name: 'xiaohongshu',
      url: 'https://creator.xiaohongshu.com/publish/publish?target=image',
      selectors: {
        userElements: ['.user_avatar', '.reds-avatar-border', '.user-avatar', '.creator-header'],
        loginElements: ['.login', 'button[data-testid="login-button"]', '.login-btn', '.login-text']
      }
    },
    {
      name: 'douyin',
      url: 'https://creator.douyin.com/creator-micro/content/manage',
      selectors: {
        userElements: ['.avatar', '.user-menu', '.user-info', '.creator-header'],
        loginElements: ['.login-btn', '.login-text', '.login-button']
      }
    },
    {
      name: 'weibo',
      url: 'https://weibo.com/creator/home',
      selectors: {
        userElements: ['.avatar', '.user-menu', '.user-info', '.creator-header'],
        loginElements: ['.login-btn', '.login-text', '.login-button']
      }
    },
    {
      name: 'kuaishou',
      url: 'https://creator.kuaishou.com/creator/post',
      selectors: {
        userElements: ['.avatar', '.user-menu', '.user-info', '.creator-header'],
        loginElements: ['.login-btn', '.login-text', '.login-button']
      }
    },
    {
      name: 'bilibili',
      url: 'https://member.bilibili.com/platform/home',
      selectors: {
        userElements: ['.avatar', '.user-menu', '.user-info', '.creator-header'],
        loginElements: ['.login-btn', '.login-text', '.login-button']
      }
    }
  ];
  console.log(`开始检查 ${platformConfigs.length} 个平台的登录状态...`);
  
  const checkPromises = platformConfigs.map(async (config) => {
    let page = null;
    try {
      console.log(`正在处理平台: ${config.name}`);
      page = await browser.newPage();
      pages.push(page);
      page.setDefaultTimeout(30000);
      page.setDefaultNavigationTimeout(30000);
      
      console.log(`正在访问 ${config.name} 的URL: ${config.url}`);
      
      // 添加页面加载的错误处理
      try {
        await page.goto(config.url, { 
          waitUntil: 'domcontentloaded',
          timeout: 30000 
        });
        console.log(`${config.name} 页面加载成功`);
      } catch (navigationError) {
        console.error(`${config.name} 页面加载失败:`, navigationError);
        throw navigationError;
      }

      // 等待页面完全加载
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 检查页面是否正常加载
      const pageTitle = await page.title();
      console.log(`${config.name} 页面标题:`, pageTitle);
      
      // 检查页面URL
      const currentUrl = page.url();
      console.log(`${config.name} 当前URL:`, currentUrl);
      
      console.log(`开始检查 ${config.name} 的登录状态...`);
      console.log(`传递给page.evaluate的选择器:`, JSON.stringify(config.selectors));
      
      // 先测试一个简单的 page.evaluate 调用
      try {
        console.log(`${config.name} 开始测试 page.evaluate...`);
        const testResult = await page.evaluate(() => {
          console.log('测试 page.evaluate 是否正常工作');
          return 'test-success';
        });
        console.log(`${config.name} page.evaluate 测试结果:`, testResult);
      } catch (testError) {
        console.error(`${config.name} page.evaluate 测试失败:`, testError);
        throw testError;
      }
      
      // 测试带参数的 page.evaluate 调用
      try {
        console.log(`${config.name} 开始测试带参数的 page.evaluate...`);
        const paramTestResult = await page.evaluate((param) => {
          console.log('带参数的 page.evaluate 测试，参数:', param);
          return `param-test-${param}`;
        }, 'test-param');
        console.log(`${config.name} 带参数的 page.evaluate 测试结果:`, paramTestResult);
      } catch (paramTestError) {
        console.error(`${config.name} 带参数的 page.evaluate 测试失败:`, paramTestError);
        throw paramTestError;
      }
      
      const isLoggedIn = await page.evaluate((selectors) => {
        try {
          console.log('dev - 开始检查页面元素');
          console.log('接收到的选择器参数:', selectors);
          
          // 验证参数
          if (!selectors || !selectors.userElements || !selectors.loginElements) {
            console.error('选择器参数无效:', selectors);
            return false;
          }
          
          const hasUserElement = selectors.userElements.some(selector => {
            try {
              const element = document.querySelector(selector);
              console.log(`检查用户元素选择器: ${selector}, 结果:`, !!element);
              return element;
            } catch (selectorError) {
              console.error(`检查用户元素选择器 ${selector} 时出错:`, selectorError);
              return false;
            }
          });
          
          const hasLoginElement = selectors.loginElements.some(selector => {
            try {
              const element = document.querySelector(selector);
              console.log(`检查登录元素选择器: ${selector}, 结果:`, !!element);
              return element;
            } catch (selectorError) {
              console.error(`检查登录元素选择器 ${selector} 时出错:`, selectorError);
              return false;
            }
          });

          console.log('hasUserElement', hasUserElement);
          console.log('hasLoginElement', hasLoginElement);
          console.log('dev - 检查完成');
          return hasUserElement && !hasLoginElement;
        } catch (evaluateError) {
          console.error('page.evaluate 内部执行出错:', evaluateError);
          return false;
        }
      }, config.selectors);

      console.log(`${config.name} 登录状态检查结果:`, isLoggedIn);
      loginStatus[config.name] = {
        isLoggedIn,
        status: 'success',
        message: isLoggedIn ? '已登录' : '未登录'
      };
      console.log(`${config.name} 检查完成`);
    } catch (error) {
      console.error(`${config.name} 检查失败:`, error);
      loginStatus[config.name] = {
        isLoggedIn: false,
        status: 'error',
        message: error instanceof Error ? error.message : '检查失败'
      };
    } finally {
      if (page) {
        try { 
          await page.close(); 
          console.log(`${config.name} 页面已关闭`);
        } catch (closeError) {
          console.log(`${config.name} 关闭页面时出错:`, closeError);
        }
      }
    }
  });
  
  console.log('等待所有平台检查完成...');
  await Promise.all(checkPromises);
  console.log('所有平台检查完成，返回结果');
  return loginStatus;
}