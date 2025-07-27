# 连接管理器 (Connection Manager)

## 概述

连接管理器是一个专门处理网络连接错误和重试机制的模块，主要用于管理 Electron 应用中的 Puppeteer 浏览器连接。

## 功能特性

### 🔄 自动重试机制
- 支持指数退避算法
- 可配置最大重试次数
- 智能重试间隔

### 📊 连接状态监控
- 实时连接状态检测
- 错误信息记录
- 重试次数统计

### 🎯 事件驱动
- 连接成功/失败事件
- 状态变化通知
- 操作成功/失败回调

### ⚙️ 灵活配置
- 可自定义重试参数
- 支持动态配置更新
- 资源自动清理

## 使用方法

### 1. 基本使用

```typescript
import { connectionManager } from './connectionManager';

// 设置浏览器实例
connectionManager.setBrowser(browser);

// 检查连接状态
const isConnected = await connectionManager.checkConnection();

// 执行带重试的操作
const result = await connectionManager.executeWithRetry(
  async () => {
    // 你的操作代码
    return await someOperation();
  },
  'Operation Name'
);
```

### 2. 事件监听

```typescript
// 连接成功
connectionManager.on('connected', () => {
  console.log('✅ 连接成功');
});

// 连接错误
connectionManager.on('error', (error) => {
  console.error('❌ 连接错误:', error);
});

// 重连中
connectionManager.on('reconnecting', () => {
  console.log('🔄 正在重连...');
});

// 状态变化
connectionManager.on('statusChanged', (status) => {
  console.log('📊 状态变化:', status);
});
```

### 3. 配置选项

```typescript
// 更新配置
connectionManager.updateConfig({
  maxRetries: 5,           // 最大重试次数
  retryDelay: 2000,        // 基础重试延迟 (毫秒)
  timeout: 30000,          // 超时时间 (毫秒)
  backoffMultiplier: 1.5   // 退避倍数
});
```

## API 接口

### 健康检查接口

```http
GET /api/health
```

返回包含连接状态的健康检查信息：

```json
{
  "status": "OK",
  "timestamp": "2025-01-27T14:00:00.000Z",
  "service": "electron-server",
  "version": "1.0.0",
  "isAuthorized": true,
  "connection": {
    "isConnected": true,
    "lastError": null,
    "retryCount": 0,
    "lastAttempt": "2025-01-27T14:00:00.000Z"
  }
}
```

### 连接状态接口

```http
GET /api/connection/status
```

返回当前连接状态：

```json
{
  "isConnected": true,
  "lastError": null,
  "retryCount": 0,
  "lastAttempt": "2025-01-27T14:00:00.000Z"
}
```

### 手动重连接口

```http
POST /api/connection/reconnect
```

手动触发重新连接。

## 前端集成

### 1. 监听连接状态

```typescript
// 在 Vue 组件中
onMounted(() => {
  window.api.onConnectionStatus((status) => {
    connectionStatus.value = { ...connectionStatus.value, ...status };
  });
});
```

### 2. 获取连接状态

```typescript
const getStatus = async () => {
  try {
    const status = await window.api.getConnectionStatus();
    console.log('连接状态:', status);
  } catch (error) {
    console.error('获取状态失败:', error);
  }
};
```

### 3. 手动重连

```typescript
const reconnect = async () => {
  try {
    await window.api.reconnect();
    console.log('重连请求已发送');
  } catch (error) {
    console.error('重连失败:', error);
  }
};
```

## 错误处理

### 常见错误类型

1. **Protocol error: Connection closed**
   - 原因：网络连接中断或服务器关闭连接
   - 处理：自动重试，指数退避

2. **Browser disconnected**
   - 原因：浏览器进程异常退出
   - 处理：重新启动浏览器实例

3. **Timeout error**
   - 原因：操作超时
   - 处理：增加超时时间或重试

### 错误恢复策略

```typescript
// 自定义错误处理
connectionManager.on('operationFailed', (operationName, error) => {
  console.error(`操作失败: ${operationName}`, error);
  
  // 根据错误类型采取不同策略
  if (error.message.includes('Connection closed')) {
    // 网络错误，等待更长时间
    connectionManager.updateConfig({ retryDelay: 5000 });
  } else if (error.message.includes('Timeout')) {
    // 超时错误，增加超时时间
    connectionManager.updateConfig({ timeout: 60000 });
  }
});
```

## 最佳实践

### 1. 合理配置重试参数

```typescript
// 生产环境推荐配置
connectionManager.updateConfig({
  maxRetries: 5,
  retryDelay: 2000,
  timeout: 30000,
  backoffMultiplier: 1.5
});
```

### 2. 监控连接状态

```typescript
// 定期检查连接状态
setInterval(async () => {
  const status = connectionManager.getStatus();
  if (!status.isConnected && status.retryCount >= 3) {
    console.warn('连接异常，可能需要手动干预');
  }
}, 30000);
```

### 3. 优雅关闭

```typescript
// 应用退出时清理资源
app.on('before-quit', async () => {
  await connectionManager.cleanup();
});
```

## 故障排除

### 1. 连接频繁断开

- 检查网络稳定性
- 增加重试延迟
- 检查服务器负载

### 2. 重试次数过多

- 检查网络配置
- 验证服务器状态
- 调整重试策略

### 3. 浏览器启动失败

- 检查系统资源
- 验证 Puppeteer 配置
- 查看错误日志

## 更新日志

### v1.0.0 (2025-01-27)
- 初始版本发布
- 基础连接管理功能
- 自动重试机制
- 事件驱动架构
- 前端状态显示 