# 跨域设置说明

## 概述

本项目已经配置了完整的跨域支持，允许来自任何来源的请求访问API接口。

## 配置详情

### 1. CORS中间件配置

在 `src/main/server.ts` 中，我们使用了以下CORS配置：

```typescript
const corsOptions = {
  origin: '*', // 允许所有来源访问
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // 允许的 HTTP 方法
  allowedHeaders: ['Content-Type', 'Authorization'], // 允许的请求头
  credentials: true, // 允许发送凭证
  maxAge: 86400 // 预检请求的缓存时间（秒）
};
```

### 2. 接口级别的跨域响应头设置

为了确保长时间运行的异步接口（如 `checkSocialMediaLogin`）能正确处理跨域请求，我们在每个接口中都添加了响应头设置：

```typescript
// 在每个接口的开始处添加
res.header('Access-Control-Allow-Origin', '*');
res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
res.header('Access-Control-Allow-Credentials', 'true');
```

## 支持的接口

### 1. 健康检查接口
- **URL**: `GET /api/health`
- **描述**: 检查服务器状态
- **跨域支持**: ✅

### 2. 浏览器状态查询
- **URL**: `GET /api/browserStatus`
- **描述**: 查询Puppeteer浏览器实例状态
- **跨域支持**: ✅

### 3. 社交媒体登录状态检查 ⭐
- **URL**: `GET /api/checkSocialMediaLogin`
- **描述**: 检查各社交媒体平台的登录状态
- **跨域支持**: ✅ (已修复)
- **特殊说明**: 这是一个长时间运行的接口，需要访问多个外部网站

### 4. 发布产品接口
- **URL**: `POST /api/publishProductToSocialMedia`
- **描述**: 发布产品到社交媒体平台
- **跨域支持**: ✅

### 5. 其他接口
- `GET /api/testPuppeteer` - Puppeteer测试
- `GET /api/testXiaohongshu` - 小红书测试
- `GET /api/checkXiaohongshuLogin` - 小红书登录状态
- `GET /api/closeBrowser` - 关闭浏览器
- `GET /api/clearUserData` - 清除用户数据

## 测试方法

### 1. 使用提供的测试页面

#### 通用测试页面
运行项目后，在浏览器中打开 `test-cors.html` 文件，可以测试所有接口的跨域访问。

#### 专门测试页面
- `test-checkSocialMediaLogin.html` - 专门测试 `checkSocialMediaLogin` 接口

### 2. 使用curl命令测试

```bash
# 测试健康检查接口
curl -X GET http://localhost:1519/api/health \
  -H "Content-Type: application/json" \
  -H "Origin: http://example.com"

# 测试checkSocialMediaLogin接口（长时间运行）
curl -X GET http://localhost:1519/api/checkSocialMediaLogin \
  -H "Content-Type: application/json" \
  -H "Origin: http://example.com"

# 测试OPTIONS预检请求
curl -X OPTIONS http://localhost:1519/api/publishProductToSocialMedia \
  -H "Content-Type: application/json" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" \
  -H "Origin: http://example.com"

# 测试POST请求
curl -X POST http://localhost:1519/api/publishProductToSocialMedia \
  -H "Content-Type: application/json" \
  -H "Origin: http://example.com" \
  -d '{"platforms":[{"platform":"douyin","content":"测试内容"}],"prouctId":"test-123"}'
```

### 3. 使用JavaScript fetch API测试

```javascript
// 测试GET请求
fetch('http://localhost:1519/api/health', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));

// 测试checkSocialMediaLogin接口
fetch('http://localhost:1519/api/checkSocialMediaLogin', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));

// 测试POST请求
fetch('http://localhost:1519/api/publishProductToSocialMedia', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    platforms: [{
      platform: 'douyin',
      content: '测试内容'
    }],
    prouctId: 'test-123'
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

## 特殊问题解决

### checkSocialMediaLogin 接口跨域问题

这个接口之前存在跨域问题，原因如下：

1. **长时间运行**: 接口需要访问多个外部网站，处理时间较长
2. **异步操作**: 在异步操作中可能没有及时设置响应头
3. **外部网络请求**: 访问外部网站时可能出现网络延迟

**解决方案**:
- 在每个接口的开始处立即设置跨域响应头
- 确保在异步操作开始前就设置好响应头
- 添加了专门的测试页面 `test-checkSocialMediaLogin.html`

## 注意事项

1. **安全性**: 当前配置允许所有来源访问，在生产环境中建议限制特定的域名。

2. **凭证支持**: 配置支持发送凭证（cookies等），但需要客户端设置 `credentials: 'include'`。

3. **预检请求**: 对于复杂请求（如包含自定义头的POST请求），浏览器会自动发送OPTIONS预检请求。

4. **缓存**: 预检请求结果会被缓存86400秒（24小时）。

5. **长时间运行接口**: 对于像 `checkSocialMediaLogin` 这样的长时间运行接口，建议在客户端设置适当的超时时间。

## 故障排除

### 1. 跨域错误仍然出现

检查以下几点：
- 确保服务器正在运行在正确的端口（1519）
- 检查浏览器控制台是否有其他错误
- 确认请求URL正确
- 对于长时间运行的接口，检查是否有超时设置

### 2. checkSocialMediaLogin 接口特别慢

这是正常现象，因为该接口需要：
- 启动或复用浏览器实例
- 访问多个外部网站（小红书、抖音、微博等）
- 等待页面加载和元素检查
- 通常需要30-60秒完成

### 3. OPTIONS请求失败

- 确保OPTIONS路由正确配置
- 检查响应状态码是否为204
- 验证响应头是否正确设置

### 4. 凭证发送失败

- 确保客户端设置了 `credentials: 'include'`
- 检查 `Access-Control-Allow-Credentials` 头是否正确设置
- 注意：当使用凭证时，`Access-Control-Allow-Origin` 不能设置为 `*`

## 依赖项

确保以下依赖已正确安装：

```json
{
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^5.1.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.19"
  }
}
```

如果缺少依赖，请运行：

```bash
npm install cors express
npm install --save-dev @types/cors
``` 