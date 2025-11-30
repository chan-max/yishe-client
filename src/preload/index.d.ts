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
      checkSocialMediaLogin(forceRefresh?: boolean): Promise<Record<string, { isLoggedIn: boolean; status: string; message: string }>>
      testPublishToSocialMedia(): Promise<{
        code: number;
        status: boolean;
        message: string;
        data?: {
          platforms: any[];
          results: any[];
          timestamp: string;
        };
        msg?: string;
        error?: string;
      }>
      saveToken(token: string): Promise<boolean>
      getToken(): Promise<string | undefined>
      isTokenExist(): Promise<boolean>
      onConnectionStatus(callback: (status: any) => void): void
      getConnectionStatus(): Promise<any>
      reconnect(): Promise<any>
      openExternal(url: string): Promise<void>
      openAllMediaPages(): Promise<any>
      // 工作目录相关方法
      selectWorkspaceDirectory(): Promise<string | null>
      getWorkspaceDirectory(): Promise<string>
      setWorkspaceDirectory(path: string): Promise<boolean>
      // 文件下载相关方法
      downloadFile(url: string): Promise<{
        success: boolean
        message: string
        filePath?: string
        skipped?: boolean
        fileSize?: number
        error?: string
        statusCode?: number
      }>
      // 文件查询相关方法
      checkFileDownloaded(url: string): Promise<{
        found: boolean
        filePath?: string | null
        fileSize?: number
        message: string
        error?: string
      }>
    }
  }
}
