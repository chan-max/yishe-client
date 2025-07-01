/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-01-01 00:00:00
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-01-01 00:00:00
 * @FilePath: /yishe-electron/src/main/publishService.ts
 * @Description: 发布服务类 - 统一管理发布相关逻辑
 */
import { publishToXiaohongshu } from './xiaohongshu';
import { publishToDouyin } from './douyin';
import { publishToKuaishou } from './kuaishou';
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
  data?: any;
}

// 登录状态接口
export interface LoginStatus {
  isLoggedIn: boolean;
  status: string;
  message: string;
}

// 登录状态结果接口
export interface LoginStatusResult {
  [key: string]: LoginStatus;
}

// 发布服务类
export class PublishService {
  
  /**
   * 生成测试平台配置
   */
  static generateTestPlatforms(): PlatformConfig[] {
    return [
      {
        platform: 'xiaohongshu',
        title: '衣设测试产品',
        content: '这是一个来自衣设程序的测试发布内容，用于验证发布功能是否正常工作。',
        images: ['https://dummyimage.com/600x400'],
        tags: ['测试', '衣设', '设计工具']
      }
    ];
  }

  /**
   * 发布到多个平台
   */
  static async publishToMultiplePlatforms(platforms: PlatformConfig[], productId?: string): Promise<PublishResult[]> {
    const results: PublishResult[] = [];
    
    for (const publishInfo of platforms) {
      try {
        console.log(`开始发布到平台: ${publishInfo.platform}`);
        
        let result;
        switch (publishInfo.platform) {
          case 'douyin':
            result = await publishToDouyin(publishInfo as any);
            break;
          case 'xiaohongshu':
            result = await publishToXiaohongshu(publishInfo as any);
            break;
          case 'kuaishou':
            result = await publishToKuaishou(publishInfo as any);
            break;
          default:
            result = {
              success: false,
              error: `不支持的平台: ${publishInfo.platform}`
            };
        }
        
        results.push({
          platform: publishInfo.platform,
          success: result?.success || false,
          message: result.message || result.error || '发布完成',
          data: result.data || null
        });
        
        console.log(`${publishInfo.platform} 发布结果:`, result);
        
      } catch (error) {
        console.error(`${publishInfo.platform} 发布失败:`, error);
        results.push({
          platform: publishInfo.platform,
          success: false,
          message: error instanceof Error ? error.message : '发布失败',
          data: null
        });
      }
    }
    
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
    };
    msg?: string;
    error?: string;
    timestamp?: string;
  }> {
    try {
      console.log('开始测试发布...');
      
      const testPlatforms = this.generateTestPlatforms();
      const results = await this.publishToMultiplePlatforms(testPlatforms, 'test-product-id');

      return {
        code: 0,
        status: true,
        message: '测试发布请求已成功处理',
        data: {
          platforms: testPlatforms,
          results: results,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('测试发布过程出错:', error);
      return {
        code: 1,
        status: false,
        message: '测试发布过程出错',
        msg: '测试发布过程出错',
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 检查社交媒体登录状态
   */
  static async checkSocialMediaLoginStatus(): Promise<LoginStatusResult> {
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
      }
    ];

    // 初始化所有平台的返回结构
    const loginStatus: LoginStatusResult = {};
    for (const config of platformConfigs) {
      loginStatus[config.name] = { isLoggedIn: false, status: 'unknown', message: '' };
    }

    const browser = await getOrCreateBrowser();
    const pages: any[] = [];

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

        await new Promise(resolve => setTimeout(resolve, 2000));

        const pageTitle = await page.title();
        console.log(`${config.name} 页面标题:`, pageTitle);

        const currentUrl = page.url();
        console.log(`${config.name} 当前URL:`, currentUrl);

        console.log(`开始检查 ${config.name} 的登录状态...`);

        const isLoggedIn = await page.evaluate((selectors) => {
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
} 