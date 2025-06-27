// 文件顶部已有该导入
import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/favicon.png?asset'
import { startServer } from './server';
import { getBrowser, checkBrowserStatus, forceRestartBrowser } from './browser'

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
    // mainWindow.webContents.openDevTools()
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
  startServer(1519);

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


// 添加 IPC 监听器
ipcMain.handle('start-publish', async (_, params): Promise<void> => {
  console.log('收到发布请求，参数:', params)
  try {
    // 并行执行发布操作
    await Promise.all([
      // publishToXiaohongshu(),
      // publishToDouyin(),
      // publishToKuaishou()
    ])
  } catch (error) {
    console.error('发布过程出错:', error)
    throw error
  }
})

// 添加调试工具切换事件处理
ipcMain.on('toggle-devtools', (event) => {
  console.log('toggle')
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) {
    if (win.webContents.isDevToolsOpened()) {
      win.webContents.closeDevTools()
    } else {
      win.webContents.openDevTools()
    }
  }
})

// 添加启动游览器的 IPC 处理函数
ipcMain.handle('start-browser', async (): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('收到启动浏览器请求...')
    
    // 启动浏览器
    await getBrowser()
    
    console.log('浏览器启动成功')
    return { 
      success: true, 
      message: '浏览器启动成功！' 
    }
  } catch (error) {
    console.error('启动游览器失败:', error)
    return { 
      success: false, 
      message: `启动游览器失败: ${error.message}` 
    }
  }
})

// 添加检查浏览器状态的 IPC 处理函数
ipcMain.handle('check-browser-status', async (): Promise<boolean> => {
  try {
    const status = await checkBrowserStatus()
    return status
  } catch (error) {
    console.error('检查浏览器状态失败:', error)
    return false
  }
})

// 添加强制重启浏览器的 IPC 处理函数
ipcMain.handle('force-restart-browser', async (): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('收到强制重启浏览器请求...')
    
    // 强制重启浏览器
    await forceRestartBrowser()
    
    console.log('浏览器强制重启成功')
    return { 
      success: true, 
      message: '浏览器重启成功！' 
    }
  } catch (error) {
    console.error('强制重启游览器失败:', error)
    return { 
      success: false, 
      message: `重启游览器失败: ${error.message}` 
    }
  }
})
