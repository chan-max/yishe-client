import { spawn } from 'child_process'
import { homedir } from 'os'
import { join as pathJoin } from 'path'

export async function startChrome(): Promise<void> {
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