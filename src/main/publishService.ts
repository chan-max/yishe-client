/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-01-01 00:00:00
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-07-02 23:46:16
 * @FilePath: /yishe-electron/src/main/publishService.ts
 * @Description: 发布服务类 - 统一管理发布相关逻辑
 */
import { publishToXiaohongshu } from './xiaohongshu';
import { publishToDouyin } from './douyin';
import { publishToKuaishou } from './kuaishou';
import { publishToWeibo } from './weibo';
import { publishToBilibili } from './bilibili';
import { getOrCreateBrowser } from './server';

// 平台配置接口
export interface PlatformConfig {
  platform: string;
  title: string;
  content: string;
  images: string[];
  tags: string[];
}

// 发布结果接口
export interface PublishResult {
  platform: string;
  success: boolean;
  message: string;
  data?: {
    loginStatus?: 'logged_in' | 'not_logged_in' | 'unknown' | 'error';
    error?: string;
    publishResult?: any;
    [key: string]: any;
  };
}

// 登录状态接口
export interface LoginStatus {
  isLoggedIn: boolean;
  status: string;
  message: string;
  timestamp?: number; // 添加时间戳用于缓存控制
}

// 登录状态结果接口
export interface LoginStatusResult {
  [key: string]: LoginStatus;
}

// 缓存配置接口
interface CacheConfig {
  enabled: boolean;
  duration: number; // 缓存持续时间（毫秒）
}

// 发布服务类
export class PublishService {
  
  // 登录状态缓存
  private static loginStatusCache: LoginStatusResult | null = null;
  private static cacheTimestamp: number = 0;
  private static readonly CACHE_CONFIG: CacheConfig = {
    enabled: true,
    duration: 5 * 60 * 1000 // 5分钟缓存
  };

  /**
   * 检查缓存是否有效
   */
  private static isCacheValid(): boolean {
    if (!this.CACHE_CONFIG.enabled) {
      console.log('[缓存] 未启用');
      return false;
    }
    if (!this.loginStatusCache) {
      console.log('[缓存] 无缓存数据');
      return false;
    }
    const now = Date.now();
    const cacheAge = now - this.cacheTimestamp;
    console.log(`[缓存] 存在，age: ${cacheAge} ms, duration: ${this.CACHE_CONFIG.duration} ms`);
    return cacheAge < this.CACHE_CONFIG.duration;
  }

  /**
   * 清除登录状态缓存
   */
  static clearLoginStatusCache(): void {
    this.loginStatusCache = null;
    this.cacheTimestamp = 0;
    console.log('登录状态缓存已清除');
  }

  /**
   * 设置缓存配置
   */
  static setCacheConfig(config: Partial<CacheConfig>): void {
    Object.assign(this.CACHE_CONFIG, config);
    console.log('缓存配置已更新:', this.CACHE_CONFIG);
  }

  /**
   * 获取缓存信息
   */
  static getCacheInfo(): {
    hasCache: boolean;
    cacheAge: number;
    isValid: boolean;
    config: CacheConfig;
  } {
    const now = Date.now();
    const cacheAge = this.loginStatusCache ? now - this.cacheTimestamp : 0;
    
    return {
      hasCache: !!this.loginStatusCache,
      cacheAge,
      isValid: this.isCacheValid(),
      config: { ...this.CACHE_CONFIG }
    };
  }

  /**
   * 获取发布状态描述
   */
  static getPublishStatusDescription(result: PublishResult): string {
    if (!result.success) {
      const loginStatus = result.data?.loginStatus;
      switch (loginStatus) {
        case 'not_logged_in':
          return `${result.platform}: 未登录，请先登录该平台`;
        case 'unknown':
          return `${result.platform}: 登录状态未知，请检查网络连接`;
        case 'error':
          return `${result.platform}: 登录状态检查失败 - ${result.message}`;
        default:
          return `${result.platform}: 发布失败 - ${result.message}`;
      }
    }
    return `${result.platform}: 发布成功`;
  }

  /**
   * 安全执行异步操作并返回结果
   */
  private static async safeExecute<T>(
    operation: () => Promise<T>,
    errorMessage: string = '操作失败'
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const result = await operation();
      return { success: true, data: result };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : errorMessage;
      console.error(`${errorMessage}:`, error);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * 生成测试平台配置
   */
  static generateTestPlatforms(): PlatformConfig[] {
    return [
      {
        platform: 'xiaohongshu',
        title: '春日出游穿搭推荐',
        content: '今天和朋友一起去公园野餐，分享一下我的穿搭和美食，希望大家喜欢～',
        images: ['https://dummyimage.com/600x400'],
        tags: ['穿搭', '日常', '美好生活']
      },
      {
        platform: 'weibo',
        title: '周末咖啡时光',
        content: '周末在家自制咖啡，享受惬意时光，记录生活的美好瞬间。',
        images: ['https://dummyimage.com/600x400'],
        tags: ['咖啡', '生活', '分享']
      }
    ];
  }

  /**
   * 发布到多个平台
   */
  static async publishToMultiplePlatforms(platforms: PlatformConfig[], productId?: string): Promise<PublishResult[]> {
    const results: PublishResult[] = [];
    
    try {
      // 首先获取所有平台的登录状态（使用缓存）
      console.log('检查各平台登录状态...');
      const loginStatus = await this.checkSocialMediaLoginStatus();
      
      for (const publishInfo of platforms) {
        const platformName = publishInfo.platform;
        
        try {
          const platformLoginStatus = loginStatus[platformName];
          
          console.log(`处理平台: ${platformName}, 登录状态:`, platformLoginStatus);
          
          // 检查登录状态
          if (!platformLoginStatus) {
            console.log(`${platformName}: 未找到登录状态信息`);
            results.push({
              platform: platformName,
              success: false,
              message: '登录状态未知，无法发布',
              data: { loginStatus: 'unknown' }
            });
            continue;
          }
          
          if (platformLoginStatus.status === 'error') {
            console.log(`${platformName}: 登录状态检查失败`);
            results.push({
              platform: platformName,
              success: false,
              message: `登录状态检查失败: ${platformLoginStatus.message}`,
              data: { loginStatus: 'error', error: platformLoginStatus.message }
            });
            continue;
          }
          
          if (!platformLoginStatus.isLoggedIn) {
            console.log(`${platformName}: 未登录，跳过发布`);
            results.push({
              platform: platformName,
              success: false,
              message: '未登录，无法发布内容',
              data: { loginStatus: 'not_logged_in' }
            });
            continue;
          }
          
          // 已登录，开始发布
          console.log(`开始发布到平台: ${platformName}`);
          
          let result;
          try {
            switch (platformName) {
              case 'douyin':
                result = await publishToDouyin(publishInfo as any);
                break;
              case 'xiaohongshu':
                result = await publishToXiaohongshu(publishInfo as any);
                break;
              case 'kuaishou':
                result = await publishToKuaishou(publishInfo as any);
                break;
              case 'weibo':
                result = await publishToWeibo(publishInfo as any);
                break;
              case 'bilibili':
                result = await publishToBilibili(publishInfo as any);
                break;
              default:
                result = {
                  success: false,
                  error: `不支持的平台: ${platformName}`
                };
            }
          } catch (publishError) {
            console.error(`${platformName} 发布过程出错:`, publishError);
            result = {
              success: false,
              error: publishError instanceof Error ? publishError.message : '发布过程出错'
            };
          }
          
          const publishResult: PublishResult = {
            platform: platformName,
            success: result?.success || false,
            message: result.message || result.error || '发布完成',
            data: {
              ...result.data,
              loginStatus: 'logged_in',
              publishResult: result
            }
          };
          
          results.push(publishResult);
          console.log(`${platformName} 发布结果:`, publishResult);
          
        } catch (platformError) {
          console.error(`${platformName} 处理失败:`, platformError);
          results.push({
            platform: platformName,
            success: false,
            message: platformError instanceof Error ? platformError.message : '平台处理失败',
            data: {
              loginStatus: 'unknown',
              error: platformError instanceof Error ? platformError.message : '平台处理过程出错'
            }
          });
        }
      }
      
    } catch (overallError) {
      console.error('多平台发布整体过程出错:', overallError);
      // 如果整体过程出错，为所有平台返回错误状态
      for (const publishInfo of platforms) {
        results.push({
          platform: publishInfo.platform,
          success: false,
          message: overallError instanceof Error ? overallError.message : '发布服务异常',
          data: {
            loginStatus: 'unknown',
            error: overallError instanceof Error ? overallError.message : '发布服务整体异常'
          }
        });
      }
    }
    
    console.log('多平台发布完成，结果汇总:', results);
    return results;
  }

  /**
   * 测试发布功能
   */
  static async testPublish(): Promise<{
    code: number;
    status: boolean;
    message: string;
    data?: {
      platforms: PlatformConfig[];
      results: PublishResult[];
      timestamp: string;
      summary: {
        total: number;
        success: number;
        failed: number;
        notLoggedIn: number;
        errors: number;
      };
    };
    msg?: string;
    error?: string;
    timestamp?: string;
  }> {
    try {
      console.log('开始测试发布...');
      
      const testPlatforms = this.generateTestPlatforms();
      const results = await this.publishToMultiplePlatforms(testPlatforms, 'test-product-id');

      // 统计结果
      const summary = {
        total: results.length,
        success: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        notLoggedIn: results.filter(r => r.data?.loginStatus === 'not_logged_in').length,
        errors: results.filter(r => r.data?.loginStatus === 'error').length
      };

      return {
        code: 0,
        status: true,
        message: '测试发布请求已成功处理',
        data: {
          platforms: testPlatforms,
          results: results,
          timestamp: new Date().toISOString(),
          summary
        }
      };
    } catch (error) {
      console.error('测试发布过程出错:', error);
      
      // 即使出错也要返回结构化的错误信息
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      const testPlatforms = this.generateTestPlatforms();
      
      return {
        code: 1,
        status: false,
        message: `测试发布过程出错: ${errorMessage}`,
        msg: `测试发布过程出错: ${errorMessage}`,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        data: {
          platforms: testPlatforms,
          results: testPlatforms.map(platform => ({
            platform: platform.platform,
            success: false,
            message: `测试发布失败: ${errorMessage}`,
            data: {
              loginStatus: 'unknown',
              error: errorMessage
            }
          })),
          timestamp: new Date().toISOString(),
          summary: {
            total: testPlatforms.length,
            success: 0,
            failed: testPlatforms.length,
            notLoggedIn: 0,
            errors: testPlatforms.length
          }
        }
      };
    }
  }

  /**
   * 检查社交媒体登录状态
   */
  static async checkSocialMediaLoginStatus(forceRefresh: boolean = false): Promise<LoginStatusResult> {
    console.log('[登录状态] checkSocialMediaLoginStatus called, forceRefresh:', forceRefresh);
    let loginStatus: LoginStatusResult = {};
    try {
      // 检查缓存是否有效
      if (!forceRefresh && this.isCacheValid()) {
        console.log('[登录状态] 使用缓存的登录状态数据', this.loginStatusCache, '缓存时间戳:', this.cacheTimestamp);
        return this.loginStatusCache!;
      }
      console.log('[登录状态] 开始检查登录状态，缓存已失效或强制刷新');
      // 支持多个平台，初始化所有平台的状态
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
          url: 'https://creator.douyin.com/creator-micro/content/upload',
          selectors: {
            userElements: ['.user-info', '.header-user', '.user-avatar'],
            loginElements: ['.login-btn', '.login-button', '.login-entry']
          }
        },
        {
          name: 'kuaishou',
          url: 'https://cp.kuaishou.com/article/publish/video',
          selectors: {
            userElements: ['.user-info', '.user-avatar', '.header-user'],
            loginElements: ['.login-btn', '.login-button', '.login-entry']
          }
        },
        {
          name: 'weibo',
          url: 'https://weibo.com',
          selectors: {
            userElements: ['[class*="Ctrls_avatarItem_"]'],
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

      // 初始化所有平台的返回结构
      loginStatus = {};
      for (const config of platformConfigs) {
        loginStatus[config.name] = { 
          isLoggedIn: false, 
          status: 'unknown', 
          message: '',
          timestamp: Date.now()
        };
      }

      let browser;
      try {
        browser = await getOrCreateBrowser();
      } catch (browserError) {
        console.error('获取浏览器实例失败:', browserError);
        // 如果浏览器获取失败，为所有平台返回错误状态
        for (const config of platformConfigs) {
          loginStatus[config.name] = {
            isLoggedIn: false,
            status: 'error',
            message: browserError instanceof Error ? browserError.message : '浏览器初始化失败',
            timestamp: Date.now()
          };
        }
        // 赋值缓存
        this.loginStatusCache = loginStatus;
        this.cacheTimestamp = Date.now();
        console.log('[缓存] 浏览器获取失败已更新', this.loginStatusCache, '时间戳:', this.cacheTimestamp);
        return loginStatus;
      }

      const pages: any[] = [];

      console.log(`开始检查 ${platformConfigs.length} 个平台的登录状态...`);

      const checkPromises = platformConfigs.map(async (config) => {
        let page = null;
        try {
          console.log(`正在处理平台: ${config.name}`);
          
          try {
            page = await browser.newPage();
          } catch (pageError) {
            console.error(`${config.name} 创建页面失败:`, pageError);
            loginStatus[config.name] = {
              isLoggedIn: false,
              status: 'error',
              message: pageError instanceof Error ? pageError.message : '页面创建失败',
              timestamp: Date.now()
            };
            return;
          }
          
          pages.push(page);
          page.setDefaultTimeout(30000);
          page.setDefaultNavigationTimeout(30000);

          console.log(`正在访问 ${config.name} 的URL: ${config.url}`);

          try {
            await page.goto(config.url, {
              waitUntil: 'domcontentloaded',
              timeout: 30000
            });
            console.log(`${config.name} 页面加载成功`);
          } catch (navigationError) {
            console.error(`${config.name} 页面加载失败:`, navigationError);
            loginStatus[config.name] = {
              isLoggedIn: false,
              status: 'error',
              message: navigationError instanceof Error ? navigationError.message : '页面加载失败',
              timestamp: Date.now()
            };
            return;
          }

          await new Promise(resolve => setTimeout(resolve, 2000));

          let pageTitle, currentUrl;
          try {
            pageTitle = await page.title();
            currentUrl = page.url();
            console.log(`${config.name} 页面标题:`, pageTitle);
            console.log(`${config.name} 当前URL:`, currentUrl);
          } catch (infoError) {
            console.error(`${config.name} 获取页面信息失败:`, infoError);
            // 继续执行，不影响登录状态检查
          }

          console.log(`开始检查 ${config.name} 的登录状态...`);

          let isLoggedIn = false;
          try {
            isLoggedIn = await page.evaluate((selectors) => {
              try {
                if (!selectors || !selectors.userElements || !selectors.loginElements) {
                  return false;
                }
                const hasUserElement = selectors.userElements.some(selector => {
                  try {
                    const element = document.querySelector(selector);
                    return !!element;
                  } catch {
                    return false;
                  }
                });
                const hasLoginElement = selectors.loginElements.some(selector => {
                  try {
                    const element = document.querySelector(selector);
                    return !!element;
                  } catch {
                    return false;
                  }
                });
                return hasUserElement && !hasLoginElement;
              } catch {
                return false;
              }
            }, config.selectors);
          } catch (evaluateError) {
            console.error(`${config.name} 登录状态检查失败:`, evaluateError);
            loginStatus[config.name] = {
              isLoggedIn: false,
              status: 'error',
              message: evaluateError instanceof Error ? evaluateError.message : '登录状态检查失败',
              timestamp: Date.now()
            };
            return;
          }

          console.log(`${config.name} 登录状态检查结果:`, isLoggedIn);
          loginStatus[config.name] = {
            isLoggedIn,
            status: 'success',
            message: isLoggedIn ? '已登录' : '未登录',
            timestamp: Date.now()
          };
          console.log(`${config.name} 检查完成`);
          
        } catch (error) {
          console.error(`${config.name} 检查失败:`, error);
          loginStatus[config.name] = {
            isLoggedIn: false,
            status: 'error',
            message: error instanceof Error ? error.message : '检查失败',
            timestamp: Date.now()
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
      // 更新缓存
      this.loginStatusCache = loginStatus;
      this.cacheTimestamp = Date.now();
      console.log('[缓存] 已更新', this.loginStatusCache, '时间戳:', this.cacheTimestamp);
      return loginStatus;
    } catch (overallError) {
      console.error('登录状态检查整体过程出错:', overallError);
      // 如果整体过程出错，返回所有平台的错误状态
      const errorLoginStatus: LoginStatusResult = {};
      const platformNames = ['xiaohongshu', 'douyin', 'kuaishou', 'weibo', 'bilibili'];
      for (const platformName of platformNames) {
        errorLoginStatus[platformName] = {
          isLoggedIn: false,
          status: 'error',
          message: overallError instanceof Error ? overallError.message : '登录状态检查服务异常',
          timestamp: Date.now()
        };
      }
      // catch分支也赋值缓存
      this.loginStatusCache = errorLoginStatus;
      this.cacheTimestamp = Date.now();
      console.log('[缓存] catch分支已更新', this.loginStatusCache, '时间戳:', this.cacheTimestamp);
      return errorLoginStatus;
    }
  }
} 