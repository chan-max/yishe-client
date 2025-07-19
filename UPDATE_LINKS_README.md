# 下载链接更新脚本使用说明

## 概述

`update-download-links.js` 脚本用于自动更新客户端下载页面中的下载链接，将版本号替换为最新的版本。

## 功能

1. **自动读取版本号**: 从 `package.json` 中读取当前版本
2. **更新下载链接**: 将 `page/index.html` 中的下载链接更新为带版本号的链接
3. **更新部署配置**: 修改 GitHub Actions 部署配置中的版本信息
4. **创建版本记录**: 生成版本更新日志

## 使用方法

### 方法一：使用 npm 脚本（推荐）

```bash
npm run update-links
```

### 方法二：直接运行脚本

```bash
node update-download-links.js
```

### 方法三：使用 chmod 后直接运行

```bash
chmod +x update-download-links.js
./update-download-links.js
```

## 脚本执行流程

1. 读取 `package.json` 中的 `version` 字段
2. 更新 `page/index.html` 中的下载链接：
   - Windows: `yishe-client-{version}.exe`
   - macOS: `yishe-client-{version}.dmg`
3. 更新 `.github/workflows/deploy-page.yml` 中的版本信息
4. 创建/更新 `VERSION_LOG.md` 版本记录文件
5. 显示更新结果和下载链接

## 示例输出

```
🚀 开始更新下载链接到版本 v1.0.6...
✅ 已更新 page/index.html 中的下载链接到版本 v1.0.6
✅ 已更新 .github/workflows/deploy-page.yml 中的版本信息到 v1.0.6
✅ 已创建版本更新记录到 VERSION_LOG.md

🎉 所有文件已更新完成！
📦 当前版本: v1.0.6
📝 请确保在GitHub上创建对应的release: v1.0.6
🔗 Windows: https://github.com/chan-max/yishe-client/releases/download/v1.0.6/yishe-client-1.0.6.exe
🔗 macOS: https://github.com/chan-max/yishe-client/releases/download/v1.0.6/yishe-client-1.0.6.dmg
```

## 注意事项

1. **版本号格式**: 确保 `package.json` 中的版本号格式正确（如：1.0.6）
2. **GitHub Release**: 脚本执行后，需要在 GitHub 上创建对应的 release
3. **文件权限**: 确保脚本有读写相关文件的权限
4. **备份**: 建议在执行前备份重要文件

## 文件修改说明

### page/index.html
- 更新 Windows 和 macOS 下载链接
- 更新 `@LastEditTime` 注释

### .github/workflows/deploy-page.yml
- 在飞书通知中添加版本信息

### VERSION_LOG.md
- 创建版本更新记录文件

## 故障排除

如果遇到错误，请检查：

1. `package.json` 文件是否存在且格式正确
2. `page/index.html` 文件是否存在
3. `.github/workflows/deploy-page.yml` 文件是否存在
4. 文件读写权限是否正确

## 版本历史

- v1.0.0: 初始版本，支持基本的链接更新功能 