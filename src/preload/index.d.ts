import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      startPublish(params: Record<string, unknown>): Promise<void>
      showTrayNotification(options: { title: string; body: string }): Promise<void>
      updateTrayTooltip(tooltip: string): Promise<void>
      hideMainWindow(): Promise<void>
      showMainWindow(): Promise<void>
      confirmExit(): Promise<'tray' | 'quit' | 'cancel'>
      getAppVersion(): Promise<string>
      checkSocialMediaLogin(): Promise<Record<string, { isLoggedIn: boolean; status: string; message: string }>>
    }
  }
}
