#!/bin/bash

# 测试部署流程脚本
# 用于验证更新脚本和部署配置是否正确

echo "🧪 开始测试部署流程..."

# 检查必要文件是否存在
echo "📁 检查必要文件..."
files=("package.json" "page/index.html" ".github/workflows/deploy-page.yml" "update-download-links.js")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file 存在"
    else
        echo "❌ $file 不存在"
        exit 1
    fi
done

# 检查 package.json 中的脚本
echo "📦 检查 package.json 脚本..."
if grep -q '"update-links"' package.json; then
    echo "✅ update-links 脚本已配置"
else
    echo "❌ update-links 脚本未配置"
    exit 1
fi

# 检查 GitHub Actions 配置
echo "🔧 检查 GitHub Actions 配置..."
if grep -q "Update download links" .github/workflows/deploy-page.yml; then
    echo "✅ 自动更新脚本已集成到部署流程"
else
    echo "❌ 自动更新脚本未集成到部署流程"
    exit 1
fi

# 运行更新脚本
echo "🚀 运行更新脚本..."
npm run update-links

# 检查更新结果
echo "🔍 检查更新结果..."
if grep -q "yishe-client-$(node -p "require('./package.json').version")" page/index.html; then
    echo "✅ 下载链接已更新"
else
    echo "❌ 下载链接更新失败"
    exit 1
fi

# 检查版本日志
if [ -f "VERSION_LOG.md" ]; then
    echo "✅ 版本日志已创建"
else
    echo "❌ 版本日志创建失败"
    exit 1
fi

echo ""
echo "🎉 所有测试通过！部署流程配置正确。"
echo ""
echo "📋 部署流程总结："
echo "1. 推送到 main 分支"
echo "2. GitHub Actions 自动运行"
echo "3. 安装依赖并更新下载链接"
echo "4. 部署到腾讯云服务器"
echo "5. 发送飞书通知"
echo ""
echo "💡 提示：确保在 GitHub 上创建对应的 release 版本" 