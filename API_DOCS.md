# 衣设 Electron 客户端 API 文档

## 📋 概述

衣设 Electron 客户端内置了一个 Express 服务器，提供内部 API 接口。本文档详细说明了所有可用的接口。

## 🚀 快速开始

### 1. 安装依赖

```bash
# 运行安装脚本
chmod +x install-swagger.sh
./install-swagger.sh

# 或手动安装
npm install swagger-jsdoc swagger-ui-express
npm install --save-dev @types/swagger-jsdoc @types/swagger-ui-express
```

### 2. 启动应用

```bash
npm run dev
```

### 3. 访问 API 文档

打开浏览器访问：http://localhost:1519/api-docs

## 📊 服务信息

- **服务端口**: 1519
- **文档地址**: http://localhost:1519/api-docs
- **服务类型**: Express.js
- **文档框架**: Swagger/OpenAPI 3.0

### 🚀 启动日志

当应用启动时，你会在控制台看到以下信息：

```
🚀 启动 Express 服务器...
📡 服务端口: 1519
📚 API 文档: http://localhost:1519/api-docs
🏥 健康检查: http://localhost:1519/api/health
──────────────────────────────────────────────────
✅ Express 服务器启动成功！
──────────────────────────────────────────────────
📋 可用接口:
   GET  /api/health          - 健康检查
   GET  /api/testPuppeteer   - Puppeteer 测试
   GET  /api/testXiaohongshu - 小红书测试
   POST /api/saveToken       - 保存 Token
   POST /api/logoutToken     - 退出授权
   POST /api/openAllMediaPages - 批量打开社交媒体页面
──────────────────────────────────────────────────
```

## 🔗 接口列表

### 系统监控

#### GET /api/health
- **描述**: 健康检查接口
- **功能**: 检查服务器运行状态和授权状态
- **响应**: 返回服务器状态、时间戳、版本等信息

### 浏览器自动化

#### GET /api/testPuppeteer
- **描述**: Puppeteer 测试接口
- **功能**: 测试浏览器自动化功能，访问百度网站
- **响应**: 返回浏览器连接状态、页面数量等信息

### 社交媒体

#### GET /api/testXiaohongshu
- **描述**: 小红书测试接口
- **功能**: 测试访问小红书发布页面功能
- **响应**: 返回访问状态、浏览器信息等

## 🛠️ 开发说明

### 添加新接口

1. 在 `src/main/server.ts` 中添加路由
2. 添加 Swagger 注释
3. 在 `src/main/swagger.ts` 中添加响应模型（如需要）

### Swagger 注释格式

```javascript
/**
 * @swagger
 * /api/your-endpoint:
 *   get:
 *     summary: 接口摘要
 *     description: 详细描述
 *     tags: [标签]
 *     responses:
 *       200:
 *         description: 成功响应
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/YourResponse'
 */
```

## 📝 响应格式

所有接口都遵循统一的响应格式：

### 成功响应
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "data": {}
}
```

### 错误响应
```json
{
  "message": "错误描述",
  "error": "具体错误信息",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 🔧 配置说明

### CORS 配置
- 允许所有来源访问
- 支持 GET, POST, PUT, DELETE, OPTIONS 方法
- 允许 Content-Type, Authorization 请求头

### 安全说明
- 仅限本地访问
- 不包含敏感信息
- 主要用于开发和测试

## 📞 技术支持

如有问题，请联系开发团队。 