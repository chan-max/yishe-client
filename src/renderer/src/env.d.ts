/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-06-08 23:07:32
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-06-11 19:54:36
 * @FilePath: /yishe-electron/src/renderer/src/env.d.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/// <reference types="vite/client" />

interface Window {
  electron: {
    ipcRenderer: {
      send(channel: string, ...args: any[]): void
      on(channel: string, func: (...args: any[]) => void): void
      once(channel: string, func: (...args: any[]) => void): void
    }
  }
  api: {
    startPublish(params: Record<string, unknown>): Promise<void>
  }
}
