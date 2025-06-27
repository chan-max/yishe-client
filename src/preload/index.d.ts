import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      startPublish(params: Record<string, unknown>): Promise<void>
      startBrowser(): Promise<{ success: boolean; message: string }>
      checkBrowserStatus(): Promise<boolean>
      forceRestartBrowser(): Promise<{ success: boolean; message: string }>
    }
  }
}
