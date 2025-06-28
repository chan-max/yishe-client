import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      startPublish(params: Record<string, unknown>): Promise<void>
    }
  }
}
