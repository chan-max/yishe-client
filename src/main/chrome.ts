import { spawn } from 'child_process'
import { homedir } from 'os'
import { join as pathJoin } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function isPortInUse(port: number): Promise<boolean> {
  try {
    if (process.platform === 'darwin') {
      const { stdout } = await execAsync(`lsof -i :${port}`)
      return stdout.length > 0
    } else if (process.platform === 'win32') {
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`)
      return stdout.length > 0
    }
    return false
  } catch (error) {
    return false
  }
}

export async function startChrome(): Promise<void> {
  // 检查端口9222是否被占用
  const isPortUsed = await isPortInUse(9222)
  if (isPortUsed) {
    console.log('调试端口9222已被占用，Chrome可能已经在运行')
    return
  }

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
    '--no-default-browser-check',
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--disable-dev-shm-usage'
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
    setTimeout(resolve, 3000)
  })
} 