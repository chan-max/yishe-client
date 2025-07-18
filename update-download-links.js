const fs = require('fs');
const path = require('path');

// 读取 package.json 的版本号
const pkg = require('./package.json');
const version = pkg.version;

// 目标 HTML 文件路径
const htmlPath = path.join(__dirname, 'page', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// 替换下载链接（只替换 href 中的文件名部分）
html = html.replace(
  /yishe-client(-[\d.]+)?\.exe/g,
  `yishe-client-${version}.exe`
).replace(
  /yishe-client(-[\d.]+)?\.dmg/g,
  `yishe-client-${version}.dmg`
);

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('index.html 下载链接已自动更新为最新版本号！'); 