# 小红书反检测功能说明

## 问题描述

使用 Puppeteer 自动化发布到小红书时，可能会遇到以下问题：
- 上传图片后被重定向到登录页面
- 被检测为机器人行为
- 操作被限制或阻止

## 解决方案

### 1. 使用 puppeteer-extra-plugin-stealth

我们使用了 `puppeteer-extra-plugin-stealth` 插件来增强反检测能力：

```bash
npm install puppeteer-extra puppeteer-extra-plugin-stealth
```

### 2. 自定义反检测脚本

在 `server.ts` 中实现了 `setupAntiDetection` 函数，包含以下伪装：

- **WebDriver 检测**: 删除 `navigator.webdriver` 属性
- **User-Agent**: 使用真实的 Chrome User-Agent
- **插件伪装**: 模拟浏览器插件
- **语言设置**: 设置中文语言偏好
- **平台信息**: 伪装为 MacIntel 平台
- **硬件信息**: 模拟硬件并发数和设备内存
- **网络连接**: 模拟 4G 网络连接
- **权限 API**: 伪装通知权限
- **Chrome 对象**: 模拟 Chrome 扩展 API
- **WebGL 指纹**: 伪装显卡信息
- **Canvas 指纹**: 防止 Canvas 指纹识别
- **音频上下文**: 模拟音频 API
- **媒体设备**: 处理媒体设备权限
- **电池 API**: 模拟电池信息
- **通知 API**: 模拟通知权限
- **Service Worker**: 模拟 Service Worker 支持

### 3. 浏览器启动参数优化

添加了多个启动参数来减少检测：

```typescript
args: [
  '--disable-blink-features=AutomationControlled',
  '--disable-extensions-except',
  '--disable-plugins-discovery',
  '--disable-default-apps',
  '--no-first-run',
  '--no-default-browser-check',
  // ... 更多参数
]
```

### 4. 用户行为模拟

在 `xiaohongshu.ts` 中增加了真实用户行为模拟：

- **随机延迟**: 在操作之间添加随机延迟
- **输入延迟**: 模拟真实用户的输入速度
- **鼠标悬停**: 在点击前先悬停
- **页面等待**: 等待页面完全加载

## 使用方法

### 1. 基本使用

```typescript
import { getOrCreateBrowser, setupAntiDetection } from './server'

const browser = await getOrCreateBrowser()
const page = await browser.newPage()

// 应用反检测脚本
await setupAntiDetection(page)

// 进行后续操作
await page.goto('https://creator.xiaohongshu.com/publish/publish?target=image')
```

### 2. 测试反检测效果

运行测试脚本：

```typescript
import { testAntiDetection } from './test-anti-detection'

await testAntiDetection()
```

### 3. 小红书发布

直接使用修改后的 `publishToXiaohongshu` 函数：

```typescript
import { publishToXiaohongshu } from './xiaohongshu'

const result = await publishToXiaohongshu({
  title: '测试标题',
  content: '测试内容',
  images: ['https://example.com/image.jpg']
})
```

## 注意事项

1. **登录状态**: 确保在用户数据目录中已经登录过小红书
2. **频率限制**: 避免过于频繁的操作
3. **IP 地址**: 考虑使用代理或 VPN
4. **更新维护**: 定期更新反检测脚本以应对新的检测方法

## 故障排除

### 1. 仍然被检测

- 检查是否应用了 `setupAntiDetection` 函数
- 运行测试脚本验证反检测效果
- 考虑使用真实的 Chrome 用户数据目录

### 2. 登录问题

- 手动在浏览器中登录一次
- 确保用户数据目录路径正确
- 检查登录状态是否保持

### 3. 性能问题

- 减少不必要的延迟
- 优化图片处理逻辑
- 考虑使用无头模式（headless: true）

## 更新日志

- 2025-07-18: 初始版本，实现基本的反检测功能
- 添加了 stealth 插件支持
- 实现了自定义反检测脚本
- 增加了用户行为模拟 