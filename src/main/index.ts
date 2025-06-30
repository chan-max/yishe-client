// 文件顶部已有该导入
import { app, shell, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/favicon.png?asset'
import puppeteer from 'puppeteer'
import { publishToXiaohongshu } from './xiaohongshu'
import { publishToDouyin } from './douyin'
import { publishToKuaishou } from './kuaishou'
import { spawn } from 'child_process'
import { homedir } from 'os'
import { join as pathJoin } from 'path'
import { startServer } from './server';

// 扩展app对象的类型
declare global {
  namespace NodeJS {
    interface Global {
      app: Electron.App & { isQuiting?: boolean }
    }
  }
}

// 为app对象添加isQuiting属性
;(app as any).isQuiting = false

// 全局变量
let tray: Tray | null = null
let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
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
    mainWindow?.show()
    // 在开发模式下启用开发者工具（已注释掉，默认不打开）
    // if (is.dev) {
    //   mainWindow?.webContents.openDevTools()
    // }
  })

  mainWindow.on('close', async (event) => {
    if (!(app as any).isQuiting) {
      event.preventDefault()
      
      // 显示退出确认对话框
      const result = await dialog.showMessageBox(mainWindow!, {
        type: 'question',
        buttons: ['退到托盘', '直接退出', '取消'],
        defaultId: 0,
        cancelId: 2,
        title: '退出确认',
        message: '退出客户端后将无法提供服务',
        detail: '您可以选择退到托盘继续运行，或者直接退出程序。',
        icon: icon
      })
      
      switch (result.response) {
        case 0: // 退到托盘
          mainWindow?.hide()
          break
        case 1: // 直接退出
          (app as any).isQuiting = true
          app.quit()
          break
        case 2: // 取消
          // 不做任何操作，窗口保持打开
          break
      }
    }
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

// 创建系统托盘
function createTray(): void {
  // 创建托盘图标
  const trayIcon = nativeImage.createFromPath(icon)
  trayIcon.resize({ width: 16, height: 16 })
  
  tray = new Tray(trayIcon)
  tray.setToolTip('衣设程序')
  
  // 创建托盘菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主窗口',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        }
      }
    },
    {
      label: '隐藏主窗口',
      click: () => {
        mainWindow?.hide()
      }
    },
    { type: 'separator' },
    {
      label: '服务器状态',
      submenu: [
        {
          label: '检查本地服务',
          click: async () => {
            try {
              const response = await fetch('http://localhost:1519/api/health')
              if (response.ok) {
                // 可以显示通知或更新托盘菜单
                console.log('本地服务运行正常')
              }
            } catch (error) {
              console.log('本地服务未运行')
            }
          }
        },
        {
          label: '检查远程服务',
          click: async () => {
            try {
              const response = await fetch('https://1s.design:1520/api/test')
              if (response.ok) {
                console.log('远程服务连接正常')
              }
            } catch (error) {
              console.log('远程服务连接失败')
            }
          }
        }
      ]
    },
    { type: 'separator' },
    {
      label: '退出程序',
      click: async () => {
        // 显示退出确认对话框
        const result = await dialog.showMessageBox(mainWindow!, {
          type: 'question',
          buttons: ['确认退出', '取消'],
          defaultId: 1,
          cancelId: 1,
          title: '退出确认',
          message: '确定要退出衣设程序吗？',
          detail: '退出后将无法提供服务。',
          icon: icon
        })
        
        if (result.response === 0) {
          (app as any).isQuiting = true
          app.quit()
        }
      }
    }
  ])
  
  tray.setContextMenu(contextMenu)
  
  // 托盘图标点击事件
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
        mainWindow.focus()
      }
    }
  })
  
  // 托盘图标双击事件
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    }
  })
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

  // 退出确认IPC处理器
  ipcMain.handle('confirm-exit', async () => {
    if (!mainWindow) return
    
    const result = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: ['退到托盘', '直接退出', '取消'],
      defaultId: 0,
      cancelId: 2,
      title: '退出确认',
      message: '退出客户端后将无法提供服务',
      detail: '您可以选择退到托盘继续运行，或者直接退出程序。',
      icon: icon
    })
    
    switch (result.response) {
      case 0: // 退到托盘
        mainWindow.hide()
        return 'tray'
      case 1: // 直接退出
        (app as any).isQuiting = true
        app.quit()
        return 'quit'
      case 2: // 取消
        return 'cancel'
    }
  })

  createWindow()
  
  // 创建系统托盘
  createTray()

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
    // 在Windows和Linux上，不要直接退出，而是隐藏窗口
    // app.quit()
  }
})

// 应用退出时清理托盘
app.on('before-quit', () => {
  if (tray) {
    tray.destroy()
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

// 添加托盘相关的IPC监听器
ipcMain.handle('show-tray-notification', async (_, options: { title: string; body: string }) => {
  if (tray) {
    tray.displayBalloon({
      title: options.title,
      content: options.body,
      icon: icon
    })
  }
})

ipcMain.handle('update-tray-tooltip', async (_, tooltip: string) => {
  if (tray) {
    tray.setToolTip(tooltip)
  }
})

ipcMain.handle('hide-main-window', async () => {
  if (mainWindow) {
    mainWindow.hide()
  }
})

ipcMain.handle('show-main-window', async () => {
  if (mainWindow) {
    mainWindow.show()
    mainWindow.focus()
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
