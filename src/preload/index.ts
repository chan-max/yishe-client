/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-06-08 23:07:32
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-06-11 19:54:06
 * @FilePath: /yishe-electron/src/preload/index.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  startPublish: (params: Record<string, unknown>) => ipcRenderer.invoke('start-publish', params),
  showTrayNotification: (options: { title: string; body: string }) => ipcRenderer.invoke('show-tray-notification', options),
  updateTrayTooltip: (tooltip: string) => ipcRenderer.invoke('update-tray-tooltip', tooltip),
  hideMainWindow: () => ipcRenderer.invoke('hide-main-window'),
  showMainWindow: () => ipcRenderer.invoke('show-main-window'),
  confirmExit: () => ipcRenderer.invoke('confirm-exit'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  checkSocialMediaLogin: () => ipcRenderer.invoke('check-social-media-login'),
  testPublishToSocialMedia: () => ipcRenderer.invoke('test-publish-to-social-media'),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  openAllMediaPages: () => fetch('http://localhost:1519/api/openAllMediaPages', { method: 'POST' }).then(res => res.json()),
  // 新增 token 相关方法
  saveToken: (token: string) => ipcRenderer.invoke('save-token', token),
  getToken: () => ipcRenderer.invoke('get-token'),
  isTokenExist: () => ipcRenderer.invoke('is-token-exist'),
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
