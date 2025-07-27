#!/bin/bash

echo "正在安装 Swagger API 文档依赖..."

# 安装 Swagger 相关依赖
npm install swagger-jsdoc swagger-ui-express
npm install --save-dev @types/swagger-jsdoc @types/swagger-ui-express

echo "Swagger 依赖安装完成！"
echo ""
echo "使用方法："
echo "1. 启动 Electron 应用: npm run dev"
echo "2. 访问 API 文档: http://localhost:1519/api-docs"
echo ""
echo "API 文档包含以下接口："
echo "- GET /api/health - 健康检查"
echo "- GET /api/testPuppeteer - Puppeteer 测试"
echo "- GET /api/testXiaohongshu - 小红书测试" 