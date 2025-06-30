# 热更新问题解决指南

## 问题描述
在开发过程中，修改代码后需要重启才能看到效果，热更新没有正常工作。

## 解决方案

### 1. 确保正确的开发模式启动
```bash
npm run dev
```

### 2. 检查开发工具
- 在开发模式下，开发者工具会自动打开
- 查看控制台是否有错误信息
- 检查Network标签页中的HMR连接状态

### 3. 文件监听配置
已优化以下配置：
- 启用轮询监听 (`usePolling: true`)
- 设置轮询间隔为1秒
- 指定HMR端口为5173
- 启用错误覆盖层

### 4. 常见问题排查

#### 4.1 文件系统权限问题
确保项目目录有读写权限。

#### 4.2 防火墙或杀毒软件
某些安全软件可能阻止文件监听，请检查：
- Windows Defender
- 第三方杀毒软件
- 防火墙设置

#### 4.3 磁盘空间不足
确保系统有足够的磁盘空间。

#### 4.4 Node.js版本
建议使用Node.js 16+版本。

### 5. 手动重启开发服务器
如果热更新仍然不工作，可以：
1. 停止开发服务器 (Ctrl+C)
2. 删除 `node_modules/.vite` 缓存目录
3. 重新启动 `npm run dev`

### 6. 验证热更新是否工作
1. 修改 `src/renderer/src/App.vue` 中的文字
2. 保存文件
3. 查看浏览器是否自动刷新或更新

### 7. 调试技巧
- 打开开发者工具查看控制台输出
- 检查Network标签页中的WebSocket连接
- 查看Vite开发服务器的输出信息

## 配置说明

### electron-vite.config.ts 优化
```typescript
renderer: {
  server: {
    hmr: {
      port: 5173,
      overlay: true
    },
    watch: {
      usePolling: true,
      interval: 1000
    }
  }
}
```

### 主进程开发模式配置
```typescript
if (is.dev) {
  mainWindow?.webContents.openDevTools()
}
```

## 注意事项
- 热更新主要适用于渲染进程的Vue组件
- 主进程和preload进程的修改仍需要重启
- 某些Electron API的修改可能需要重启应用 