// 文件顶部已有该导入
import { app, shell, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/favicon.png?asset'
import puppeteer from 'puppeteer'
// 暂时注释掉发布服务相关引用，代码保留但不使用
// import { publishToXiaohongshu } from './xiaohongshu'
// import { publishToDouyin } from './douyin'
// import { publishToKuaishou } from './kuaishou'
import { spawn } from 'child_process'
import { homedir } from 'os'
import { join as pathJoin } from 'path'
import { startServer, getOrCreateBrowser } from './server';
// 暂时注释掉发布服务相关引用，代码保留但不使用
// import { PublishService } from './publishService';
import { connectionManager } from './connectionManager';
import { networkMonitor } from './networkMonitor';

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

// 防止重复显示协议错误弹窗的标记
let protocolErrorDialogShown = false;
let protocolErrorDialogTimeout: NodeJS.Timeout | null = null;

// 设置连接管理器事件监听
function setupConnectionManagerEvents(): void {
  // 连接成功事件
  connectionManager.on('connected', () => {
    console.log('✅ 浏览器连接成功');
    if (mainWindow) {
      mainWindow.webContents.send('connection-status', { isConnected: true });
    }
  });

  // 连接错误事件
  connectionManager.on('error', async (error) => {
    console.error('❌ 浏览器连接错误:', error);
    if (mainWindow) {
      mainWindow.webContents.send('connection-status', { 
        isConnected: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }

    // 检查是否是协议错误，如果是则显示用户弹窗
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('Protocol error') || errorMessage.includes('Connection closed')) {
      console.log('🔄 检测到协议错误，显示用户提示弹窗...');
      await showProtocolErrorDialog();
    }
  });

  // 重连事件
  connectionManager.on('reconnecting', () => {
    console.log('🔄 正在重新连接...');
    if (mainWindow) {
      mainWindow.webContents.send('connection-status', { isConnected: false, reconnecting: true });
    }
  });

  // 状态变化事件
  connectionManager.on('statusChanged', (status) => {
    console.log('📊 连接状态变化:', status);
    if (mainWindow) {
      mainWindow.webContents.send('connection-status', status);
    }
  });

  // 操作成功事件
  connectionManager.on('operationSuccess', (operationName) => {
    console.log(`✅ 操作成功: ${operationName}`);
  });

  // 操作失败事件
  connectionManager.on('operationFailed', async (operationName, error) => {
    console.error(`❌ 操作失败: ${operationName}`, error);
    
    // 检查是否是协议错误，如果是则显示用户弹窗
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('Protocol error') || errorMessage.includes('Connection closed')) {
      console.log('🔄 操作失败检测到协议错误，显示用户提示弹窗...');
      await showProtocolErrorDialog();
    }
  });

  // 达到最大重试次数事件
  connectionManager.on('maxRetriesReached', () => {
    console.warn('⚠️ 已达到最大重试次数');
    if (mainWindow) {
      mainWindow.webContents.send('connection-status', { 
        isConnected: false, 
        maxRetriesReached: true 
      });
    }
  });

  // 重连准备就绪事件
  connectionManager.on('reconnectReady', async () => {
    console.log('🔄 重连准备就绪，重新创建浏览器实例...');
    try {
      // 重新创建浏览器实例
      const newBrowser = await getOrCreateBrowser();
      connectionManager.setBrowser(newBrowser);
      console.log('✅ 浏览器实例重新创建成功');
    } catch (error) {
      console.error('❌ 重新创建浏览器实例失败:', error);
    }
  });

  // 达到最大重连次数事件
  connectionManager.on('maxReconnectAttemptsReached', async () => {
    console.warn('⚠️ 已达到最大重连次数');
    if (mainWindow) {
      mainWindow.webContents.send('connection-status', { 
        isConnected: false, 
        maxReconnectAttemptsReached: true 
      });
    }
    
    // 达到最大重连次数时也显示用户弹窗
    await showProtocolErrorDialog();
  });

  // 网络监控事件
  networkMonitor.on('networkLost', (status) => {
    console.error('🌐 网络连接丢失');
    if (mainWindow) {
      mainWindow.webContents.send('network-status', { 
        isOnline: false, 
        status 
      });
    }
  });

  networkMonitor.on('networkRestored', (status) => {
    console.log('🌐 网络连接已恢复');
    if (mainWindow) {
      mainWindow.webContents.send('network-status', { 
        isOnline: true, 
        status 
      });
    }
  });

  networkMonitor.on('statusChanged', (status) => {
    if (mainWindow) {
      mainWindow.webContents.send('network-status', status);
    }
  });
}

/**
 * 显示协议错误提示弹窗
 */
async function showProtocolErrorDialog(): Promise<void> {
  // 防止重复显示弹窗
  if (protocolErrorDialogShown) {
    console.log('协议错误弹窗已显示，跳过重复显示');
    return;
  }

  if (!mainWindow) {
    console.warn('主窗口不存在，无法显示弹窗');
    return;
  }

  try {
    // 设置弹窗显示标记
    protocolErrorDialogShown = true;
    
    // 清除之前的超时
    if (protocolErrorDialogTimeout) {
      clearTimeout(protocolErrorDialogTimeout);
    }
    
    // 设置5分钟后重置标记，允许再次显示弹窗
    protocolErrorDialogTimeout = setTimeout(() => {
      protocolErrorDialogShown = false;
      protocolErrorDialogTimeout = null;
    }, 5 * 60 * 1000); // 5分钟

    const result = await dialog.showMessageBox(mainWindow, {
      type: 'warning',
      buttons: ['关闭客户端', '稍后重试', '取消'],
      defaultId: 0,
      cancelId: 2,
      title: '连接错误',
      message: '检测到浏览器连接协议错误',
      detail: '建议关闭客户端后重新启动以恢复连接。\n\n错误类型：Protocol error: Connection closed\n\n如果问题持续存在，请检查网络连接或联系技术支持。',
      icon: icon
    });

    switch (result.response) {
      case 0: // 关闭客户端
        console.log('用户选择关闭客户端');
        (app as any).isQuiting = true;
        app.quit();
        break;
      case 1: // 稍后重试
        console.log('用户选择稍后重试');
        // 重置弹窗标记，允许用户稍后再次看到弹窗
        protocolErrorDialogShown = false;
        if (protocolErrorDialogTimeout) {
          clearTimeout(protocolErrorDialogTimeout);
          protocolErrorDialogTimeout = null;
        }
        break;
      case 2: // 取消
        console.log('用户取消操作');
        // 重置弹窗标记，允许用户稍后再次看到弹窗
        protocolErrorDialogShown = false;
        if (protocolErrorDialogTimeout) {
          clearTimeout(protocolErrorDialogTimeout);
          protocolErrorDialogTimeout = null;
        }
        break;
    }
  } catch (error) {
    console.error('显示协议错误弹窗失败:', error);
    // 出错时重置标记
    protocolErrorDialogShown = false;
    if (protocolErrorDialogTimeout) {
      clearTimeout(protocolErrorDialogTimeout);
      protocolErrorDialogTimeout = null;
    }
  }
}

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

  // 设置连接管理器事件监听
  setupConnectionManagerEvents();

  // 启动网络监控
  networkMonitor.start();

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
  const { nativeImage } = require('electron')
  const path = require('path')
  let trayIconPath: string
  if (process.platform === 'win32') {
    trayIconPath = path.join(__dirname, '../../resources/tray-icon.ico')
  } else {
    trayIconPath = path.join(__dirname, '../../resources/tray-icon.png')
  }
  let trayIcon = nativeImage.createFromPath(trayIconPath)
  // 只在 macOS 下 resize
  if (process.platform === 'darwin') {
    trayIcon = trayIcon.resize({ width: 20, height: 20 })
  }
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

// 应用退出时清理资源
app.on('before-quit', async () => {
  console.log('🔄 应用即将退出，清理资源...');
  
  // 清理协议错误弹窗相关资源
  if (protocolErrorDialogTimeout) {
    clearTimeout(protocolErrorDialogTimeout);
    protocolErrorDialogTimeout = null;
  }
  protocolErrorDialogShown = false;
  
  // 停止网络监控
  await networkMonitor.cleanup();
  
  // 清理连接管理器
  await connectionManager.cleanup();
  
  // 清理托盘
  if (tray) {
    tray.destroy()
  }
  
  console.log('✅ 资源清理完成');
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

ipcMain.handle('get-app-version', () => app.getVersion())

// 暂时注释掉发布服务相关功能
// 在主进程暴露社交媒体登录状态检测方法
// ipcMain.handle('check-social-media-login', async (_, forceRefresh: boolean = false) => {
//   try {
//     // 如果强制刷新，先清除缓存
//     if (forceRefresh) {
//       console.log('[IPC] 强制刷新模式，清除缓存');
//       PublishService.clearLoginStatusCache();
//     }
//     
//     // 直接调用PublishService方法，传递forceRefresh参数
//     const result = await PublishService.checkSocialMediaLoginStatus(forceRefresh);
//     return {
//       code: 0,
//       status: true,
//       data: result,
//       timestamp: new Date().toISOString()
//     };
//   } catch (error) {
//     console.error('检查社交媒体登录状态失败:', error);
//     return {
//       code: 1,
//       status: false,
//       msg: '检查失败',
//       error: error instanceof Error ? error.message : '未知错误',
//       timestamp: new Date().toISOString()
//     };
//   }
// });



ipcMain.handle('open-external', async (event, url: string) => {
  await shell.openExternal(url);
});
