// 文件顶部已有该导入
import { app, shell, BrowserWindow, ipcMain, protocol } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/favicon.png?asset'
import puppeteer from 'puppeteer-core'
import { publishToXiaohongshu } from './xiaohongshu'
import { publishToDouyin } from './douyin'
import { publishToKuaishou } from './kuaishou'
import { spawn } from 'child_process'
import { homedir } from 'os'
import { join as pathJoin } from 'path'
import { startServer } from './server';

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    title:'衣设程序',
    ...(process.platform === 'linux' ? { icon } : {icon}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    // 开启开发者工具
    mainWindow.webContents.openDevTools()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

// protocol.registerSchemesAsPrivileged([{ 
//   scheme: 'yishe',
//   privileges: { 
//     bypassCSP: true,  
//     standard: true,
//     secure: true,
//     supportFetchAPI: true }
// }]);

app.setAsDefaultProtocolClient('yishe')

app.whenReady().then(() => {
  // 添加协议注册代码


  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  // 启动服务器
  startServer(1520);

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// 添加 puppeteer 处理函数
async function handleBaiduSearch(searchText: string): Promise<void> {
  try {
    console.log('开始执行百度搜索，搜索内容:', searchText)
    const browser = await puppeteer.launch({
      headless: false,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' // macOS Chrome 路径
    })
    
    console.log('浏览器启动成功')
    const page = await browser.newPage()
    console.log('新页面创建成功')
    
    await page.goto('https://www.baidu.com')
    console.log('已打开百度首页')
    
    await page.type('#kw', searchText)
    console.log('已输入搜索内容')
    
    await page.click('#su')
    console.log('已点击搜索按钮')
    
    // 不关闭浏览器，让用户可以看到结果
  } catch (error) {
    console.error('浏览器自动化过程出错:', error)
  }
}

// 添加 IPC 监听器
ipcMain.handle('start-baidu-search', async (_, searchText): Promise<void> => {
  console.log('收到搜索请求:', searchText)
  await handleBaiduSearch(searchText)
})


// 添加 IPC 监听器
ipcMain.handle('start-publish', async (_, params): Promise<void> => {
  console.log('收到发布请求，参数:', params)
  publishToXiaohongshu()
  publishToDouyin()
  publishToKuaishou()
})
