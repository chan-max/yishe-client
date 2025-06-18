/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-06-09 18:31:32
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-06-12 08:02:23
 * @FilePath: /yishe-electron/src/main/server.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import express from 'express';
import cors from 'cors';  // 新增cors导入
import { publishToXiaohongshu } from './xiaohongshu';
import { publishToDouyin } from './douyin';
import { publishToKuaishou } from './kuaishou';

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