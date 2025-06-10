import express from 'express';
import cors from 'cors';  // 新增cors导入

export function startServer(port: number = 1519): void {
  const app = express();
  
  // 基础中间件
  app.use(cors());  // 启用CORS，允许所有跨域请求
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

  // 启动服务器
  app.listen(port, () => {
    console.log(`Express server started on port ${port}`);
  }).on('error', (err) => {
    console.error('Express server failed to start:', err);
  });
}