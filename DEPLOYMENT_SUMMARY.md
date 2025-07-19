# 部署流程总结

## 🎯 目标实现

✅ **自动更新下载链接**: 脚本会自动将 `page/index.html` 中的下载链接更新为带版本号的链接
✅ **集成到自动部署**: GitHub Actions 会在每次部署前自动运行更新脚本
✅ **版本信息通知**: 飞书通知中会包含当前版本信息
✅ **版本记录**: 自动创建版本更新日志

## 📁 新增文件

1. **`update-download-links.js`** - 主要更新脚本
2. **`UPDATE_LINKS_README.md`** - 使用说明文档
3. **`test-deploy-flow.sh`** - 测试脚本
4. **`VERSION_LOG.md`** - 版本更新记录（自动生成）

## 🔧 修改文件

1. **`package.json`** - 添加了 `update-links` 脚本命令
2. **`.github/workflows/deploy-page.yml`** - 集成自动更新流程
3. **`page/index.html`** - 下载链接会被自动更新

## 🚀 自动部署流程

### 触发条件
- 推送到 `main` 分支
- 手动触发工作流

### 执行步骤
1. **检出代码** - 获取最新代码
2. **设置环境** - 配置 Node.js 18
3. **安装依赖** - 运行 `npm ci`
4. **更新链接** - 自动运行 `npm run update-links`
5. **部署页面** - 上传到腾讯云服务器
6. **发送通知** - 飞书机器人通知

## 📋 使用方法

### 手动运行
```bash
# 方法一：使用 npm 脚本
npm run update-links

# 方法二：直接运行
node update-download-links.js

# 方法三：测试整个流程
./test-deploy-flow.sh
```

### 自动运行
推送代码到 `main` 分支即可自动触发部署流程。

## 🔗 下载链接格式

更新后的下载链接格式：
- **Windows**: `https://github.com/chan-max/yishe-client/releases/download/v{version}/yishe-client-{version}.exe`
- **macOS**: `https://github.com/chan-max/yishe-client/releases/download/v{version}/yishe-client-{version}.dmg`

## 📝 注意事项

1. **版本号管理**: 确保 `package.json` 中的版本号正确
2. **GitHub Release**: 脚本执行后需要在 GitHub 上创建对应的 release
3. **文件权限**: 确保脚本有读写相关文件的权限
4. **备份**: 建议在执行前备份重要文件

## 🎉 完成状态

- ✅ 脚本创建完成
- ✅ 自动部署集成完成
- ✅ 测试验证通过
- ✅ 文档编写完成

现在您可以：
1. 推送代码到 `main` 分支触发自动部署
2. 手动运行 `npm run update-links` 更新链接
3. 使用 `./test-deploy-flow.sh` 验证配置

部署流程已经完全自动化，无需手动干预！ 