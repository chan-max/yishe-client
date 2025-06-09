import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/test.jpeg?asset'
import puppeteer from 'puppeteer-core'
import { SocialMediaUploadUrl } from './const'
import { publishToXiaohongshu } from './xiaohongshu'
import { publishToDouyin } from './douyin'
import { publishToKuaishou } from './kuaishou'
import { spawn } from 'child_process'
import { homedir } from 'os'
import { join as pathJoin } from 'path'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
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
app.whenReady().then(() => {
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

// 添加Chrome启动函数
async function startChrome(): Promise<void> {
  const userDataDir = pathJoin(homedir(), '.yishe-chrome-profile')
  const chromePath = process.platform === 'darwin' 
    ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    : process.platform === 'win32'
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    : 'google-chrome'

  const args = [
    '--remote-debugging-port=9222',
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check'
  ]

  return new Promise((resolve, reject) => {
    const chrome = spawn(chromePath, args)
    
    chrome.stdout?.on('data', (data) => {
      console.log(`Chrome stdout: ${data}`)
    })

    chrome.stderr?.on('data', (data) => {
      console.log(`Chrome stderr: ${data}`)
    })

    chrome.on('error', (err) => {
      console.error('启动Chrome失败:', err)
      reject(err)
    })

    // 给Chrome一些启动时间
    setTimeout(resolve, 2000)
  })
}

// 修改handlePublish函数
async function handlePublish(params: Record<string, unknown>): Promise<void> {
  try {
    console.log('开始执行发布操作，参数:', params)
    
    // 尝试连接到Chrome浏览器
    let browser;
    try {
      browser = await puppeteer.connect({
        browserURL: 'http://localhost:9222',
        defaultViewport: null
      });
      console.log('浏览器连接成功');
    } catch (connectError) {
      console.error('连接浏览器失败，尝试启动Chrome:', connectError);
      // 如果连接失败，尝试启动Chrome
      await startChrome();
      
      // 再次尝试连接
      browser = await puppeteer.connect({
        browserURL: 'http://localhost:9222',
        defaultViewport: null
      });
      console.log('浏览器启动并连接成功');
    }
    
    const page = await browser.newPage();
    console.log('新页面创建成功');
    
    await page.goto(SocialMediaUploadUrl.xiaohongshu_pic);
    console.log('已打开小红书发布页面');

    // 等待文件选择器出现
    await page.waitForSelector('input[type="file"]');
    console.log('找到文件选择器');

    // 设置文件上传路径
    const fileInput = await page.$('input[type="file"]');
    if (!fileInput) {
      throw new Error('未找到文件选择器');
    }

    // 获取图片的绝对路径
    const imagePath = is.dev 
      ? pathJoin(__dirname, '../../resources/test.jpeg')  // 开发环境
      : pathJoin(process.resourcesPath, 'resources/test.jpeg');  // 生产环境
    
    console.log('图片路径:', imagePath);
    await fileInput.uploadFile(imagePath);
    console.log('已选择图片文件');

    // 等待图片上传完成
    await page.waitForTimeout(2000); // 给一些时间让图片上传
    
  } catch (error) {
    console.error('发布过程出错:', error);
    throw error;
  }
}

// 添加 IPC 监听器
ipcMain.handle('start-publish', async (_, params): Promise<void> => {
  console.log('收到发布请求，参数:', params)
  publishToXiaohongshu()
  publishToDouyin()
  publishToKuaishou()
})
